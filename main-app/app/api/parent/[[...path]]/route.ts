import { NextResponse } from "next/server"

import {
  AttendanceStatus,
  AuditAction,
} from "@/app/generated/prisma/enums"
import { apiError, requireParentGuardianApi } from "@/lib/api-auth"
import { clean, optionalClean } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type Context = {
  params: Promise<{ path?: string[] }>
}

type ParentAuth = Awaited<ReturnType<typeof requireParentGuardianApi>>

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

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function percent(present: number, total: number) {
  return total ? Math.round((present / total) * 100) : 0
}

function studentName(student: { firstName: string; lastName: string; otherName?: string | null }) {
  return [student.firstName, student.otherName, student.lastName].filter(Boolean).join(" ")
}

const studentCardSelect = {
  class: {
    select: {
      id: true,
      name: true,
      code: true,
      level: true,
      teacherAssignments: {
        where: { isLead: true },
        take: 1,
        select: {
          teacher: {
            select: {
              id: true,
              title: true,
              user: { select: { name: true, email: true, phone: true, image: true } },
            },
          },
        },
      },
    },
  },
  firstName: true,
  id: true,
  lastName: true,
  otherName: true,
  photoUrl: true,
  studentNumber: true,
  attendanceRecords: {
    orderBy: { markedAt: "desc" as const },
    take: 60,
    select: {
      id: true,
      markedAt: true,
      remarks: true,
      status: true,
      session: {
        select: {
          id: true,
          title: true,
          sessionDate: true,
          startsAt: true,
          teacher: { select: { user: { select: { name: true } } } },
          class: { select: { name: true } },
        },
      },
    },
  },
  school: { select: { id: true, name: true } },
} as const

async function getLinkedStudents(auth: ParentAuth) {
  const guardianId = auth.guardian!.id
  const links = await prisma.studentGuardian.findMany({
    where: { guardianId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      isPrimary: true,
      relationship: true,
      student: { select: studentCardSelect },
    },
  })

  return links.map((link) => {
    const records = link.student.attendanceRecords
    const present = records.filter((record) => record.status === AttendanceStatus.PRESENT).length
    const absent = records.filter((record) => record.status === AttendanceStatus.ABSENT).length
    const late = records.filter((record) => record.status === AttendanceStatus.LATE).length
    const excused = records.filter((record) => record.status === AttendanceStatus.EXCUSED).length
    const latest = records[0] ?? null
    const lead = link.student.class?.teacherAssignments[0]?.teacher ?? null

    return {
      id: link.student.id,
      linkId: link.id,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
      name: studentName(link.student),
      firstName: link.student.firstName,
      lastName: link.student.lastName,
      studentNumber: link.student.studentNumber,
      photoUrl: link.student.photoUrl,
      className: link.student.class?.name ?? "Unassigned class",
      classLevel: link.student.class?.level ?? null,
      schoolName: link.student.school.name,
      attendance: {
        present,
        absent,
        late,
        excused,
        total: records.length,
        percentage: percent(present + late + excused, records.length),
      },
      latestAttendance: latest
        ? {
            id: latest.id,
            status: latest.status,
            markedAt: latest.markedAt,
            time: latest.markedAt,
            sessionTitle: latest.session.title,
            remarks: latest.remarks,
          }
        : null,
      leadTeacher: lead
        ? {
            id: lead.id,
            name: lead.user.name,
            email: lead.user.email,
            phone: lead.user.phone,
            title: lead.title,
            image: lead.user.image,
          }
        : null,
    }
  })
}

async function findLinkedStudent(auth: ParentAuth, studentId: string) {
  const link = await prisma.studentGuardian.findFirst({
    where: { guardianId: auth.guardian!.id, studentId },
    select: { studentId: true },
  })

  if (!link) return null

  return prisma.student.findFirst({
    where: { id: studentId, schoolId: auth.schoolId!, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      otherName: true,
      photoUrl: true,
      studentNumber: true,
      class: {
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
          teacherAssignments: {
            where: { isLead: true },
            take: 1,
            select: {
              teacher: {
                select: {
                  id: true,
                  title: true,
                  user: { select: { name: true, email: true, phone: true, image: true } },
                },
              },
            },
          },
        },
      },
      school: { select: { id: true, name: true } },
    },
  })
}

function rangeFor(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("filter") || "month"
  const now = dayStart(new Date())

  if (filter === "week") return { filter, start: addDays(now, -6), end: addDays(now, 1) }
  if (filter === "term") return { filter, start: addDays(now, -89), end: addDays(now, 1) }
  if (filter === "custom") {
    const start = parseDate(searchParams.get("start"), addDays(now, -30))
    const end = parseDate(searchParams.get("end"), addDays(now, 1))
    return { filter, start: dayStart(start), end: addDays(dayStart(end), 1) }
  }

  return { filter: "month", start: monthStart(now), end: monthEnd(now) }
}

async function attendanceForStudent(auth: ParentAuth, studentId: string, request: Request) {
  const student = await findLinkedStudent(auth, studentId)
  if (!student) return null

  const range = rangeFor(request)
  const records = await prisma.attendanceRecord.findMany({
    where: {
      schoolId: auth.schoolId!,
      studentId,
      markedAt: { gte: range.start, lt: range.end },
    },
    orderBy: { markedAt: "desc" },
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
          startsAt: true,
          teacher: { select: { user: { select: { name: true, email: true, phone: true } } } },
          class: { select: { name: true } },
        },
      },
    },
  })

  const present = records.filter((record) => record.status === AttendanceStatus.PRESENT).length
  const absent = records.filter((record) => record.status === AttendanceStatus.ABSENT).length
  const late = records.filter((record) => record.status === AttendanceStatus.LATE).length
  const excused = records.filter((record) => record.status === AttendanceStatus.EXCUSED).length

  return {
    student: {
      ...student,
      name: studentName(student),
      className: student.class?.name ?? "Unassigned class",
      schoolName: student.school.name,
    },
    range: {
      filter: range.filter,
      start: range.start,
      end: range.end,
    },
    summary: {
      present,
      absent,
      late,
      excused,
      total: records.length,
      percentage: percent(present + late + excused, records.length),
    },
    records,
  }
}

async function dashboard(auth: ParentAuth) {
  const children = await getLinkedStudents(auth)
  const selectedChild = children.find((child) => child.isPrimary) ?? children[0] ?? null
  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user!.id, readAt: null },
  })

  return {
    parent: {
      id: auth.user!.id,
      name: auth.user!.name,
      email: auth.user!.email,
      phone: auth.user!.phone,
      image: auth.user!.image,
      relationship: auth.guardian!.relationship,
    },
    school: auth.school,
    children,
    selectedChild,
    unreadCount,
    statusMessage:
      selectedChild?.latestAttendance?.status === AttendanceStatus.ABSENT
        ? "Your child has missed attendance recently."
        : "Your child's attendance is up to date.",
  }
}

async function preferences(auth: ParentAuth) {
  return prisma.parentNotificationPreference.upsert({
    where: { guardianId: auth.guardian!.id },
    create: {
      guardianId: auth.guardian!.id,
      schoolId: auth.schoolId,
      userId: auth.user!.id,
    },
    update: {},
  })
}

async function notifications(auth: ParentAuth, request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") || 30)
  const items = await prisma.notification.findMany({
    where: { userId: auth.user!.id },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 30,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      channel: true,
      status: true,
      readAt: true,
      createdAt: true,
      studentId: true,
      attendanceRecordId: true,
      student: { select: { firstName: true, lastName: true, otherName: true } },
      attendanceRecord: { select: { id: true, markedAt: true, status: true } },
    },
  })
  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user!.id, readAt: null },
  })

  return { notifications: items, unreadCount }
}

async function profile(auth: ParentAuth) {
  const children = await getLinkedStudents(auth)
  return {
    parent: {
      id: auth.user!.id,
      name: auth.user!.name,
      firstName: auth.user!.firstName,
      lastName: auth.user!.lastName,
      email: auth.user!.email,
      phone: auth.user!.phone,
      image: auth.user!.image,
      address: auth.guardian!.address,
      occupation: auth.guardian!.occupation,
      relationship: auth.guardian!.relationship,
    },
    children,
  }
}

async function contactSchool(auth: ParentAuth, request: Request) {
  const { searchParams } = new URL(request.url)
  const children = await getLinkedStudents(auth)
  const requestedChild = searchParams.get("studentId")
  const child =
    children.find((item) => item.id === requestedChild) ??
    children.find((item) => item.isPrimary) ??
    children[0] ??
    null

  return {
    school: auth.school,
    child,
    leadTeacher: child?.leadTeacher ?? null,
  }
}

export async function GET(request: Request, context: Context) {
  const auth = await requireParentGuardianApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []

  if (path[0] === "dashboard") return ok(await dashboard(auth))
  if (path[0] === "children" && path[1] && path[2] === "attendance") {
    const data = await attendanceForStudent(auth, path[1], request)
    return data ? ok(data) : apiError("Student not found", 404, "NOT_FOUND")
  }
  if (path[0] === "children" && path[1] && path[2] === "calendar") {
    const data = await attendanceForStudent(auth, path[1], request)
    return data ? ok(data) : apiError("Student not found", 404, "NOT_FOUND")
  }
  if (path[0] === "children") return ok({ children: await getLinkedStudents(auth) })
  if (path[0] === "notifications") return ok(await notifications(auth, request))
  if (path[0] === "preferences") return ok({ preferences: await preferences(auth) })
  if (path[0] === "profile") return ok(await profile(auth))
  if (path[0] === "contact-school") return ok(await contactSchool(auth, request))

  return apiError("Parent endpoint not found", 404, "NOT_FOUND")
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireParentGuardianApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const input = await body(request)

  if (path[0] === "notifications" && path[1] === "read-all") {
    await prisma.notification.updateMany({
      where: { userId: auth.user!.id, readAt: null },
      data: { readAt: new Date() },
    })
    return ok({}, "Notifications marked as read")
  }

  if (path[0] === "notifications" && path[1] && path[2] === "read") {
    const item = await prisma.notification.findFirst({
      where: { id: path[1], userId: auth.user!.id },
      select: { id: true },
    })
    if (!item) return apiError("Notification not found", 404, "NOT_FOUND")
    await prisma.notification.update({
      where: { id: item.id },
      data: { readAt: new Date() },
    })
    return ok({}, "Notification marked as read")
  }

  if (path[0] === "preferences") {
    const bool = (key: string) => Boolean(input[key])
    const item = await prisma.parentNotificationPreference.upsert({
      where: { guardianId: auth.guardian!.id },
      create: {
        absentAlerts: bool("absentAlerts"),
        emailEnabled: bool("emailEnabled"),
        guardianId: auth.guardian!.id,
        inAppEnabled: bool("inAppEnabled"),
        lateAlerts: bool("lateAlerts"),
        schoolId: auth.schoolId,
        smsEnabled: bool("smsEnabled"),
        termlySummary: bool("termlySummary"),
        userId: auth.user!.id,
        weeklySummary: bool("weeklySummary"),
        whatsappEnabled: bool("whatsappEnabled"),
      },
      update: {
        absentAlerts: bool("absentAlerts"),
        emailEnabled: bool("emailEnabled"),
        inAppEnabled: bool("inAppEnabled"),
        lateAlerts: bool("lateAlerts"),
        smsEnabled: bool("smsEnabled"),
        termlySummary: bool("termlySummary"),
        weeklySummary: bool("weeklySummary"),
        whatsappEnabled: bool("whatsappEnabled"),
      },
    })
    return ok({ preferences: item }, "Notification preferences saved")
  }

  if (path[0] === "profile") {
    const firstName = clean(input.firstName)
    const lastName = clean(input.lastName)
    if (!firstName || !lastName) {
      return fail("Please complete your name", {
        firstName: firstName ? [] : ["First name is required"],
        lastName: lastName ? [] : ["Last name is required"],
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.user!.id },
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          phone: optionalClean(input.phone),
        },
      })
      await tx.parentGuardian.update({
        where: { id: auth.guardian!.id },
        data: {
          address: optionalClean(input.address),
          occupation: optionalClean(input.occupation),
          relationship: optionalClean(input.relationship),
        },
      })
      await tx.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          description: "Parent updated contact profile.",
          entity: "ParentGuardian",
          entityId: auth.guardian!.id,
          schoolId: auth.schoolId,
          userId: auth.user!.id,
        },
      })
    })
    return ok(await profile(auth), "Profile updated")
  }

  return apiError("Parent endpoint not found", 404, "NOT_FOUND")
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireParentGuardianApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []

  if (path[0] === "notifications" && path[1]) {
    const item = await prisma.notification.findFirst({
      where: { id: path[1], userId: auth.user!.id },
      select: { id: true },
    })
    if (!item) return apiError("Notification not found", 404, "NOT_FOUND")
    await prisma.notification.delete({ where: { id: item.id } })
    return ok({}, "Notification deleted")
  }

  return apiError("Parent endpoint not found", 404, "NOT_FOUND")
}
