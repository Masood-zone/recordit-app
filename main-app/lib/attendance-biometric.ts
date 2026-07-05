import { createHash } from "node:crypto"

import {
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceVerificationMethod,
  AuditAction,
  BiometricScanPurpose,
  BiometricScanStatus,
  FingerprintTemplateStatus,
  FingerLabel,
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

function templatePayload(template9: string, template10: string, fpId?: number | null) {
  return Buffer.from(JSON.stringify({ fpId: fpId ?? null, template9, template10 }), "utf8")
}

function templateHash(template10: string) {
  return createHash("sha256").update(template10).digest("hex")
}

async function ensureDevice(schoolId: string, device?: DevicePayload) {
  const serialNumber = clean(device?.serialNumber) || null
  const bridgeUrl = clean(device?.bridgeUrl) || "http://127.0.0.1:5050"
  const existing = serialNumber
    ? await prisma.biometricDevice.findFirst({ where: { schoolId, serialNumber } })
    : await prisma.biometricDevice.findFirst({ where: { schoolId, bridgeUrl } })

  if (existing) {
    return prisma.biometricDevice.update({
      where: { id: existing.id },
      data: {
        bridgeUrl,
        lastSeenAt: new Date(),
        model: clean(device?.model) || existing.model,
        name: clean(device?.name) || existing.name,
        serialNumber,
      },
    })
  }

  return prisma.biometricDevice.create({
    data: {
      bridgeUrl,
      lastSeenAt: new Date(),
      model: clean(device?.model) || "ZKTeco ZK9500",
      name: clean(device?.name) || "Local fingerprint bridge",
      schoolId,
      serialNumber,
    },
  })
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
  const students = await prisma.student.findMany({
    where: {
      schoolId: scope.schoolId,
      isActive: true,
      ...(scope.restrictToAssignedClasses
        ? { class: { teacherAssignments: { some: { teacherId: scope.teacherId } } } }
        : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      class: { select: { name: true } },
      fingerprints: {
        where: { status: FingerprintTemplateStatus.ACTIVE },
        select: { finger: true, id: true, templateData: true },
      },
      firstName: true,
      id: true,
      lastName: true,
      otherName: true,
      studentNumber: true,
    },
  })

  return students.map((student) => ({
    className: student.class?.name || "Unassigned",
    name: [student.firstName, student.otherName, student.lastName].filter(Boolean).join(" "),
    studentId: student.id,
    studentNumber: student.studentNumber,
    fingers: student.fingerprints
      .map((fingerprint) => {
        try {
          const parsed = JSON.parse(Buffer.from(fingerprint.templateData || []).toString("utf8")) as {
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

  const student = await assertStudentScope(scope, studentId)
  if (!student) throw new Error("Student not found")

  const device = await ensureDevice(scope.schoolId, input.device as DevicePayload | undefined)
  const existing = await prisma.fingerprintTemplate.findFirst({
    where: { studentId, finger, status: FingerprintTemplateStatus.ACTIVE },
    select: { id: true },
  })

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

  const saved = existing
    ? await prisma.fingerprintTemplate.update({ where: { id: existing.id }, data })
    : await prisma.fingerprintTemplate.create({ data })

  await prisma.$transaction([
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
        templateId: saved.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.ENROLL_FINGERPRINT,
        description: `Enrolled ${finger} for ${student.firstName} ${student.lastName}.`,
        entity: "FingerprintTemplate",
        entityId: saved.id,
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

export async function listAttendanceSessions(scope: ActorScope) {
  return prisma.attendanceSession.findMany({
    where: {
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
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    take: 30,
    select: attendanceSessionSelect,
  })
}

export async function openAttendanceSession(scope: ActorScope, input: Record<string, unknown>) {
  const classId = clean(input.classId)
  const klass = await classWhere(scope, classId)
  if (!klass) throw new Error("Class not found")

  const sessionDate = clean(input.sessionDate) ? new Date(clean(input.sessionDate)) : new Date()
  const sessionType = clean(input.sessionType) || "Morning"
  const [year, term] = await Promise.all([
    prisma.academicYear.findFirst({ where: { schoolId: scope.schoolId, isActive: true }, select: { id: true } }),
    prisma.academicTerm.findFirst({ where: { schoolId: scope.schoolId, isActive: true }, select: { id: true } }),
  ])

  const session = await prisma.attendanceSession.create({
    data: {
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
    select: attendanceSessionSelect,
  })

  await prisma.auditLog.create({
    data: {
      action: AuditAction.CREATE,
      description: `Opened attendance session for ${klass.name}.`,
      entity: "AttendanceSession",
      entityId: session.id,
      schoolId: scope.schoolId,
      userId: scope.userId,
    },
  })

  return session
}

const attendanceSessionSelect = {
  class: { select: { id: true, name: true, code: true } },
  classId: true,
  createdAt: true,
  endsAt: true,
  id: true,
  records: {
    orderBy: { markedAt: "desc" as const },
    select: {
      fingerprintMatched: true,
      fingerprintScore: true,
      id: true,
      markedAt: true,
      remarks: true,
      status: true,
      student: {
        select: { firstName: true, id: true, lastName: true, photoUrl: true, studentNumber: true },
      },
      verificationMethod: true,
    },
  },
  sessionDate: true,
  startsAt: true,
  status: true,
  title: true,
  _count: { select: { records: true } },
} as const

async function getSession(scope: ActorScope, sessionId: string) {
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
    select: attendanceSessionSelect,
  })
}

export async function getAttendanceSession(scope: ActorScope, sessionId: string) {
  const session = await getSession(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  return session
}

export async function recordFingerprintScan(scope: ActorScope, sessionId: string, input: Record<string, unknown>) {
  const session = await getSession(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  if (session.status !== AttendanceSessionStatus.OPEN) throw new Error("Attendance session is not open")

  const studentId = clean(input.studentId)
  const finger = normalizeFingerLabel(input.finger)
  const score = Number(input.score || input.matchScore || 0) || null
  if (!studentId) throw new Error("Matched student is required")

  const student = await assertStudentScope(scope, studentId)
  if (!student || student.classId !== session.classId) throw new Error("Student is not in this attendance class")

  const device = await ensureDevice(scope.schoolId, input.device as DevicePayload | undefined)
  const template = finger
    ? await prisma.fingerprintTemplate.findFirst({
        where: { studentId, finger, status: FingerprintTemplateStatus.ACTIVE },
        select: { id: true },
      })
    : null

  const existing = await prisma.attendanceRecord.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
    select: { id: true, status: true },
  })

  const record = await prisma.attendanceRecord.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    create: {
      deviceId: device.id,
      fingerprintMatched: true,
      fingerprintScore: score,
      markedByUserId: scope.userId,
      schoolId: scope.schoolId,
      sessionId,
      status: AttendanceStatus.PRESENT,
      studentId,
      templateId: template?.id,
      verificationMethod: AttendanceVerificationMethod.FINGERPRINT,
    },
    update: {
      deviceId: device.id,
      fingerprintMatched: true,
      fingerprintScore: score,
      markedByUserId: scope.userId,
      templateId: template?.id,
      verificationMethod: AttendanceVerificationMethod.FINGERPRINT,
    },
  })

  await prisma.biometricScanLog.create({
    data: {
      attendanceRecordId: record.id,
      deviceId: device.id,
      matchScore: score,
      message: existing ? "Student was already marked for this session" : "Fingerprint attendance recorded",
      performedById: scope.userId,
      purpose: BiometricScanPurpose.ATTENDANCE_VERIFICATION,
      schoolId: scope.schoolId,
      status: BiometricScanStatus.SUCCESS,
      studentId,
      templateId: template?.id,
    },
  })

  return { duplicate: Boolean(existing), record, session: await getAttendanceSession(scope, sessionId) }
}

export async function recordFailedScan(scope: ActorScope, sessionId: string, input: Record<string, unknown>) {
  const session = await getSession(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  const device = await ensureDevice(scope.schoolId, input.device as DevicePayload | undefined)
  await prisma.biometricScanLog.create({
    data: {
      deviceId: device.id,
      message: clean(input.message) || "Fingerprint was not matched",
      performedById: scope.userId,
      purpose: BiometricScanPurpose.IDENTIFICATION,
      schoolId: scope.schoolId,
      status: BiometricScanStatus.NO_MATCH,
    },
  })
  return { session }
}

export async function adjustAttendanceRecord(
  scope: ActorScope,
  sessionId: string,
  studentId: string,
  input: Record<string, unknown>
) {
  const session = await getSession(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  if (session.status === AttendanceSessionStatus.CLOSED) throw new Error("Attendance session is closed")

  const student = await assertStudentScope(scope, studentId)
  if (!student || student.classId !== session.classId) throw new Error("Student is not in this attendance class")

  const status = clean(input.status).toUpperCase() as AttendanceStatus
  if (!Object.values(AttendanceStatus).includes(status)) throw new Error("Invalid attendance status")

  const record = await prisma.attendanceRecord.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    create: {
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
  })

  await prisma.auditLog.create({
    data: {
      action: AuditAction.UPDATE,
      description: `Manual attendance adjustment: ${status}.`,
      entity: "AttendanceRecord",
      entityId: record.id,
      schoolId: scope.schoolId,
      userId: scope.userId,
    },
  })

  return { record, session: await getAttendanceSession(scope, sessionId) }
}

export async function closeAttendanceSession(scope: ActorScope, sessionId: string) {
  const session = await getSession(scope, sessionId)
  if (!session) throw new Error("Attendance session not found")
  if (!session.classId) throw new Error("Attendance session has no class")

  const students = await prisma.student.findMany({
    where: { classId: session.classId, schoolId: scope.schoolId, isActive: true },
    select: { id: true },
  })
  const existing = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    select: { studentId: true },
  })
  const marked = new Set(existing.map((item) => item.studentId))
  const missing = students.filter((student) => !marked.has(student.id))

  await prisma.$transaction([
    ...missing.map((student) =>
      prisma.attendanceRecord.create({
        data: {
          markedByUserId: scope.userId,
          remarks: "Automatically marked absent when session closed.",
          schoolId: scope.schoolId,
          sessionId,
          status: AttendanceStatus.ABSENT,
          studentId: student.id,
          verificationMethod: AttendanceVerificationMethod.MANUAL,
        },
      })
    ),
    prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { endsAt: new Date(), status: AttendanceSessionStatus.CLOSED },
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
