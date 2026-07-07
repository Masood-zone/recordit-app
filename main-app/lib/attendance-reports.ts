import { AuditAction, ReportType } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

type ReportScope = {
  schoolId: string
  userId: string
  teacherId?: string
  restrictToAssignedClasses?: boolean
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function dayStart(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function parseDate(value: unknown, fallback: Date) {
  const date = new Date(clean(value))
  return Number.isNaN(date.getTime()) ? fallback : date
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}

function reportRange(params: URLSearchParams) {
  const type = (params.get("type") || ReportType.DAILY).toUpperCase() as ReportType
  const today = dayStart(new Date())

  if (type === ReportType.WEEKLY) return { type, start: addDays(today, -6), end: addDays(today, 1) }
  if (type === ReportType.MONTHLY) return { type, start: monthStart(today), end: monthEnd(today) }
  if (type === ReportType.TERMLY) return { type, start: addDays(today, -89), end: addDays(today, 1) }
  if (type === ReportType.CUSTOM) {
    const start = dayStart(parseDate(params.get("start"), addDays(today, -30)))
    const end = addDays(dayStart(parseDate(params.get("end"), today)), 1)
    return { type, start, end }
  }

  const selected = dayStart(parseDate(params.get("date"), today))
  return { type: ReportType.DAILY, start: selected, end: addDays(selected, 1) }
}

async function scopedClassIds(scope: ReportScope) {
  if (!scope.restrictToAssignedClasses) return undefined
  const assignments = await prisma.classTeacher.findMany({
    where: { teacherId: scope.teacherId },
    select: { classId: true },
  })
  return assignments.map((item) => item.classId)
}

export async function getAttendanceReport(scope: ReportScope, request: Request) {
  const { searchParams } = new URL(request.url)
  const range = reportRange(searchParams)
  const classId = clean(searchParams.get("classId"))
  const studentId = clean(searchParams.get("studentId"))
  const assignedClassIds = await scopedClassIds(scope)
  const allowedClassIds = assignedClassIds
    ? classId && assignedClassIds.includes(classId)
      ? [classId]
      : assignedClassIds
    : classId && classId !== "ALL"
      ? [classId]
      : undefined

  const recordWhere = {
    schoolId: scope.schoolId,
    markedAt: { gte: range.start, lt: range.end },
    ...(studentId && studentId !== "ALL" ? { studentId } : {}),
    ...(allowedClassIds ? { student: { classId: { in: allowedClassIds } } } : {}),
  }

  const [records, classes, students, recentReports] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: recordWhere,
      orderBy: [{ markedAt: "desc" }],
      select: {
        id: true,
        capturedOffline: true,
        fingerprintScore: true,
        markedAt: true,
        remarks: true,
        status: true,
        syncedAt: true,
        verificationMethod: true,
        session: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
            teacher: { select: { user: { select: { name: true } } } },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            otherName: true,
            studentNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.class.findMany({
      where: {
        schoolId: scope.schoolId,
        ...(assignedClassIds ? { id: { in: assignedClassIds } } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.student.findMany({
      where: {
        schoolId: scope.schoolId,
        isActive: true,
        ...(assignedClassIds ? { classId: { in: assignedClassIds } } : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, studentNumber: true, classId: true },
    }),
    prisma.report.findMany({
      where: {
        schoolId: scope.schoolId,
        ...(assignedClassIds ? { OR: [{ classId: null }, { classId: { in: assignedClassIds } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        endDate: true,
        startDate: true,
        title: true,
        type: true,
        class: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    }),
  ])

  const summary = {
    absent: records.filter((record) => record.status === "ABSENT").length,
    excused: records.filter((record) => record.status === "EXCUSED").length,
    late: records.filter((record) => record.status === "LATE").length,
    offlineSynced: records.filter((record) => record.capturedOffline).length,
    present: records.filter((record) => record.status === "PRESENT").length,
    total: records.length,
  }

  const studentsById = new Map<string, { student: (typeof records)[number]["student"]; records: typeof records }>()
  for (const record of records) {
    const existing = studentsById.get(record.student.id)
    if (existing) {
      existing.records.push(record)
    } else {
      studentsById.set(record.student.id, { student: record.student, records: [record] })
    }
  }

  const ranking = Array.from(studentsById.values())
    .map(({ student, records: studentRecords }) => {
      const attended = studentRecords.filter((record) =>
        ["PRESENT", "LATE", "EXCUSED"].includes(record.status)
      ).length
      return {
        absent: studentRecords.filter((record) => record.status === "ABSENT").length,
        attendanceRate: percent(attended, studentRecords.length),
        className: student.class?.name || "Unassigned",
        late: studentRecords.filter((record) => record.status === "LATE").length,
        present: studentRecords.filter((record) => record.status === "PRESENT").length,
        studentId: student.id,
        studentName: [student.firstName, student.otherName, student.lastName].filter(Boolean).join(" "),
        studentNumber: student.studentNumber,
        total: studentRecords.length,
      }
    })
    .sort((a, b) => b.attendanceRate - a.attendanceRate)

  const classMap = new Map<string, { className: string; present: number; total: number }>()
  for (const record of records) {
    const key = record.student.class?.id || "unassigned"
    const item = classMap.get(key) || {
      className: record.student.class?.name || "Unassigned",
      present: 0,
      total: 0,
    }
    item.total += 1
    if (["PRESENT", "LATE", "EXCUSED"].includes(record.status)) item.present += 1
    classMap.set(key, item)
  }

  return {
    classes,
    filters: {
      classId: classId || "ALL",
      studentId: studentId || "ALL",
      type: range.type,
    },
    range: { start: range.start, end: range.end, type: range.type },
    recentReports,
    records,
    ranking,
    classPerformance: Array.from(classMap.values()).map((item) => ({
      ...item,
      attendanceRate: percent(item.present, item.total),
    })),
    students,
    summary: {
      ...summary,
      attendanceRate: percent(summary.present + summary.late + summary.excused, summary.total),
      absenteeismRate: percent(summary.absent, summary.total),
    },
  }
}

export async function createAttendanceReport(scope: ReportScope, request: Request, input: Record<string, unknown>) {
  const url = new URL(request.url)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value) params.set(key, value)
  }
  url.search = params.toString()
  const data = await getAttendanceReport(scope, new Request(url))
  const classId = clean(input.classId)
  const studentId = clean(input.studentId)
  const title = clean(input.title) || `${data.range.type} Attendance Report`

  const report = await prisma.report.create({
    data: {
      classId: classId && classId !== "ALL" ? classId : undefined,
      description: `${data.summary.total} attendance records generated for ${data.range.type.toLowerCase()} review.`,
      endDate: data.range.end,
      generatedById: scope.userId,
      schoolId: scope.schoolId,
      startDate: data.range.start,
      studentId: studentId && studentId !== "ALL" ? studentId : undefined,
      title,
      type: data.range.type,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: AuditAction.GENERATE_REPORT,
      description: `Generated ${data.range.type.toLowerCase()} attendance report.`,
      entity: "Report",
      entityId: report.id,
      schoolId: scope.schoolId,
      userId: scope.userId,
    },
  })

  return { report, reportData: data }
}
