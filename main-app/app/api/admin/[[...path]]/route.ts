import { randomUUID } from "node:crypto"

import { hashPassword } from "better-auth/crypto"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import {
  AttendanceStatus,
  AuditAction,
  Gender,
  UserRole,
  UserStatus,
} from "@/app/generated/prisma/enums"
import { apiError, requireSchoolAdminApi } from "@/lib/api-auth"
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
import {
  clean,
  fieldErrors,
  normalizeEmail,
  notifyUser,
  optionalClean,
  recordAudit,
  temporaryPassword,
  upsertCredentialAccount,
  userSelect,
} from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type Context = {
  params: Promise<{ path?: string[] }>
}

type Authed = Awaited<ReturnType<typeof requireSchoolAdminApi>>

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

function toStudentActiveStatus(value: unknown) {
  const text = clean(value).toUpperCase()
  return !(value === false || text === "FALSE" || text === "INACTIVE" || text === "0")
}

function toUserStatus(value: unknown) {
  const text = clean(value).toUpperCase()
  if (text === UserStatus.INACTIVE || text === UserStatus.SUSPENDED) return text
  return UserStatus.ACTIVE
}

function accountStatusMessage(status: UserStatus) {
  if (status === UserStatus.SUSPENDED) {
    return {
      subject: "Your RecordIT account has been suspended",
      message:
        "Your RecordIT account has been suspended by your school administrator. Please contact your school for assistance.",
    }
  }

  if (status === UserStatus.INACTIVE) {
    return {
      subject: "Your RecordIT account is inactive",
      message:
        "Your RecordIT account has been marked inactive by your school administrator. Please contact your school for assistance.",
    }
  }

  return {
    subject: "Your RecordIT account is active",
    message:
      "Your RecordIT account has been reactivated by your school administrator. You can sign in to RecordIT again.",
  }
}

const classSelect = {
  academicYear: { select: { id: true, name: true } },
  academicYearId: true,
  code: true,
  createdAt: true,
  description: true,
  id: true,
  level: true,
  name: true,
  teacherAssignments: {
    where: { isLead: true },
    take: 1,
    select: {
      teacher: {
        select: {
          id: true,
          user: { select: { name: true } },
        },
      },
    },
  },
  _count: { select: { attendanceSessions: true, students: true } },
} as const

const studentSelect = {
  class: { select: { id: true, name: true, code: true, level: true } },
  classId: true,
  createdAt: true,
  dateOfBirth: true,
  firstName: true,
  fingerprints: {
    where: { status: "ACTIVE" as const },
    select: { id: true, finger: true, enrolledAt: true },
  },
  gender: true,
  guardians: {
    orderBy: { isPrimary: "desc" as const },
    select: {
      id: true,
      isPrimary: true,
      relationship: true,
      guardian: {
        select: {
          id: true,
          occupation: true,
          relationship: true,
          user: { select: userSelect },
        },
      },
    },
  },
  id: true,
  isActive: true,
  lastName: true,
  otherName: true,
  photoUrl: true,
  studentNumber: true,
  attendanceRecords: {
    orderBy: { markedAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      markedAt: true,
      status: true,
      session: {
        select: {
          title: true,
          class: { select: { name: true } },
        },
      },
    },
  },
} as const

async function getDashboard(auth: Authed) {
  const schoolId = auth.schoolId!
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  const [
    school,
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    weeklyRecords,
    recentAudit,
    noFingerprint,
    classesWithoutTeachers,
    openSessions,
    activeYear,
    activeTerm,
  ] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    prisma.student.count({ where: { schoolId, isActive: true } }),
    prisma.teacher.count({ where: { schoolId } }),
    prisma.parentGuardian.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.attendanceRecord.findMany({
      where: { schoolId, markedAt: { gte: weekStart } },
      select: { markedAt: true, status: true },
    }),
    prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { action: true, createdAt: true, description: true, entity: true, id: true },
    }),
    prisma.student.count({ where: { schoolId, fingerprints: { none: { status: "ACTIVE" } } } }),
    prisma.class.count({ where: { schoolId, teacherAssignments: { none: { isLead: true } } } }),
    prisma.attendanceSession.count({ where: { schoolId, status: "OPEN" } }),
    prisma.academicYear.findFirst({ where: { schoolId, isActive: true }, select: { name: true } }),
    prisma.academicTerm.findFirst({ where: { schoolId, isActive: true }, select: { name: true } }),
  ])

  const todayRecords = weeklyRecords.filter(
    (record) => record.markedAt >= today && record.markedAt < tomorrow
  )
  const present = todayRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length
  const late = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length
  const absent = todayRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const label = date.toLocaleDateString("en", { weekday: "short" })
    const dayRecords = weeklyRecords.filter(
      (record) => record.markedAt.toDateString() === date.toDateString()
    )
    const dayPresent = dayRecords.filter((record) => record.status === "PRESENT").length
    return {
      label,
      rate: dayRecords.length ? Math.round((dayPresent / dayRecords.length) * 100) : 0,
    }
  })

  return {
    schoolName: school?.name || "RecordIT School",
    academicTerm: activeTerm?.name || "No active term",
    academicYear: activeYear?.name || "No active academic year",
    metrics: {
      absenteesToday: absent,
      attendanceToday: todayRecords.length ? Math.round((present / todayRecords.length) * 100) : 0,
      lateStudentsToday: late,
      totalClasses,
      totalParents,
      totalStudents,
      totalTeachers,
    },
    trend,
    recentActivity: recentAudit,
    alerts: { classesWithoutTeachers, noFingerprint, openSessions },
  }
}

async function getNotifications(auth: Authed, request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") || 50)
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50
  const where = { schoolId: auth.schoolId! }
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true, title: true, message: true, type: true, channel: true, status: true, readAt: true, createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ])
  return { notifications, unreadCount }
}

async function getAcademicSetup(schoolId: string) {
  const [academicYears, academicTerms, classes] = await Promise.all([
    prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { classes: true, terms: true } } },
    }),
    prisma.academicTerm.findMany({
      where: { schoolId },
      orderBy: { startsAt: "desc" },
      include: { academicYear: { select: { id: true, name: true } } },
    }),
    prisma.class.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: classSelect }),
  ])

  return { academicYears, academicTerms, classes }
}

async function getUsers(schoolId: string, request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")
  const status = searchParams.get("status")
  const search = searchParams.get("search")?.trim()

  return prisma.user.findMany({
    where: {
      schoolId,
      ...(role && role !== "ALL" ? { role: role as UserRole } : {}),
      ...(status && status !== "ALL" ? { status: status as UserStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      ...userSelect,
      teacherProfile: { select: { id: true, department: true, staffNumber: true, title: true } },
      guardianProfile: { select: { id: true, occupation: true, relationship: true } },
    },
  })
}

async function getTeacher(schoolId: string, teacherId: string) {
  return prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
    select: {
      createdAt: true,
      department: true,
      id: true,
      staffNumber: true,
      title: true,
      user: { select: userSelect },
      attendanceSessions: {
        orderBy: { sessionDate: "desc" },
        take: 8,
        select: { id: true, sessionDate: true, status: true, title: true, _count: { select: { records: true } } },
      },
      classAssignments: {
        select: {
          isLead: true,
          class: { select: { id: true, name: true, code: true, level: true, _count: { select: { students: true } } } },
        },
      },
    },
  })
}

async function getGuardian(schoolId: string, guardianId: string) {
  return prisma.parentGuardian.findFirst({
    where: { id: guardianId, schoolId },
    select: {
      address: true,
      createdAt: true,
      id: true,
      occupation: true,
      relationship: true,
      user: { select: userSelect },
      students: {
        select: {
          id: true,
          isPrimary: true,
          relationship: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  })
}

async function createOrUpdateClass(
  auth: Authed,
  input: Record<string, unknown>,
  classId?: string
) {
  const schoolId = auth.schoolId!
  const errors = fieldErrors(input, ["name"])
  if (Object.keys(errors).length) return fail("Please complete the class form", errors)

  const teacherId = optionalClean(input.assignedTeacherId)
  if (classId) {
    const existing = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true },
    })
    if (!existing) return apiError("Class not found", 404, "NOT_FOUND")
  }
  const data = {
    academicYearId: optionalClean(input.academicYearId),
    code: optionalClean(input.code),
    description: optionalClean(input.description),
    level: optionalClean(input.level),
    name: clean(input.name),
    schoolId,
  }

  const saved = await prisma.$transaction(async (tx) => {
    const item = classId
      ? await tx.class.update({ where: { id: classId }, data })
      : await tx.class.create({ data })

    if (teacherId) {
      await tx.classTeacher.deleteMany({ where: { classId: item.id, isLead: true } })
      await tx.classTeacher.upsert({
        where: { classId_teacherId: { classId: item.id, teacherId } },
        create: { classId: item.id, teacherId, isLead: true },
        update: { isLead: true },
      })
    }

    await tx.auditLog.create({
      data: {
        action: classId ? AuditAction.UPDATE : AuditAction.CREATE,
        description: `${classId ? "Updated" : "Created"} class ${item.name}.`,
        entity: "Class",
        entityId: item.id,
        schoolId,
        userId: auth.user!.id,
      },
    })

    return item
  })

  return ok({ class: saved }, classId ? "Class updated" : "Class created", classId ? 200 : 201)
}

async function createTeacher(auth: Authed, input: Record<string, unknown>) {
  const errors = fieldErrors(input, ["firstName", "lastName", "email"])
  if (Object.keys(errors).length) return fail("Please complete the teacher form", errors)

  const schoolId = auth.schoolId!
  const suppliedPassword = clean(input.password)
  if (suppliedPassword && suppliedPassword.length < 8) return fail("Password must contain at least 8 characters", { password: ["Use at least 8 characters"] })
  const password = suppliedPassword || temporaryPassword()
  const email = normalizeEmail(input.email)
  const staffNumber = optionalClean(input.staffNumber)

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (exists) return apiError("A user with this email already exists", 409, "CONFLICT")

  if (staffNumber) {
    const existingStaff = await prisma.teacher.findFirst({
      where: { schoolId, staffNumber },
      select: { id: true },
    })

    if (existingStaff) {
      return apiError("A teacher with this staff number already exists", 409, "CONFLICT")
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        emailVerified: true,
        firstName: clean(input.firstName),
        id: randomUUID(),
        lastName: clean(input.lastName),
        name: `${clean(input.firstName)} ${clean(input.lastName)}`.trim(),
        phone: optionalClean(input.phone),
        role: UserRole.TEACHER,
        schoolId,
        status: toUserStatus(input.status),
      },
    })

    await tx.account.create({
      data: {
        accountId: user.id,
        id: randomUUID(),
        password: await hashPassword(password),
        providerId: "credential",
        userId: user.id,
      },
    })

    const teacher = await tx.teacher.create({
      data: {
        department: optionalClean(input.department),
        staffNumber,
        title: optionalClean(input.title),
        schoolId,
        userId: user.id,
      },
    })

    const assignedClassId = optionalClean(input.assignedClassId)
    if (assignedClassId) {
      await tx.classTeacher.upsert({
        where: { classId_teacherId: { classId: assignedClassId, teacherId: teacher.id } },
        create: { classId: assignedClassId, teacherId: teacher.id, isLead: true },
        update: { isLead: true },
      })
    }

    await tx.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        description: `Added teacher ${user.name}.`,
        entity: "Teacher",
        entityId: teacher.id,
        schoolId,
        userId: auth.user!.id,
      },
    })

    return { teacher, user }
  })

  await notifyUser({
    email,
    message: `RecordIT account created for ${result.user.name}. Temporary password: ${password}`,
    phone: result.user.phone,
    schoolId,
    subject: "Your RecordIT teacher account is ready",
    userId: result.user.id,
  })

  return ok({ ...result, passwordWasGenerated: !suppliedPassword, temporaryPassword: suppliedPassword ? undefined : password }, "Teacher added successfully", 201)
}

async function updateTeacher(auth: Authed, teacherId: string, input: Record<string, unknown>) {
  const schoolId = auth.schoolId!
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
    select: { id: true, user: { select: userSelect }, userId: true },
  })
  if (!teacher) return apiError("Teacher not found", 404, "NOT_FOUND")
  const staffNumber = optionalClean(input.staffNumber)
  const nextStatus = input.status ? toUserStatus(input.status) : teacher.user.status

  if (staffNumber) {
    const existingStaff = await prisma.teacher.findFirst({
      where: { schoolId, staffNumber, NOT: { id: teacherId } },
      select: { id: true },
    })

    if (existingStaff) {
      return apiError("A teacher with this staff number already exists", 409, "CONFLICT")
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({
      where: { id: teacherId },
      data: {
        department: optionalClean(input.department),
        staffNumber,
        title: optionalClean(input.title),
      },
    })
    await tx.user.update({
      where: { id: teacher.userId },
      data: {
        ...(input.email ? { email: normalizeEmail(input.email) } : {}),
        ...(input.firstName ? { firstName: clean(input.firstName) } : {}),
        ...(input.lastName ? { lastName: clean(input.lastName) } : {}),
        ...(input.phone !== undefined ? { phone: optionalClean(input.phone) } : {}),
        ...(input.status ? { status: nextStatus } : {}),
        ...(input.firstName || input.lastName
          ? { name: `${clean(input.firstName) || ""} ${clean(input.lastName) || ""}`.trim() }
          : {}),
      },
    })
    const assignedClassId = optionalClean(input.assignedClassId)
    if (assignedClassId) {
      await tx.classTeacher.upsert({
        where: { classId_teacherId: { classId: assignedClassId, teacherId } },
        create: { classId: assignedClassId, teacherId, isLead: true },
        update: { isLead: true },
      })
    }
    await tx.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        description: "Updated teacher profile.",
        entity: "Teacher",
        entityId: teacherId,
        schoolId,
        userId: auth.user!.id,
      },
    })
  })

  if (input.status && nextStatus !== teacher.user.status) {
    const statusMessage = accountStatusMessage(nextStatus)
    await notifyUser({
      email: teacher.user.email,
      message: statusMessage.message,
      phone: teacher.user.phone,
      schoolId,
      subject: statusMessage.subject,
      userId: teacher.userId,
    })
  }

  return ok({ teacher: await getTeacher(schoolId, teacherId) }, "Teacher updated")
}

async function createGuardian(auth: Authed, input: Record<string, unknown>) {
  const errors = fieldErrors(input, ["firstName", "lastName", "email", "relationship"])
  if (Object.keys(errors).length) return fail("Please complete the parent/guardian form", errors)

  const schoolId = auth.schoolId!
  const suppliedPassword = clean(input.password)
  if (suppliedPassword && suppliedPassword.length < 8) return fail("Password must contain at least 8 characters", { password: ["Use at least 8 characters"] })
  const password = suppliedPassword || temporaryPassword()
  const email = normalizeEmail(input.email)
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (exists) return apiError("A user with this email already exists", 409, "CONFLICT")

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        emailVerified: true,
        firstName: clean(input.firstName),
        id: randomUUID(),
        lastName: clean(input.lastName),
        name: `${clean(input.firstName)} ${clean(input.lastName)}`.trim(),
        phone: optionalClean(input.phone),
        role: UserRole.PARENT_GUARDIAN,
        schoolId,
        status: toUserStatus(input.status),
      },
    })

    await tx.account.create({
      data: {
        accountId: user.id,
        id: randomUUID(),
        password: await hashPassword(password),
        providerId: "credential",
        userId: user.id,
      },
    })
    const guardian = await tx.parentGuardian.create({
      data: {
        address: optionalClean(input.address),
        occupation: optionalClean(input.occupation),
        relationship: clean(input.relationship),
        schoolId,
        userId: user.id,
      },
    })
    const linkedStudentId = optionalClean(input.linkedStudentId)
    if (linkedStudentId) {
      await tx.studentGuardian.upsert({
        where: { studentId_guardianId: { studentId: linkedStudentId, guardianId: guardian.id } },
        create: {
          guardianId: guardian.id,
          isPrimary: Boolean(input.isPrimary),
          relationship: clean(input.relationship),
          studentId: linkedStudentId,
        },
        update: { isPrimary: Boolean(input.isPrimary), relationship: clean(input.relationship) },
      })
    }
    await tx.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        description: `Added guardian ${user.name}.`,
        entity: "ParentGuardian",
        entityId: guardian.id,
        schoolId,
        userId: auth.user!.id,
      },
    })
    return { guardian, user }
  })

  await notifyUser({
    email,
    message: `RecordIT parent/guardian account created for ${result.user.name}. Temporary password: ${password}`,
    phone: result.user.phone,
    schoolId,
    subject: "Your RecordIT guardian account is ready",
    userId: result.user.id,
  })

  return ok({ ...result, passwordWasGenerated: !suppliedPassword, temporaryPassword: suppliedPassword ? undefined : password }, "Parent/guardian added", 201)
}

async function updateGuardian(auth: Authed, guardianId: string, input: Record<string, unknown>) {
  const schoolId = auth.schoolId!
  const guardian = await prisma.parentGuardian.findFirst({
    where: { id: guardianId, schoolId },
    select: { id: true, user: { select: userSelect }, userId: true },
  })
  if (!guardian) return apiError("Parent/guardian not found", 404, "NOT_FOUND")
  const nextStatus = input.status ? toUserStatus(input.status) : guardian.user.status

  await prisma.$transaction(async (tx) => {
    await tx.parentGuardian.update({
      where: { id: guardianId },
      data: {
        address: optionalClean(input.address),
        occupation: optionalClean(input.occupation),
        relationship: optionalClean(input.relationship),
      },
    })
    await tx.user.update({
      where: { id: guardian.userId },
      data: {
        ...(input.email ? { email: normalizeEmail(input.email) } : {}),
        ...(input.firstName ? { firstName: clean(input.firstName) } : {}),
        ...(input.lastName ? { lastName: clean(input.lastName) } : {}),
        ...(input.phone !== undefined ? { phone: optionalClean(input.phone) } : {}),
        ...(input.status ? { status: nextStatus } : {}),
      },
    })
    const linkedStudentId = optionalClean(input.linkedStudentId)
    if (linkedStudentId && input.relationship) {
      await tx.studentGuardian.upsert({
        where: { studentId_guardianId: { studentId: linkedStudentId, guardianId } },
        create: {
          guardianId,
          isPrimary: Boolean(input.isPrimary),
          relationship: clean(input.relationship),
          studentId: linkedStudentId,
        },
        update: { isPrimary: Boolean(input.isPrimary), relationship: clean(input.relationship) },
      })
    }
    await tx.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        description: "Updated parent/guardian profile.",
        entity: "ParentGuardian",
        entityId: guardianId,
        schoolId,
        userId: auth.user!.id,
      },
    })
  })

  if (input.status && nextStatus !== guardian.user.status) {
    const statusMessage = accountStatusMessage(nextStatus)
    await notifyUser({
      email: guardian.user.email,
      message: statusMessage.message,
      phone: guardian.user.phone,
      schoolId,
      subject: statusMessage.subject,
      userId: guardian.userId,
    })
  }

  return ok({ guardian: await getGuardian(schoolId, guardianId) }, "Parent/guardian updated")
}

async function createOrUpdateStudent(
  auth: Authed,
  input: Record<string, unknown>,
  studentId?: string
) {
  const errors = fieldErrors(input, ["studentNumber", "firstName", "lastName", "gender"])
  if (Object.keys(errors).length) return fail("Please complete the student form", errors)
  const schoolId = auth.schoolId!
  const classId = optionalClean(input.classId)
  const guardianId = optionalClean(input.guardianId)
  const guardianRelationship = optionalClean(input.guardianRelationship)
  const studentNumber = clean(input.studentNumber)

  if (studentId) {
    const existing = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })
    if (!existing) return apiError("Student not found", 404, "NOT_FOUND")
  }

  const duplicate = await prisma.student.findFirst({
    where: {
      schoolId,
      studentNumber,
      ...(studentId ? { NOT: { id: studentId } } : {}),
    },
    select: { id: true },
  })
  if (duplicate) return apiError("A student with this student ID already exists", 409, "CONFLICT")

  if (classId) {
    const assignedClass = await prisma.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true },
    })
    if (!assignedClass) return apiError("Class not found", 404, "NOT_FOUND")
  }

  if (guardianId) {
    const guardian = await prisma.parentGuardian.findFirst({
      where: { id: guardianId, schoolId },
      select: { id: true },
    })
    if (!guardian) return apiError("Parent/guardian not found", 404, "NOT_FOUND")
    if (!guardianRelationship) {
      return fail("Please provide the student's relationship to the selected parent/guardian", {
        guardianRelationship: ["Relationship is required when a parent/guardian is selected"],
      })
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    const data = {
      classId: classId ?? null,
      dateOfBirth: toDate(input.dateOfBirth) ?? null,
      firstName: clean(input.firstName),
      gender: toGender(input.gender),
      isActive: toStudentActiveStatus(input.isActive),
      lastName: clean(input.lastName),
      otherName: optionalClean(input.otherName) ?? null,
      photoUrl: optionalClean(input.photoUrl) ?? null,
      schoolId,
      studentNumber,
    }
    const student = studentId
      ? await tx.student.update({ where: { id: studentId }, data })
      : await tx.student.create({ data })

    if (input.manageGuardian === true) {
      const previousGuardianId = optionalClean(input.previousGuardianId)

      if (previousGuardianId && previousGuardianId !== guardianId) {
        await tx.studentGuardian.deleteMany({
          where: { guardianId: previousGuardianId, studentId: student.id },
        })
      }

      if (guardianId && guardianRelationship) {
        await tx.studentGuardian.updateMany({
          where: { studentId: student.id },
          data: { isPrimary: false },
        })
        await tx.studentGuardian.upsert({
          where: { studentId_guardianId: { studentId: student.id, guardianId } },
          create: {
            guardianId,
            isPrimary: true,
            relationship: guardianRelationship,
            studentId: student.id,
          },
          update: { isPrimary: true, relationship: guardianRelationship },
        })
      }
    } else if (guardianId && guardianRelationship) {
      await tx.studentGuardian.upsert({
        where: { studentId_guardianId: { studentId: student.id, guardianId } },
        create: {
          guardianId,
          isPrimary: input.isPrimaryGuardian !== false,
          relationship: guardianRelationship,
          studentId: student.id,
        },
        update: {
          isPrimary: input.isPrimaryGuardian !== false,
          relationship: guardianRelationship,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: studentId ? AuditAction.UPDATE : AuditAction.CREATE,
        description: `${studentId ? "Updated" : "Registered"} student ${student.firstName} ${student.lastName}.`,
        entity: "Student",
        entityId: student.id,
        schoolId,
        userId: auth.user!.id,
      },
    })

    return student
  })

  return ok({ student: saved }, studentId ? "Student updated" : "Student registered", studentId ? 200 : 201)
}

async function bulkImportStudents(auth: Authed, request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")
  const commit = formData.get("commit") === "true"
  const schoolId = auth.schoolId!

  if (!(file instanceof File)) return fail("Upload a CSV or XLSX file")

  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !["csv", "xls", "xlsx"].includes(extension)) {
    return fail("Only CSV or Excel files are supported")
  }
  if (file.size === 0) return fail("The selected file is empty")
  if (file.size > 25 * 1024 * 1024) return fail("The selected file exceeds the 25MB limit")

  let rows: Record<string, unknown>[]
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { cellDates: true, type: "buffer" })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined
    if (!sheet) return fail("The file does not contain a worksheet")
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      blankrows: false,
      defval: "",
      raw: true,
    })
  } catch {
    return fail("The file could not be read. Check that it is a valid CSV or Excel file")
  }

  if (rows.length === 0) return fail("The file does not contain any student records")
  if (rows.length > 500) return fail("Bulk import supports up to 500 records")

  const [classes, studentsWithNumbers] = await Promise.all([
    prisma.class.findMany({ where: { schoolId }, select: { id: true, code: true, name: true } }),
    prisma.student.findMany({ where: { schoolId }, select: { studentNumber: true } }),
  ])
  const normalizeKey = (value: unknown) => clean(value).toLowerCase().replace(/[\s_-]+/g, " ").trim()
  const classByKey = new Map<string, string>()
  for (const item of classes) {
    for (const key of [item.code, item.name]) {
      const normalized = normalizeKey(key)
      if (normalized && !classByKey.has(normalized)) classByKey.set(normalized, item.id)
    }
  }
  const existingNumbers = new Set(
    studentsWithNumbers.map((student) => student.studentNumber.toLowerCase())
  )
  const seen = new Set<string>()

  function valuesByHeader(row: Record<string, unknown>) {
    return new Map(
      Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value])
    )
  }

  function importDate(value: unknown) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value)
      if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
    }
    const valueText = clean(value)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valueText)) return undefined
    const parsed = new Date(`${valueText}T00:00:00.000Z`)
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== valueText
      ? undefined
      : parsed
  }

  const preview = rows.map((row, index) => {
    const fields = valuesByHeader(row)
    const value = (...names: string[]) => names.map((name) => fields.get(name)).find((item) => clean(item))
    const studentNumber = clean(value("studentid", "studentnumber", "admissionnumber", "admissionno"))
    const firstName = clean(value("firstname", "givenname"))
    const lastName = clean(value("lastname", "surname", "familyname"))
    const otherName = optionalClean(value("othername", "middlename"))
    const genderText = clean(value("gender", "sex")).toUpperCase()
    const dateOfBirthValue = value("dateofbirth", "dob", "birthdate")
    const dateOfBirth = dateOfBirthValue ? importDate(dateOfBirthValue) : undefined
    const grade = clean(value("grade", "class", "classname"))
    const section = clean(value("section", "stream"))
    const classCandidates = [
      [grade, section].filter(Boolean).join(" "),
      grade,
      section,
    ].map(normalizeKey).filter(Boolean)
    const classId = classCandidates.map((key) => classByKey.get(key)).find(Boolean)
    const classLabel = [grade, section].filter(Boolean).join(" / ")
    const key = studentNumber.toLowerCase()
    const issues: string[] = []
    if (!studentNumber) issues.push("Missing Student ID")
    if (!firstName) issues.push("Missing First Name")
    if (!lastName) issues.push("Missing Last Name")
    if (!genderText) issues.push("Missing Gender")
    else if (!["F", "FEMALE", "M", "MALE", "O", "OTHER"].includes(genderText)) {
      issues.push("Invalid Gender")
    }
    if (dateOfBirthValue && !dateOfBirth) issues.push("Invalid Date of Birth (use YYYY-MM-DD)")
    if (key && seen.has(key)) issues.push("Duplicate ID in file")
    if (key && existingNumbers.has(key)) issues.push("Student ID already exists")
    if (classLabel && !classId) issues.push("Invalid class/section")
    if (key) seen.add(key)
    return {
      classId,
      dateOfBirth,
      gender: toGender(genderText),
      grade: classLabel,
      index: index + 1,
      issues,
      firstName,
      lastName,
      otherName,
      studentNumber,
    }
  })

  if (!commit || preview.some((row) => row.issues.length > 0)) {
    return ok({ preview, valid: preview.every((row) => row.issues.length === 0) }, "Import validated")
  }

  try {
    const count = await prisma.$transaction(async (tx) => {
      const result = await tx.student.createMany({
        data: preview.map((row) => ({
          classId: row.classId,
          dateOfBirth: row.dateOfBirth,
          firstName: row.firstName,
          gender: row.gender,
          lastName: row.lastName,
          otherName: row.otherName,
          schoolId,
          studentNumber: row.studentNumber,
        })),
      })
      await tx.auditLog.create({
        data: {
          action: AuditAction.CREATE,
          description: `Bulk imported ${result.count} students from ${file.name}.`,
          entity: "Student",
          schoolId,
          userId: auth.user!.id,
        },
      })
      return result.count
    })

    return ok({ count, preview }, `${count} students imported`, 201)
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return apiError("A student ID was added after validation. Validate the file again", 409, "CONFLICT")
    }
    throw error
  }
}

async function resetUserPassword(auth: Authed, userId: string) {
  const schoolId = auth.schoolId!
  const user = await prisma.user.findFirst({ where: { id: userId, schoolId }, select: userSelect })
  if (!user) return apiError("User not found", 404, "NOT_FOUND")
  const password = temporaryPassword()
  await upsertCredentialAccount(userId, password)
  await recordAudit({
    action: AuditAction.UPDATE,
    description: `Reset password for ${user.name}.`,
    entity: "User",
    entityId: userId,
    schoolId,
    userId: auth.user!.id,
  })
  await notifyUser({
    email: user.email,
    message: `Your RecordIT password was reset. Temporary password: ${password}`,
    phone: user.phone,
    schoolId,
    subject: "Your RecordIT password was reset",
    userId,
  })
  return ok({ temporaryPassword: password }, "Password reset")
}

export async function GET(request: Request, context: Context) {
  const auth = await requireSchoolAdminApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const schoolId = auth.schoolId!

  if (path[0] === "dashboard") return ok(await getDashboard(auth))
  if (path[0] === "notifications") return ok(await getNotifications(auth, request))
  if (path[0] === "academic-setup") return ok(await getAcademicSetup(schoolId))
  if (path[0] === "classes" && path[1]) {
    const item = await prisma.class.findFirst({ where: { id: path[1], schoolId }, select: classSelect })
    return item ? ok({ class: item }) : apiError("Class not found", 404, "NOT_FOUND")
  }
  if (path[0] === "classes") return ok({ classes: await prisma.class.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: classSelect }) })
  if (path[0] === "users") return ok({ users: await getUsers(schoolId, request) })
  if (path[0] === "teachers" && path[1]) {
    const teacher = await getTeacher(schoolId, path[1])
    return teacher ? ok({ teacher }) : apiError("Teacher not found", 404, "NOT_FOUND")
  }
  if (path[0] === "teachers") {
    return ok({ teachers: await prisma.teacher.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, select: { id: true, department: true, staffNumber: true, title: true, user: { select: userSelect }, classAssignments: { select: { class: { select: { id: true, name: true } } } } } }) })
  }
  if (path[0] === "parents" && path[1]) {
    const guardian = await getGuardian(schoolId, path[1])
    return guardian ? ok({ guardian }) : apiError("Parent/guardian not found", 404, "NOT_FOUND")
  }
  if (path[0] === "parents") {
    return ok({ guardians: await prisma.parentGuardian.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, select: { id: true, address: true, occupation: true, relationship: true, user: { select: userSelect }, students: { select: { student: { select: { id: true, firstName: true, lastName: true } } } } } }) })
  }
  if (path[0] === "students" && path[1]) {
    const student = await prisma.student.findFirst({ where: { id: path[1], schoolId }, select: studentSelect })
    return student ? ok({ student }) : apiError("Student not found", 404, "NOT_FOUND")
  }
  if (path[0] === "students") {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    const classId = searchParams.get("classId")
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        ...(classId && classId !== "ALL" ? { classId } : {}),
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
    return ok({ students })
  }
  if (path[0] === "fingerprints" && path[1] === "sync-roster") {
    return ok({ students: await getTemplateSyncRoster({ schoolId, userId: auth.user!.id }) })
  }
  if (path[0] === "attendance-setup") {
    return ok(await getAttendanceSetup({ schoolId, userId: auth.user!.id }))
  }
  if (path[0] === "attendance-sessions" && path[1]) {
    try {
      return ok({ session: await getAttendanceSession({ schoolId, userId: auth.user!.id }, path[1]) })
    } catch (error) {
      return apiError(error instanceof Error ? error.message : "Attendance session not found", 404, "NOT_FOUND")
    }
  }
  if (path[0] === "attendance-sessions") {
    return ok({ sessions: await listAttendanceSessions({ schoolId, userId: auth.user!.id }) })
  }
  if (path[0] === "reports") {
    return ok(await getAttendanceReport({ schoolId, userId: auth.user!.id }, request))
  }
  if (path[0] === "settings") {
    const [school, settings] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId } }),
      prisma.schoolSetting.findMany({ where: { schoolId }, orderBy: { key: "asc" } }),
    ])
    return ok({ school, settings })
  }
  if (path[0] === "options") {
    const [classes, teachers, students, guardians, years] = await Promise.all([
      prisma.class.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true, code: true } }),
      prisma.teacher.findMany({ where: { schoolId }, orderBy: { user: { name: "asc" } }, select: { id: true, user: { select: { name: true } } } }),
      prisma.student.findMany({ where: { schoolId }, orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true, studentNumber: true } }),
      prisma.parentGuardian.findMany({ where: { schoolId }, orderBy: { user: { name: "asc" } }, select: { id: true, user: { select: { name: true } } } }),
      prisma.academicYear.findMany({ where: { schoolId }, orderBy: { startsAt: "desc" }, select: { id: true, name: true } }),
    ])
    return ok({ classes, teachers, students, guardians, years })
  }

  return apiError("Admin endpoint not found", 404, "NOT_FOUND")
}

export async function POST(request: Request, context: Context) {
  const auth = await requireSchoolAdminApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const schoolId = auth.schoolId!

  if (path[0] === "students" && path[1] === "bulk-import") return bulkImportStudents(auth, request)
  const input = await body(request)

  if (path[0] === "students" && path[1] && path[2] === "fingerprints") {
    try {
      return ok(
        await persistFingerprintEnrollment({
          schoolId,
          userId: auth.user!.id,
        }, { ...input, studentId: path[1] }),
        "Fingerprint enrolled",
        201
      )
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Fingerprint enrollment failed")
    }
  }
  if (path[0] === "attendance-sessions" && !path[1]) {
    try {
      return ok(
        { session: await openAttendanceSession({ schoolId, userId: auth.user!.id }, input) },
        "Attendance session opened",
        201
      )
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance session could not be opened")
    }
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "scans" && path[3] === "sync") {
    return ok(
      await syncAttendanceScans({ schoolId, userId: auth.user!.id }, path[1], input),
      "Offline attendance queue synced"
    )
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "scans") {
    try {
      if (input.matched === false || input.status === "NO_MATCH") {
        return ok(await recordFailedScan({ schoolId, userId: auth.user!.id }, path[1], input), "Scan logged")
      }
      return ok(await recordFingerprintScan({ schoolId, userId: auth.user!.id }, path[1], input), "Attendance recorded")
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance scan could not be recorded")
    }
  }
  if (path[0] === "attendance-sessions" && path[1] && path[2] === "close") {
    try {
      return ok({ session: await closeAttendanceSession({ schoolId, userId: auth.user!.id }, path[1]) }, "Attendance session closed")
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance session could not be closed")
    }
  }
  if (path[0] === "reports") {
    return ok(
      await createAttendanceReport({ schoolId, userId: auth.user!.id }, request, input),
      "Report generated",
      201
    )
  }
  if (path[0] === "classes") return createOrUpdateClass(auth, input)
  if (path[0] === "teachers") return createTeacher(auth, input)
  if (path[0] === "parents") return createGuardian(auth, input)
  if (path[0] === "students") return createOrUpdateStudent(auth, input)
  if (path[0] === "academic-years") {
    const errors = fieldErrors(input, ["name", "startsAt", "endsAt"])
    if (Object.keys(errors).length) return fail("Please complete the academic year form", errors)
    const [existingYears, activeYears] = await Promise.all([
      prisma.academicYear.count({ where: { schoolId } }),
      prisma.academicYear.count({ where: { schoolId, isActive: true } }),
    ])
    const requestedActive = input.isActive === "on" || input.isActive === true
    const shouldBeActive = existingYears === 0 || activeYears === 0 || requestedActive
    const item = await prisma.$transaction(async (tx) => {
      if (shouldBeActive) {
        await tx.academicYear.updateMany({
          where: { schoolId },
          data: { isActive: false },
        })
      }

      return tx.academicYear.create({
        data: {
          endsAt: toDate(input.endsAt)!,
          isActive: shouldBeActive,
          name: clean(input.name),
          schoolId,
          startsAt: toDate(input.startsAt)!,
        },
      })
    })
    return ok({ academicYear: item }, "Academic year created", 201)
  }
  if (path[0] === "academic-terms") {
    const errors = fieldErrors(input, ["academicYearId", "name", "startsAt", "endsAt"])
    if (Object.keys(errors).length) return fail("Please complete the term form", errors)
    const [existingTerms, activeTerms] = await Promise.all([
      prisma.academicTerm.count({ where: { schoolId } }),
      prisma.academicTerm.count({ where: { schoolId, isActive: true } }),
    ])
    const requestedActive = input.isActive === "on" || input.isActive === true
    const shouldBeActive = existingTerms === 0 || activeTerms === 0 || requestedActive
    const item = await prisma.$transaction(async (tx) => {
      if (shouldBeActive) {
        await tx.academicTerm.updateMany({
          where: { schoolId },
          data: { isActive: false },
        })
      }

      return tx.academicTerm.create({
        data: {
          academicYearId: clean(input.academicYearId),
          endsAt: toDate(input.endsAt)!,
          isActive: shouldBeActive,
          name: clean(input.name),
          schoolId,
          startsAt: toDate(input.startsAt)!,
        },
      })
    })
    return ok({ academicTerm: item }, "Academic term created", 201)
  }

  return apiError("Admin endpoint not found", 404, "NOT_FOUND")
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireSchoolAdminApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const input = await body(request)
  const schoolId = auth.schoolId!

  if (path[0] === "attendance-sessions" && path[1] && path[2] === "records" && path[3]) {
    try {
      return ok(
        await adjustAttendanceRecord({ schoolId, userId: auth.user!.id }, path[1], path[3], input),
        "Attendance adjusted"
      )
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Attendance could not be adjusted")
    }
  }
  if (path[0] === "classes" && path[1]) return createOrUpdateClass(auth, input, path[1])
  if (path[0] === "teachers" && path[1]) return updateTeacher(auth, path[1], input)
  if (path[0] === "parents" && path[1]) return updateGuardian(auth, path[1], input)
  if (path[0] === "students" && path[1]) return createOrUpdateStudent(auth, input, path[1])
  if (path[0] === "users" && path[1] && path[2] === "reset-password") return resetUserPassword(auth, path[1])
  if (path[0] === "users" && path[1]) {
    const status = toUserStatus(input.status)
    const existing = await prisma.user.findFirst({
      where: { id: path[1], schoolId },
      select: userSelect,
    })
    if (!existing) return apiError("User not found", 404, "NOT_FOUND")
    const user = await prisma.user.update({ where: { id: path[1] }, data: { status }, select: userSelect })
    await recordAudit({ action: AuditAction.UPDATE, description: `Updated ${user.name} status to ${status}.`, entity: "User", entityId: user.id, schoolId, userId: auth.user!.id })
    if (status !== existing.status) {
      const statusMessage = accountStatusMessage(status)
      await notifyUser({
        email: user.email,
        message: statusMessage.message,
        phone: user.phone,
        schoolId,
        subject: statusMessage.subject,
        userId: user.id,
      })
    }
    return ok({ user }, "User updated")
  }
  if (path[0] === "academic-years" && path[1]) {
    const existing = await prisma.academicYear.findFirst({
      where: { id: path[1], schoolId },
      select: { id: true, isActive: true },
    })
    if (!existing) return apiError("Academic year not found", 404, "NOT_FOUND")
    const activeCount = await prisma.academicYear.count({
      where: { schoolId, isActive: true },
    })
    const requestedActive =
      input.isActive === "on" ||
      input.isActive === true ||
      (input.isActive !== undefined && existing.isActive && activeCount <= 1)
    const item = await prisma.$transaction(async (tx) => {
      if (requestedActive) {
        await tx.academicYear.updateMany({
          where: { schoolId, NOT: { id: path[1] } },
          data: { isActive: false },
        })
      }

      return tx.academicYear.update({
        where: { id: path[1] },
        data: {
          ...(input.name ? { name: clean(input.name) } : {}),
          ...(input.startsAt ? { startsAt: toDate(input.startsAt) } : {}),
          ...(input.endsAt ? { endsAt: toDate(input.endsAt) } : {}),
          ...(input.isActive !== undefined ? { isActive: requestedActive } : {}),
        },
      })
    })
    return ok({ academicYear: item }, "Academic year updated")
  }
  if (path[0] === "academic-terms" && path[1]) {
    const existing = await prisma.academicTerm.findFirst({
      where: { id: path[1], schoolId },
      select: { id: true, isActive: true },
    })
    if (!existing) return apiError("Academic term not found", 404, "NOT_FOUND")
    const activeCount = await prisma.academicTerm.count({
      where: { schoolId, isActive: true },
    })
    const requestedActive =
      input.isActive === "on" ||
      input.isActive === true ||
      (input.isActive !== undefined && existing.isActive && activeCount <= 1)
    const item = await prisma.$transaction(async (tx) => {
      if (requestedActive) {
        await tx.academicTerm.updateMany({
          where: { schoolId, NOT: { id: path[1] } },
          data: { isActive: false },
        })
      }

      return tx.academicTerm.update({
        where: { id: path[1] },
        data: {
          ...(input.academicYearId ? { academicYearId: clean(input.academicYearId) } : {}),
          ...(input.name ? { name: clean(input.name) } : {}),
          ...(input.startsAt ? { startsAt: toDate(input.startsAt) } : {}),
          ...(input.endsAt ? { endsAt: toDate(input.endsAt) } : {}),
          ...(input.isActive !== undefined ? { isActive: requestedActive } : {}),
        },
      })
    })
    return ok({ academicTerm: item }, "Academic term updated")
  }
  if (path[0] === "settings") {
    const schoolData = input.school as Record<string, unknown> | undefined
    const settings = input.settings as Record<string, unknown> | undefined
    const settingEntries = Object.entries(settings || {})
    await prisma.$transaction([
      ...(schoolData
        ? [
            prisma.school.update({
              where: { id: schoolId },
              data: {
                ...(schoolData.name ? { name: clean(schoolData.name) } : {}),
                ...(schoolData.email !== undefined ? { email: optionalClean(schoolData.email) } : {}),
                ...(schoolData.phone !== undefined ? { phone: optionalClean(schoolData.phone) } : {}),
                ...(schoolData.address !== undefined ? { address: optionalClean(schoolData.address) } : {}),
                ...(schoolData.city !== undefined ? { city: optionalClean(schoolData.city) } : {}),
                ...(schoolData.region !== undefined ? { region: optionalClean(schoolData.region) } : {}),
              },
            }),
          ]
        : []),
      ...(settingEntries.length
        ? [
            prisma.schoolSetting.deleteMany({
              where: { schoolId, key: { in: settingEntries.map(([key]) => key) } },
            }),
            prisma.schoolSetting.createMany({
              data: settingEntries.map(([key, value]) => ({ schoolId, key, value: clean(value) })),
            }),
          ]
        : []),
    ])
    return ok({}, "Settings updated")
  }

  return apiError("Admin endpoint not found", 404, "NOT_FOUND")
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireSchoolAdminApi(request)
  if (auth.response) return auth.response
  const path = (await context.params).path || []
  const schoolId = auth.schoolId!

  if (path[0] === "classes" && path[1]) {
    const existing = await prisma.class.findFirst({
      where: { id: path[1], schoolId },
      select: { id: true },
    })
    if (!existing) return apiError("Class not found", 404, "NOT_FOUND")
    await prisma.class.delete({ where: { id: path[1] } })
    return ok({}, "Class archived")
  }
  if (path[0] === "students" && path[1]) {
    const existing = await prisma.student.findFirst({
      where: { id: path[1], schoolId },
      select: { id: true },
    })
    if (!existing) return apiError("Student not found", 404, "NOT_FOUND")
    await prisma.student.update({ where: { id: path[1] }, data: { isActive: false } })
    return ok({}, "Student archived")
  }

  return apiError("Admin endpoint not found", 404, "NOT_FOUND")
}
