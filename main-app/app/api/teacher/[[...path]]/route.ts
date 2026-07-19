import { NextResponse } from "next/server"

import { AuditAction, Gender } from "@/app/generated/prisma/enums"
import { apiError, requireTeacherApi } from "@/lib/api-auth"
import { createAttendanceReport, getAttendanceReport } from "@/lib/attendance-reports"
import {
  adjustAttendanceRecord,
  closeAttendanceSession,
  getAttendanceSetup,
  getAttendanceSession,
  getTemplateSyncRoster,
  listAttendanceSessions,
  openAttendanceSession,
  persistFingerprintEnrollment,
  recordFailedScan,
  recordFingerprintScan,
  syncAttendanceScans,
} from "@/lib/attendance-biometric"
import { clean, optionalClean } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type Context = {
  params: Promise<{ path?: string[] }>
}

type TeacherAuth = Awaited<ReturnType<typeof requireTeacherApi>>

function ok(data?: unknown, message?: string, status = 200) {
  return NextResponse.json<ApiResponse>({ success: true, data, message }, { status })
}

function fail(message: string, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse>(
    { success: false, message, code: "VALIDATION_ERROR", errors },
    { status: 400 }
  )
}

async function body(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

function toDate(value: unknown) {
  const text = clean(value)
  if (!text) return undefined
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toGender(value: unknown) {
  const text = clean(value).toUpperCase()
  if (text === "F" || text === "FEMALE") return Gender.FEMALE
  if (text === "M" || text === "MALE") return Gender.MALE
  return Gender.OTHER
}

const studentSelect = {
  attendanceRecords: {
    orderBy: { markedAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      markedAt: true,
      remarks: true,
      status: true,
      verificationMethod: true,
      session: {
        select: {
          id: true,
          title: true,
          sessionDate: true,
          class: { select: { id: true, name: true } },
        },
      },
    },
  },
  class: { select: { id: true, name: true, code: true, level: true } },
  classId: true,
  dateOfBirth: true,
  firstName: true,
  fingerprints: {
    where: { status: "ACTIVE" as const },
    select: { id: true, finger: true, enrolledAt: true },
  },
  gender: true,
  id: true,
  isActive: true,
  lastName: true,
  otherName: true,
  photoUrl: true,
  studentNumber: true,
  updatedAt: true,
} as const

async function assignedClassIds(teacherId: string) {
  const assignments = await prisma.classTeacher.findMany({
    where: { teacherId },
    select: { classId: true },
  })

  return assignments.map((item) => item.classId)
}

async function getAssignedClasses(auth: TeacherAuth) {
  const schoolId = auth.schoolId!
  const teacherId = auth.teacher!.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.class.findMany({
    where: { schoolId, teacherAssignments: { some: { teacherId } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      level: true,
      description: true,
      attendanceSessions: {
        orderBy: { sessionDate: "desc" },
        take: 1,
        select: {
          id: true,
          sessionDate: true,
          status: true,
          title: true,
          _count: { select: { records: true } },
        },
      },
      _count: { select: { students: true } },
      teacherAssignments: {
        where: { teacherId },
        select: { isLead: true },
      },
    },
  }).then((classes) =>
    classes.map((item) => ({
      ...item,
      statusToday: item.attendanceSessions.some(
        (session) =>
          session.sessionDate >= today &&
          session.sessionDate < tomorrow &&
          session.status === "CLOSED"
      )
        ? "COMPLETED"
        : "WIP",
    }))
  )
}

async function getDashboard(auth: TeacherAuth) {
  const schoolId = auth.schoolId!
  const teacherId = auth.teacher!.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  const [classes, studentsAssigned, todaySessions, pendingSessions, weeklyRecords] =
    await Promise.all([
      getAssignedClasses(auth),
      prisma.student.count({
        where: {
          schoolId,
          isActive: true,
          class: { teacherAssignments: { some: { teacherId } } },
        },
      }),
      prisma.attendanceSession.findMany({
        where: {
          schoolId,
          OR: [
            { teacherId },
            { class: { teacherAssignments: { some: { teacherId } } } },
          ],
          sessionDate: { gte: today, lt: tomorrow },
        },
        orderBy: { sessionDate: "asc" },
        select: {
          id: true,
          sessionDate: true,
          status: true,
          title: true,
          class: { select: { id: true, name: true, code: true } },
          _count: { select: { records: true } },
        },
      }),
      prisma.attendanceSession.count({
        where: {
          schoolId,
          OR: [
            { teacherId },
            { class: { teacherAssignments: { some: { teacherId } } } },
          ],
          status: { in: ["SCHEDULED", "OPEN"] },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          schoolId,
          markedAt: { gte: weekStart },
          student: { class: { teacherAssignments: { some: { teacherId } } } },
        },
        select: { markedAt: true, status: true },
      }),
    ])

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const records = weeklyRecords.filter(
      (record) => record.markedAt.toDateString() === date.toDateString()
    )
    const present = records.filter((record) => record.status === "PRESENT").length

    return {
      label: date.toLocaleDateString("en", { weekday: "short" }),
      rate: records.length ? Math.round((present / records.length) * 100) : 0,
    }
  })

  return {
    classes,
    schoolName: auth.school?.name || "RecordIT School",
    teacher: {
      department: auth.teacher?.department,
      name: auth.user?.name,
      staffNumber: auth.teacher?.staffNumber,
      title: auth.teacher?.title,
    },
    today: today.toISOString(),
    todaySessions,
    trend,
    metrics: {
      assignedClasses: classes.length,
      pendingAttendance: pendingSessions,
      studentsAssigned,
      todaySessions: todaySessions.length,
    },
  }
}

async function getNotifications(auth: TeacherAuth, request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") || 50)
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50
  const where = { userId: auth.user!.id }
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, message: true, type: true, channel: true, status: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ])
  return { notifications, unreadCount }
}

async function getStudents(auth: TeacherAuth, request: Request) {
  const schoolId = auth.schoolId!
  const [classIds, classes] = await Promise.all([
    assignedClassIds(auth.teacher!.id),
    getAssignedClasses(auth),
  ])
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim()
  const classId = searchParams.get("classId")
  const scopedClassIds =
    classId && classId !== "ALL" && classIds.includes(classId) ? [classId] : classIds

  const students = scopedClassIds.length
    ? await prisma.student.findMany({
        where: {
          schoolId,
          classId: { in: scopedClassIds },
          ...(search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { studentNumber: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: studentSelect,
      })
    : []

  return { classes, students }
}

async function getStudent(auth: TeacherAuth, studentId: string) {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId: auth.schoolId!,
      class: { teacherAssignments: { some: { teacherId: auth.teacher!.id } } },
    },
    select: studentSelect,
  })
}

async function updateStudent(auth: TeacherAuth, studentId: string, input: Record<string, unknown>) {
  const student = await getStudent(auth, studentId)
  if (!student) return apiError("Student not found", 404, "NOT_FOUND")

  const firstName = clean(input.firstName)
  const lastName = clean(input.lastName)
  const studentNumber = clean(input.studentNumber)

  if (!firstName || !lastName || !studentNumber) {
    return fail("Please complete the student form", {
      firstName: firstName ? [] : ["First name is required"],
      lastName: lastName ? [] : ["Last name is required"],
      studentNumber: studentNumber ? [] : ["Student ID is required"],
    })
  }

  const duplicate = await prisma.student.findFirst({
    where: {
      schoolId: auth.schoolId!,
      studentNumber,
      NOT: { id: studentId },
    },
    select: { id: true },
  })

  if (duplicate) return apiError("A student with this student ID already exists", 409, "CONFLICT")

  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: studentId },
      data: {
        dateOfBirth: toDate(input.dateOfBirth),
        firstName,
        gender: toGender(input.gender),
        isActive: input.isActive === false || input.isActive === "false" ? false : true,
        lastName,
        otherName: optionalClean(input.otherName),
        photoUrl: optionalClean(input.photoUrl),
        studentNumber,
      },
    })

    await tx.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        description: `Teacher updated student ${firstName} ${lastName}.`,
        entity: "Student",
        entityId: studentId,
        schoolId: auth.schoolId!,
        userId: auth.user!.id,
      },
    })
  })

  return ok({ student: await getStudent(auth, studentId) }, "Student updated")
}

export async function GET(request: Request, context: Context) {
  const auth = await requireTeacherApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []

  if (path[0] === "dashboard") return ok(await getDashboard(auth))
  if (path[0] === "notifications") return ok(await getNotifications(auth, request))
  if (path[0] === "classes") return ok({ classes: await getAssignedClasses(auth) })
  if (path[0] === "fingerprints" && path[1] === "sync-roster") {
    return ok({
      students: await getTemplateSyncRoster({
        restrictToAssignedClasses: true,
        schoolId: auth.schoolId!,
        teacherId: auth.teacher!.id,
        userId: auth.user!.id,
      }),
    })
  }
  if (path[0] === "attendance-setup") {
    return ok(
      await getAttendanceSetup({
        restrictToAssignedClasses: true,
        schoolId: auth.schoolId!,
        teacherId: auth.teacher!.id,
        userId: auth.user!.id,
      })
    )
  }
  if (path[0] === "attendance-sessions" && path[1]) {
    try {
      return ok({
        session: await getAttendanceSession(
          {
            restrictToAssignedClasses: true,
            schoolId: auth.schoolId!,
            teacherId: auth.teacher!.id,
            userId: auth.user!.id,
          },
          path[1]
        ),
      })
    } catch (error) {
      return apiError(error instanceof Error ? error.message : "Attendance session not found", 404, "NOT_FOUND")
    }
  }
  if (path[0] === "attendance-sessions") {
    return ok({
      sessions: await listAttendanceSessions({
        restrictToAssignedClasses: true,
        schoolId: auth.schoolId!,
        teacherId: auth.teacher!.id,
        userId: auth.user!.id,
      }),
    })
  }
  if (path[0] === "reports") {
    return ok(
      await getAttendanceReport(
        {
          restrictToAssignedClasses: true,
          schoolId: auth.schoolId!,
          teacherId: auth.teacher!.id,
          userId: auth.user!.id,
        },
        request
      )
    )
  }
  if (path[0] === "students" && path[1]) {
    const student = await getStudent(auth, path[1])
    return student ? ok({ student }) : apiError("Student not found", 404, "NOT_FOUND")
  }
  if (path[0] === "students") return ok(await getStudents(auth, request))

  return apiError("Teacher endpoint not found", 404, "NOT_FOUND")
}

export async function POST(request: Request, context: Context) {
  const auth = await requireTeacherApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const input = await body(request)
  const scope = {
    restrictToAssignedClasses: true,
    schoolId: auth.schoolId!,
    teacherId: auth.teacher!.id,
    userId: auth.user!.id,
  }

  if (path[0] === "students" && path[1] && path[2] === "fingerprints") {
    try {
      return ok(await persistFingerprintEnrollment(scope, { ...input, studentId: path[1] }), "Fingerprint enrolled", 201)
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Fingerprint enrollment failed")
    }
  }
  if (path[0] === "attendance-sessions" && !path[1]) {
    try {
      return ok({ session: await openAttendanceSession(scope, input) }, "Attendance session opened", 201)
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance session could not be opened")
    }
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "scans" && path[3] === "sync") {
    return ok(await syncAttendanceScans(scope, path[1], input), "Offline attendance queue synced")
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "scans") {
    try {
      if (input.matched === false || input.status === "NO_MATCH") {
        return ok(await recordFailedScan(scope, path[1], input), "Scan logged")
      }
      return ok(await recordFingerprintScan(scope, path[1], input), "Attendance recorded")
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance scan could not be recorded")
    }
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "close") {
    try {
      return ok({ session: await closeAttendanceSession(scope, path[1]) }, "Attendance session closed")
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance session could not be closed")
    }
  }
  if (path[0] === "reports") {
    return ok(
      await createAttendanceReport(scope, request, input),
      "Report generated",
      201
    )
  }

  return apiError("Teacher endpoint not found", 404, "NOT_FOUND")
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireTeacherApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const input = await body(request)

  if (path[0] === "notifications" && path[1] === "read-all") {
    await prisma.notification.updateMany({ where: { userId: auth.user!.id, readAt: null }, data: { readAt: new Date() } })
    return ok({}, "Notifications marked as read")
  }
  if (path[0] === "notifications" && path[1] && path[2] === "read") {
    const notification = await prisma.notification.findFirst({ where: { id: path[1], userId: auth.user!.id }, select: { id: true } })
    if (!notification) return apiError("Notification not found", 404, "NOT_FOUND")
    await prisma.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } })
    return ok({}, "Notification marked as read")
  }

  if (path[0] === "attendance-sessions" && path[1] && path[2] === "records" && path[3]) {
    try {
      return ok(
        await adjustAttendanceRecord(
          {
            restrictToAssignedClasses: true,
            schoolId: auth.schoolId!,
            teacherId: auth.teacher!.id,
            userId: auth.user!.id,
          },
          path[1],
          path[3],
          input
        ),
        "Attendance adjusted"
      )
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance could not be adjusted")
    }
  }
  if (path[0] === "students" && path[1]) {
    return updateStudent(auth, path[1], input)
  }

  return apiError("Teacher endpoint not found", 404, "NOT_FOUND")
}
