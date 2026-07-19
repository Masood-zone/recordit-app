import { createHash, randomUUID } from "node:crypto"

import {
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceVerificationMethod,
  AuditAction,
  BiometricScanPurpose,
  BiometricScanStatus,
  FingerprintTemplateStatus,
  FingerLabel,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

export const fingerLabels = Object.values(FingerLabel)

type ActorScope = {
  schoolId: string
  userId: string
  teacherId?: string
  restrictToAssignedClasses?: boolean
}

type DevicePayload = {
  name?: string
  serialNumber?: string | null
  bridgeUrl?: string | null
  model?: string | null
}

type CachedDevice = { expiresAt: number; id: string }

const globalForBiometric = globalThis as typeof globalThis & {
  recorditDeviceCache?: Map<string, CachedDevice>
}
const deviceCache =
  globalForBiometric.recorditDeviceCache ?? new Map<string, CachedDevice>()

if (process.env.NODE_ENV !== "production") {
  globalForBiometric.recorditDeviceCache = deviceCache
}

const DEVICE_CACHE_TTL_MS = 5 * 60 * 1000

export function normalizeFingerLabel(value: unknown) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_")

  if (raw === "LEFT") return FingerLabel.LEFT_THUMB
  if (raw === "RIGHT") return FingerLabel.RIGHT_THUMB
  return fingerLabels.includes(raw as FingerLabel) ? (raw as FingerLabel) : null
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function optionalDate(value: unknown) {
  const text = clean(value)
  if (!text) return undefined
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function optionalClientRequestId(value: unknown) {
  const text = clean(value)
  return text.length > 0 ? text : undefined
}

function templatePayload(template9: string, template10: string, fpId?: number | null) {
  return Buffer.from(JSON.stringify({ fpId: fpId ?? null, template9, template10 }), "utf8")
}

function templateHash(template10: string) {
  return createHash("sha256").update(template10).digest("hex")
}

async function ensureDevice(schoolId: string, device?: DevicePayload) {
  const serialNumber = clean(device?.serialNumber) || null
  const bridgeUrl = clean(device?.bridgeUrl) || "http://127.0.0.1:5050"
  const cacheKey = `${schoolId}:${serialNumber || bridgeUrl}`
  const cached = deviceCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return { id: cached.id }

  const existing = serialNumber
    ? await prisma.biometricDevice.findUnique({
        where: { schoolId_serialNumber: { schoolId, serialNumber } },
        select: { id: true, model: true, name: true },
      })
    : await prisma.biometricDevice.findFirst({
        where: { schoolId, bridgeUrl },
        select: { id: true, model: true, name: true },
      })

  if (existing) {
    const saved = await prisma.biometricDevice.update({
      where: { id: existing.id },
      data: {
        bridgeUrl,
        lastSeenAt: new Date(),
        model: clean(device?.model) || existing.model,
        name: clean(device?.name) || existing.name,
        serialNumber,
      },
      select: { id: true },
    })
    deviceCache.set(cacheKey, { expiresAt: Date.now() + DEVICE_CACHE_TTL_MS, id: saved.id })
    return saved
  }

  const saved = await prisma.biometricDevice.create({
    data: {
      bridgeUrl,
      lastSeenAt: new Date(),
      model: clean(device?.model) || "ZKTeco ZK9500",
      name: clean(device?.name) || "Local fingerprint bridge",
      schoolId,
      serialNumber,
    },
    select: { id: true },
  })
  deviceCache.set(cacheKey, { expiresAt: Date.now() + DEVICE_CACHE_TTL_MS, id: saved.id })
  return saved
}

async function assertStudentScope(scope: ActorScope, studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId: scope.schoolId,
      ...(scope.restrictToAssignedClasses
        ? { class: { teacherAssignments: { some: { teacherId: scope.teacherId } } } }
        : {}),
    },
    select: {
      class: { select: { id: true, name: true } },
      classId: true,
      firstName: true,
      id: true,
      lastName: true,
      schoolId: true,
      studentNumber: true,
    },
  })

  return student
}

export async function getTemplateSyncRoster(scope: ActorScope) {
  type RosterRow = {
    className: string | null
    finger: FingerLabel | null
    fingerprintId: string | null
    firstName: string
    lastName: string
    otherName: string | null
    studentId: string
    studentNumber: string
    templateData: Uint8Array | null
  }

  const teacherFilter = scope.restrictToAssignedClasses
    ? `AND EXISTS (
        SELECT 1 FROM "ClassTeacher" ct
        WHERE ct."classId" = s."classId" AND ct."teacherId" = $2
      )`
    : ""
  const rows = await prisma.$queryRawUnsafe<RosterRow[]>(
    `SELECT
      s.id AS "studentId",
      s."studentNumber",
      s."firstName",
      s."otherName",
      s."lastName",
      c.name AS "className",
      ft.id AS "fingerprintId",
      ft.finger,
      ft."templateData"
    FROM "Student" s
    LEFT JOIN "Class" c ON c.id = s."classId"
    LEFT JOIN "FingerprintTemplate" ft
      ON ft."studentId" = s.id AND ft.status = 'ACTIVE'
    WHERE s."schoolId" = $1 AND s."isActive" = true
      ${teacherFilter}
    ORDER BY s."lastName" ASC, s."firstName" ASC`,
    scope.schoolId,
    ...(scope.restrictToAssignedClasses ? [scope.teacherId] : [])
  )

  const students = new Map<string, {
    className: string
    fingers: Array<{ finger: FingerLabel; templateData: Uint8Array }>
    name: string
    studentId: string
    studentNumber: string
  }>()
  for (const row of rows) {
    const student = students.get(row.studentId) ?? {
      className: row.className || "Unassigned",
      fingers: [],
      name: [row.firstName, row.otherName, row.lastName].filter(Boolean).join(" "),
      studentId: row.studentId,
      studentNumber: row.studentNumber,
    }
    if (row.finger && row.fingerprintId && row.templateData) {
      student.fingers.push({ finger: row.finger, templateData: row.templateData })
    }
    students.set(row.studentId, student)
  }

  return Array.from(students.values()).map((student) => ({
    className: student.className,
    name: student.name,
    studentId: student.studentId,
    studentNumber: student.studentNumber,
    fingers: student.fingers
      .map((fingerprint) => {
        try {
          const parsed = JSON.parse(Buffer.from(fingerprint.templateData).toString("utf8")) as {
            fpId?: number
            template9?: string
            template10?: string
          }
          if (!parsed.template9 || !parsed.template10) return null
          return {
            finger: fingerprint.finger,
            fpId: parsed.fpId,
            template9: parsed.template9,
            template10: parsed.template10,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean),
  }))
}

export async function persistFingerprintEnrollment(scope: ActorScope, input: Record<string, unknown>) {
  const studentId = clean(input.studentId)
  const finger = normalizeFingerLabel(input.finger)
  const template9 = clean(input.template9)
  const template10 = clean(input.template10)
  const fpId = Number(input.fpId || 0) || null
  const qualityScore = Number(input.qualityScore || input.lastQuality || 0) || null

  if (!studentId || !finger || !template9 || !template10) {
    throw new Error("Student, finger, and both SDK templates are required")
  }

  const [student, device, existing] = await Promise.all([
    assertStudentScope(scope, studentId),
    ensureDevice(scope.schoolId, input.device as DevicePayload | undefined),
    prisma.fingerprintTemplate.findFirst({
      where: { studentId, finger, status: FingerprintTemplateStatus.ACTIVE },
      select: { id: true },
    }),
  ])
  if (!student) throw new Error("Student not found")

  const data = {
    deviceId: device.id,
    enrolledByUserId: scope.userId,
    finger,
    qualityScore,
    schoolId: scope.schoolId,
    sdkFormat: "ZKFinger SDK 9/10",
    status: FingerprintTemplateStatus.ACTIVE,
    studentId,
    templateData: templatePayload(template9, template10, fpId),
    templateHash: templateHash(template10),
  }

  const fingerprintId = existing?.id ?? randomUUID()
  const [saved] = await prisma.$transaction([
    existing
      ? prisma.fingerprintTemplate.update({ where: { id: fingerprintId }, data })
      : prisma.fingerprintTemplate.create({ data: { ...data, id: fingerprintId } }),
    prisma.biometricScanLog.create({
      data: {
        deviceId: device.id,
        matchScore: qualityScore,
        message: `Enrolled ${finger}`,
        performedById: scope.userId,
        purpose: BiometricScanPurpose.ENROLLMENT,
        schoolId: scope.schoolId,
        status: BiometricScanStatus.SUCCESS,
        studentId,
        templateId: fingerprintId,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.ENROLL_FINGERPRINT,
        description: `Enrolled ${finger} for ${student.firstName} ${student.lastName}.`,
        entity: "FingerprintTemplate",
        entityId: fingerprintId,
        schoolId: scope.schoolId,
        userId: scope.userId,
      },
    }),
  ])

  return { fingerprint: saved, student }
}

async function classWhere(scope: ActorScope, classId?: string) {
  if (!classId) return null
  return prisma.class.findFirst({
    where: {
      id: classId,
      schoolId: scope.schoolId,
      ...(scope.restrictToAssignedClasses
        ? { teacherAssignments: { some: { teacherId: scope.teacherId } } }
        : {}),
    },
    select: { id: true, name: true },
  })
}

async function queryAttendanceSessions(scope: ActorScope, sessionId?: string) {
  const parameters: unknown[] = [scope.schoolId]
  const teacherFilter = scope.restrictToAssignedClasses
    ? `AND (
        s."teacherId" = $2 OR EXISTS (
          SELECT 1 FROM "ClassTeacher" ct
          WHERE ct."classId" = s."classId" AND ct."teacherId" = $2
        )
      )`
    : ""
  if (scope.restrictToAssignedClasses) parameters.push(scope.teacherId)
  const sessionFilter = sessionId ? `AND s.id = $${parameters.length + 1}` : ""
  if (sessionId) parameters.push(sessionId)

  return prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT
      s.id,
      s."classId",
      s.title,
      s."sessionDate",
      s."startsAt",
      s."endsAt",
      s.status,
      s."createdAt",
      CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'code', c.code
      ) END AS class,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'fingerprintMatched', r."fingerprintMatched",
            'fingerprintScore', r."fingerprintScore",
            'markedAt', r."markedAt",
            'remarks', r.remarks,
            'status', r.status,
            'verificationMethod', r."verificationMethod",
            'student', jsonb_build_object(
              'id', st.id,
              'firstName', st."firstName",
              'lastName', st."lastName",
              'photoUrl', st."photoUrl",
              'studentNumber', st."studentNumber"
            )
          ) ORDER BY r."markedAt" DESC
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'::jsonb
      ) AS records,
      jsonb_build_object('records', COUNT(r.id)) AS _count
    FROM (
      SELECT s.* FROM "AttendanceSession" s
      WHERE s."schoolId" = $1
        ${teacherFilter}
        ${sessionFilter}
      ORDER BY "sessionDate" DESC, "createdAt" DESC
      LIMIT ${sessionId ? 1 : 30}
    ) s
    LEFT JOIN "Class" c ON c.id = s."classId"
    LEFT JOIN "AttendanceRecord" r ON r."sessionId" = s.id
    LEFT JOIN "Student" st ON st.id = r."studentId"
    GROUP BY s.id, s."classId", s.title, s."sessionDate", s."startsAt", s."endsAt",
      s.status, s."createdAt", c.id, c.name, c.code
    ORDER BY s."sessionDate" DESC, s."createdAt" DESC`,
    ...parameters
  )
}

export async function listAttendanceSessions(scope: ActorScope) {
  return queryAttendanceSessions(scope)
}

export async function getAttendanceSetup(scope: ActorScope) {
  const classScope = scope.restrictToAssignedClasses
    ? { teacherAssignments: { some: { teacherId: scope.teacherId } } }
    : {}
  const studentScope = scope.restrictToAssignedClasses
    ? { class: { teacherAssignments: { some: { teacherId: scope.teacherId } } } }
    : {}

  const [classes, sessions, students] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: scope.schoolId, ...classScope },
      orderBy: { name: "asc" },
      select: { code: true, id: true, name: true },
    }),
    listAttendanceSessions(scope),
    prisma.student.findMany({
      where: { schoolId: scope.schoolId, isActive: true, ...studentScope },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        classId: true,
        firstName: true,
        id: true,
        lastName: true,
        otherName: true,
        studentNumber: true,
      },
    }),
  ])

  return { classes, sessions, students }
}

export async function openAttendanceSession(scope: ActorScope, input: Record<string, unknown>) {
  const classId = clean(input.classId)
  const [klass, year, term] = await Promise.all([
    classWhere(scope, classId),
    prisma.academicYear.findFirst({ where: { schoolId: scope.schoolId, isActive: true }, select: { id: true } }),
    prisma.academicTerm.findFirst({ where: { schoolId: scope.schoolId, isActive: true }, select: { id: true } }),
  ])
  if (!klass) throw new Error("Class not found")

  const sessionDate = clean(input.sessionDate) ? new Date(clean(input.sessionDate)) : new Date()
  const sessionType = clean(input.sessionType) || "Morning"
  const sessionId = randomUUID()

  await prisma.$transaction([
    prisma.attendanceSession.create({
      data: {
        id: sessionId,
        academicTermId: term?.id,
        academicYearId: year?.id,
        classId,
        createdByUserId: scope.userId,
        schoolId: scope.schoolId,
        sessionDate,
        startsAt: new Date(),
        status: AttendanceSessionStatus.OPEN,
        teacherId: scope.teacherId,
        title: `${klass.name} ${sessionType} Attendance`,
      },
      select: { id: true },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        description: `Opened attendance session for ${klass.name}.`,
        entity: "AttendanceSession",
        entityId: sessionId,
        schoolId: scope.schoolId,
        userId: scope.userId,
      },
    }),
  ])

  return getAttendanceSession(scope, sessionId)
}

async function getSessionForWrite(scope: ActorScope, sessionId: string) {
  return prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      schoolId: scope.schoolId,
      ...(scope.restrictToAssignedClasses
        ? {
            OR: [
              { teacherId: scope.teacherId },
              { class: { teacherAssignments: { some: { teacherId: scope.teacherId } } } },
            ],
          }
        : {}),
    },
    select: { classId: true, id: true, status: true, title: true },
  })
}

export async function getAttendanceSession(scope: ActorScope, sessionId: string) {
  const [session] = await queryAttendanceSessions(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  return session
}

async function notifyParentsForAttendance(recordId: string) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId },
    select: {
      id: true,
      markedAt: true,
      schoolId: true,
      status: true,
      studentId: true,
      session: {
        select: {
          class: { select: { name: true } },
          title: true,
        },
      },
      student: {
        select: {
          firstName: true,
          lastName: true,
          otherName: true,
          guardians: {
            select: {
              guardian: {
                select: {
                  id: true,
                  notificationPreferences: true,
                  user: { select: { id: true, email: true, name: true, phone: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!record || (record.status !== AttendanceStatus.ABSENT && record.status !== AttendanceStatus.LATE)) return

  const studentName = [record.student.firstName, record.student.otherName, record.student.lastName]
    .filter(Boolean)
    .join(" ")
  const type =
    record.status === AttendanceStatus.ABSENT
      ? NotificationType.ABSENCE_ALERT
      : NotificationType.LATENESS_ALERT
  const title =
    record.status === AttendanceStatus.ABSENT
      ? `${studentName} was marked absent`
      : `${studentName} was marked late`
  const message = `${studentName} was marked ${record.status.toLowerCase()} for ${
    record.session.title
  } on ${record.markedAt.toLocaleDateString()}.`

  const jobs = record.student.guardians.flatMap(({ guardian }) => {
    const prefs = guardian.notificationPreferences
    const wantsAlert =
      record.status === AttendanceStatus.ABSENT
        ? prefs?.absentAlerts !== false
        : prefs?.lateAlerts !== false
    if (!wantsAlert) return []

    const channels: NotificationChannel[] = []
    if (prefs?.inAppEnabled !== false) channels.push(NotificationChannel.IN_APP)
    if (prefs?.emailEnabled !== false && guardian.user.email) channels.push(NotificationChannel.EMAIL)
    if (prefs?.smsEnabled !== false && guardian.user.phone) channels.push(NotificationChannel.SMS)

    return channels.map((channel) =>
      prisma.notification.create({
        data: {
          attendanceRecordId: record.id,
          channel,
          message,
          schoolId: record.schoolId,
          sentAt: channel === NotificationChannel.IN_APP ? new Date() : undefined,
          status:
            channel === NotificationChannel.IN_APP
              ? NotificationStatus.SENT
              : NotificationStatus.PENDING,
          studentId: record.studentId,
          title,
          type,
          userId: guardian.user.id,
        },
      })
    )
  })

  await Promise.allSettled(jobs)
}

export async function recordFingerprintScan(scope: ActorScope, sessionId: string, input: Record<string, unknown>) {
  const studentId = clean(input.studentId)
  const finger = normalizeFingerLabel(input.finger)
  const score = Number(input.score || input.matchScore || 0) || null
  const clientRequestId = optionalClientRequestId(input.clientRequestId)
  const markedAt = optionalDate(input.capturedAt) || optionalDate(input.markedAt)
  const capturedOffline = input.capturedOffline === true || input.capturedOffline === "true"
  if (!studentId) throw new Error("Matched student is required")

  const [
    session,
    existingRequest,
    existingScanLog,
    student,
    device,
    template,
    existing,
  ] = await Promise.all([
    getSessionForWrite(scope, sessionId),
    clientRequestId
      ? prisma.attendanceRecord.findUnique({
          where: { clientRequestId },
          select: { id: true },
        })
      : Promise.resolve(null),
    clientRequestId
      ? prisma.biometricScanLog.findUnique({
          where: { clientRequestId },
          select: { id: true },
        })
      : Promise.resolve(null),
    assertStudentScope(scope, studentId),
    ensureDevice(scope.schoolId, input.device as DevicePayload | undefined),
    finger
      ? prisma.fingerprintTemplate.findFirst({
          where: { studentId, finger, status: FingerprintTemplateStatus.ACTIVE },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
      select: { id: true, status: true },
    }),
  ])

  if (!session) throw new Error("Attendance session not found")
  if (session.status !== AttendanceSessionStatus.OPEN) throw new Error("Attendance session is not open")
  if (existingRequest || existingScanLog) {
    return {
      duplicate: true,
      record: existingRequest,
      session: await getAttendanceSession(scope, sessionId),
    }
  }
  if (!student || student.classId !== session.classId) throw new Error("Student is not in this attendance class")

  const recordId = existing?.id ?? randomUUID()
  const scanLogId = randomUUID()
  const syncedAt = capturedOffline ? new Date() : null
  const [record] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `WITH saved AS (
      INSERT INTO "AttendanceRecord" (
        id, "schoolId", "sessionId", "studentId", "deviceId", "templateId",
        "clientRequestId", status, "markedAt", "markedByUserId", "verificationMethod",
        "fingerprintMatched", "fingerprintScore", "capturedOffline", "syncedAt",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'PRESENT', COALESCE($8, CURRENT_TIMESTAMP),
        $9, 'FINGERPRINT', true, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("sessionId", "studentId") DO UPDATE SET
        "deviceId" = EXCLUDED."deviceId",
        "templateId" = EXCLUDED."templateId",
        status = 'PRESENT',
        "markedAt" = COALESCE($8, "AttendanceRecord"."markedAt"),
        "markedByUserId" = EXCLUDED."markedByUserId",
        "verificationMethod" = 'FINGERPRINT',
        "fingerprintMatched" = true,
        "fingerprintScore" = EXCLUDED."fingerprintScore",
        "capturedOffline" = EXCLUDED."capturedOffline",
        "syncedAt" = EXCLUDED."syncedAt",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *
    ), logged AS (
      INSERT INTO "BiometricScanLog" (
        id, "schoolId", "studentId", "deviceId", "templateId", "performedById",
        "attendanceRecordId", "clientRequestId", purpose, status, "matchScore", message,
        "scannedAt"
      )
      SELECT
        $13, $2, $4, $5, $6, $9, saved.id, $7,
        'ATTENDANCE_VERIFICATION', 'SUCCESS', $10, $14, CURRENT_TIMESTAMP
      FROM saved
      RETURNING id
    )
    SELECT saved.* FROM saved, logged`,
    recordId,
    scope.schoolId,
    sessionId,
    studentId,
    device.id,
    template?.id ?? null,
    clientRequestId ?? null,
    markedAt ?? null,
    scope.userId,
    score,
    capturedOffline,
    syncedAt,
    scanLogId,
    existing ? "Student was already marked for this session" : "Fingerprint attendance recorded"
  )

  return { duplicate: Boolean(existing), record, session: await getAttendanceSession(scope, sessionId) }
}

export async function recordFailedScan(scope: ActorScope, sessionId: string, input: Record<string, unknown>) {
  const clientRequestId = optionalClientRequestId(input.clientRequestId)
  const [session, existing, device] = await Promise.all([
    getSessionForWrite(scope, sessionId),
    clientRequestId
      ? prisma.biometricScanLog.findUnique({
          where: { clientRequestId },
          select: { id: true },
        })
      : Promise.resolve(null),
    ensureDevice(scope.schoolId, input.device as DevicePayload | undefined),
  ])
  if (!session) throw new Error("Attendance session not found")
  if (existing) return { duplicate: true, sessionId }
  await prisma.biometricScanLog.create({
    data: {
      clientRequestId,
      deviceId: device.id,
      message: clean(input.message) || "Fingerprint was not matched",
      performedById: scope.userId,
      purpose: BiometricScanPurpose.IDENTIFICATION,
      schoolId: scope.schoolId,
      scannedAt: optionalDate(input.capturedAt) || undefined,
      status: BiometricScanStatus.NO_MATCH,
    },
  })
  return { duplicate: false, sessionId }
}

export async function syncAttendanceScans(scope: ActorScope, sessionId: string, input: Record<string, unknown>) {
  const items = Array.isArray(input.items) ? (input.items as Record<string, unknown>[]) : []

  const results = []
  for (const item of items) {
    const clientRequestId = clean(item.clientRequestId)
    try {
      const payload: Record<string, unknown> = {
        ...((item.payload && typeof item.payload === "object" ? item.payload : item) as Record<string, unknown>),
        action: item.action,
        capturedAt: item.capturedAt,
        capturedOffline: true,
        clientRequestId,
        device: item.device,
      }
      const result =
        payload.action === "close"
          ? { duplicate: false, session: await closeAttendanceSession(scope, sessionId) }
          : payload.action === "adjust"
            ? await adjustAttendanceRecord(scope, sessionId, clean(payload.studentId), payload)
            : payload.matched === false || payload.status === "NO_MATCH"
              ? await recordFailedScan(scope, sessionId, payload)
              : await recordFingerprintScan(scope, sessionId, payload)

      results.push({
        clientRequestId,
        status: "duplicate" in result && result.duplicate ? "duplicate" : "synced",
      })
    } catch (error) {
      results.push({
        clientRequestId,
        error: error instanceof Error ? error.message : "Sync failed",
        status: "failed",
      })
    }
  }

  return { results }
}

export async function adjustAttendanceRecord(
  scope: ActorScope,
  sessionId: string,
  studentId: string,
  input: Record<string, unknown>
) {
  const [session, student, existing] = await Promise.all([
    getSessionForWrite(scope, sessionId),
    assertStudentScope(scope, studentId),
    prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
      select: { id: true },
    }),
  ])
  if (!session) throw new Error("Attendance session not found")
  if (session.status === AttendanceSessionStatus.CLOSED) throw new Error("Attendance session is closed")
  if (!student || student.classId !== session.classId) throw new Error("Student is not in this attendance class")

  const status = clean(input.status).toUpperCase() as AttendanceStatus
  if (!Object.values(AttendanceStatus).includes(status)) throw new Error("Invalid attendance status")

  const recordId = existing?.id ?? randomUUID()
  const [record] = await prisma.$transaction([
    prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: {
        id: recordId,
        markedByUserId: scope.userId,
        remarks: clean(input.remarks) || null,
        schoolId: scope.schoolId,
        sessionId,
        status,
        studentId,
        verificationMethod: AttendanceVerificationMethod.MANUAL,
      },
      update: {
        markedAt: new Date(),
        markedByUserId: scope.userId,
        remarks: clean(input.remarks) || null,
        status,
        verificationMethod: AttendanceVerificationMethod.MANUAL,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        description: `Manual attendance adjustment: ${status}.`,
        entity: "AttendanceRecord",
        entityId: recordId,
        schoolId: scope.schoolId,
        userId: scope.userId,
      },
    }),
  ])

  const refreshedSession = getAttendanceSession(scope, sessionId)
  if (status === AttendanceStatus.ABSENT || status === AttendanceStatus.LATE) {
    const [, refreshed] = await Promise.all([
      notifyParentsForAttendance(record.id),
      refreshedSession,
    ])
    return { record, session: refreshed }
  }

  return { record, session: await refreshedSession }
}

export async function closeAttendanceSession(scope: ActorScope, sessionId: string) {
  const session = await getSessionForWrite(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  if (!session.classId) throw new Error("Attendance session has no class")

  const [students, existing] = await Promise.all([
    prisma.student.findMany({
      where: { classId: session.classId, schoolId: scope.schoolId, isActive: true },
      select: {
        firstName: true,
        id: true,
        lastName: true,
        otherName: true,
        guardians: {
          select: {
            guardian: {
              select: {
                notificationPreferences: true,
                user: { select: { email: true, id: true, phone: true } },
              },
            },
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { sessionId },
      select: { studentId: true },
    }),
  ])
  const marked = new Set(existing.map((item) => item.studentId))
  const missing = students.filter((student) => !marked.has(student.id))
  const markedAt = new Date()
  const createdMissing = missing.map((student) => ({ id: randomUUID(), student }))
  const notifications = createdMissing.flatMap(({ id: attendanceRecordId, student }) => {
    const studentName = [student.firstName, student.otherName, student.lastName]
      .filter(Boolean)
      .join(" ")
    const title = `${studentName} was marked absent`
    const message = `${studentName} was marked absent for ${session.title} on ${markedAt.toLocaleDateString()}.`

    return student.guardians.flatMap(({ guardian }) => {
      const prefs = guardian.notificationPreferences
      if (prefs?.absentAlerts === false) return []

      const channels: NotificationChannel[] = []
      if (prefs?.inAppEnabled !== false) channels.push(NotificationChannel.IN_APP)
      if (prefs?.emailEnabled !== false && guardian.user.email) channels.push(NotificationChannel.EMAIL)
      if (prefs?.smsEnabled !== false && guardian.user.phone) channels.push(NotificationChannel.SMS)

      return channels.map((channel) => ({
        attendanceRecordId,
        channel,
        message,
        schoolId: scope.schoolId,
        sentAt: channel === NotificationChannel.IN_APP ? markedAt : null,
        status:
          channel === NotificationChannel.IN_APP
            ? NotificationStatus.SENT
            : NotificationStatus.PENDING,
        studentId: student.id,
        title,
        type: NotificationType.ABSENCE_ALERT,
        userId: guardian.user.id,
      }))
    })
  })

  await prisma.$transaction([
    ...(createdMissing.length
      ? [
          prisma.attendanceRecord.createMany({
            data: createdMissing.map(({ id, student }) => ({
              id,
              markedAt,
              markedByUserId: scope.userId,
              remarks: "Automatically marked absent when session closed.",
              schoolId: scope.schoolId,
              sessionId,
              status: AttendanceStatus.ABSENT,
              studentId: student.id,
              verificationMethod: AttendanceVerificationMethod.MANUAL,
            })),
          }),
        ]
      : []),
    ...(notifications.length
      ? [prisma.notification.createMany({ data: notifications })]
      : []),
    prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { endsAt: markedAt, status: AttendanceSessionStatus.CLOSED },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        description: `Closed attendance session and marked ${missing.length} students absent.`,
        entity: "AttendanceSession",
        entityId: sessionId,
        schoolId: scope.schoolId,
        userId: scope.userId,
      },
    }),
  ])

  return getAttendanceSession(scope, sessionId)
}
