import "dotenv/config"
import { randomUUID } from "node:crypto"

import { hashPassword } from "better-auth/crypto"

import {
  AttendanceSessionStatus,
  AttendanceStatus,
  Gender,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  SchoolStatus,
  UserRole,
  UserStatus,
} from "../app/generated/prisma/enums"
import { prisma } from "../lib/prisma"

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "superadmin@recordit.app"
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!"
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "RecordIT Super Admin"

function nameParts(name: string) {
  const [firstName, ...lastNameParts] = name.trim().split(/\s+/)
  return { firstName: firstName || name, lastName: lastNameParts.join(" ") || null }
}

async function upsertUserWithPassword(args: {
  email: string
  name: string
  password: string
  role: UserRole
  schoolId?: string
  phone?: string
  image?: string
}) {
  const email = args.email.trim().toLowerCase()
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  const userId = existingUser?.id || randomUUID()
  const passwordHash = await hashPassword(args.password)
  const parts = nameParts(args.name)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      id: userId,
      email,
      emailVerified: true,
      firstName: parts.firstName,
      image: args.image,
      lastName: parts.lastName,
      name: args.name,
      phone: args.phone,
      role: args.role,
      schoolId: args.schoolId,
      status: UserStatus.ACTIVE,
    },
    update: {
      emailVerified: true,
      firstName: parts.firstName,
      image: args.image,
      lastName: parts.lastName,
      name: args.name,
      phone: args.phone,
      role: args.role,
      schoolId: args.schoolId,
      status: UserStatus.ACTIVE,
    },
  })

  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
    select: { id: true },
  })

  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: {
        accountId: user.id,
        password: passwordHash,
      },
    })
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    })
  }

  return user
}

async function seedSuperAdmin() {
  const user = await upsertUserWithPassword({
    email: SUPER_ADMIN_EMAIL,
    name: SUPER_ADMIN_NAME.trim(),
    password: SUPER_ADMIN_PASSWORD,
    role: UserRole.SUPER_ADMIN,
  })

  console.log(`Seeded Super Admin: ${user.email}`)
}

async function seedParentPortalDemo() {
  const school = await prisma.school.upsert({
    where: { code: "RID-DEMO" },
    create: {
      address: "128 Academic Drive",
      city: "Accra",
      code: "RID-DEMO",
      country: "Ghana",
      email: "admin@recordit-demo.edu.gh",
      name: "RecordIT Demonstration School",
      phone: "+233 30 200 1234",
      region: "Greater Accra",
      status: SchoolStatus.ACTIVE,
    },
    update: {
      address: "128 Academic Drive",
      city: "Accra",
      email: "admin@recordit-demo.edu.gh",
      name: "RecordIT Demonstration School",
      phone: "+233 30 200 1234",
      region: "Greater Accra",
      status: SchoolStatus.ACTIVE,
    },
  })

  const year = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026/2027" } },
    create: {
      endsAt: new Date("2027-07-31"),
      isActive: true,
      name: "2026/2027",
      schoolId: school.id,
      startsAt: new Date("2026-01-01"),
    },
    update: { isActive: true },
  })

  const term = await prisma.academicTerm.upsert({
    where: {
      schoolId_academicYearId_name: {
        academicYearId: year.id,
        name: "Term 1",
        schoolId: school.id,
      },
    },
    create: {
      academicYearId: year.id,
      endsAt: new Date("2026-08-31"),
      isActive: true,
      name: "Term 1",
      schoolId: school.id,
      startsAt: new Date("2026-06-01"),
    },
    update: { isActive: true },
  })

  const teacherUser = await upsertUserWithPassword({
    email: "teacher.parent-demo@recordit.app",
    name: "Jonathan Smith",
    password: "Teacher123!",
    phone: "+233 24 000 1111",
    role: UserRole.TEACHER,
    schoolId: school.id,
  })

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    create: {
      department: "Science",
      schoolId: school.id,
      staffNumber: "RID-T-001",
      title: "Mr.",
      userId: teacherUser.id,
    },
    update: {
      department: "Science",
      schoolId: school.id,
      staffNumber: "RID-T-001",
      title: "Mr.",
    },
  })

  const klass = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Grade 8 - Science Stream" } },
    create: {
      academicYearId: year.id,
      code: "G8-SCI",
      level: "Grade 8",
      name: "Grade 8 - Science Stream",
      schoolId: school.id,
    },
    update: {
      academicYearId: year.id,
      code: "G8-SCI",
      level: "Grade 8",
    },
  })

  await prisma.classTeacher.upsert({
    where: { classId_teacherId: { classId: klass.id, teacherId: teacher.id } },
    create: { classId: klass.id, isLead: true, teacherId: teacher.id },
    update: { isLead: true },
  })

  const parentUser = await upsertUserWithPassword({
    email: "parent.demo@recordit.app",
    name: "Sarah Holloway",
    password: "Parent123!",
    phone: "+233 24 000 2222",
    role: UserRole.PARENT_GUARDIAN,
    schoolId: school.id,
  })

  const guardian = await prisma.parentGuardian.upsert({
    where: { userId: parentUser.id },
    create: {
      address: "452 Oak Lane",
      occupation: "Accountant",
      relationship: "Mother",
      schoolId: school.id,
      userId: parentUser.id,
    },
    update: {
      address: "452 Oak Lane",
      occupation: "Accountant",
      relationship: "Mother",
      schoolId: school.id,
    },
  })

  const marcus = await prisma.student.upsert({
    where: { schoolId_studentNumber: { schoolId: school.id, studentNumber: "RID-STU-001" } },
    create: {
      classId: klass.id,
      dateOfBirth: new Date("2012-05-14"),
      firstName: "Marcus",
      gender: Gender.MALE,
      lastName: "Holloway",
      schoolId: school.id,
      studentNumber: "RID-STU-001",
    },
    update: { classId: klass.id, firstName: "Marcus", gender: Gender.MALE, lastName: "Holloway" },
  })

  const sarah = await prisma.student.upsert({
    where: { schoolId_studentNumber: { schoolId: school.id, studentNumber: "RID-STU-002" } },
    create: {
      classId: klass.id,
      dateOfBirth: new Date("2015-03-22"),
      firstName: "Sarah",
      gender: Gender.FEMALE,
      lastName: "Holloway",
      schoolId: school.id,
      studentNumber: "RID-STU-002",
    },
    update: { classId: klass.id, firstName: "Sarah", gender: Gender.FEMALE, lastName: "Holloway" },
  })

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { guardianId: guardian.id, studentId: marcus.id } },
    create: { guardianId: guardian.id, isPrimary: true, relationship: "Mother", studentId: marcus.id },
    update: { isPrimary: true, relationship: "Mother" },
  })

  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { guardianId: guardian.id, studentId: sarah.id } },
    create: { guardianId: guardian.id, isPrimary: false, relationship: "Mother", studentId: sarah.id },
    update: { isPrimary: false, relationship: "Mother" },
  })

  await prisma.parentNotificationPreference.upsert({
    where: { guardianId: guardian.id },
    create: {
      guardianId: guardian.id,
      schoolId: school.id,
      userId: parentUser.id,
    },
    update: {
      emailEnabled: true,
      inAppEnabled: true,
      lateAlerts: true,
      smsEnabled: true,
      weeklySummary: true,
    },
  })

  const statuses = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.EXCUSED,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
  ]
  const today = new Date()
  today.setHours(8, 15, 0, 0)

  for (let index = 0; index < statuses.length; index += 1) {
    const sessionDate = new Date(today)
    sessionDate.setDate(today.getDate() - index)
    const session = await prisma.attendanceSession.upsert({
      where: {
        id: `demo-parent-session-${index}`,
      },
      create: {
        academicTermId: term.id,
        academicYearId: year.id,
        classId: klass.id,
        createdByUserId: teacherUser.id,
        id: `demo-parent-session-${index}`,
        schoolId: school.id,
        sessionDate,
        startsAt: sessionDate,
        status: AttendanceSessionStatus.CLOSED,
        teacherId: teacher.id,
        title: "Morning Roll Call",
      },
      update: {
        classId: klass.id,
        schoolId: school.id,
        sessionDate,
        startsAt: sessionDate,
        status: AttendanceSessionStatus.CLOSED,
        teacherId: teacher.id,
      },
    })

    await prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId: marcus.id } },
      create: {
        markedAt: sessionDate,
        remarks: statuses[index] === AttendanceStatus.EXCUSED ? "Sick leave approved." : null,
        schoolId: school.id,
        sessionId: session.id,
        status: statuses[index],
        studentId: marcus.id,
      },
      update: {
        markedAt: sessionDate,
        remarks: statuses[index] === AttendanceStatus.EXCUSED ? "Sick leave approved." : null,
        status: statuses[index],
      },
    })

    await prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId: sarah.id } },
      create: {
        markedAt: sessionDate,
        schoolId: school.id,
        sessionId: session.id,
        status: AttendanceStatus.PRESENT,
        studentId: sarah.id,
      },
      update: {
        markedAt: sessionDate,
        status: AttendanceStatus.PRESENT,
      },
    })
  }

  const absenceRecord = await prisma.attendanceRecord.findFirst({
    where: { studentId: marcus.id, status: AttendanceStatus.ABSENT },
    orderBy: { markedAt: "desc" },
    select: { id: true, markedAt: true },
  })

  await prisma.notification.deleteMany({
    where: {
      userId: parentUser.id,
      type: {
        in: [
          NotificationType.ABSENCE_ALERT,
          NotificationType.SCHOOL_ANNOUNCEMENT,
          NotificationType.WEEKLY_SUMMARY,
        ],
      },
    },
  })

  await prisma.notification.createMany({
    data: [
      {
        attendanceRecordId: absenceRecord?.id,
        channel: NotificationChannel.IN_APP,
        message:
          "Marcus was not recorded during the morning biometric verification check.",
        readAt: null,
        schoolId: school.id,
        sentAt: new Date(),
        status: NotificationStatus.SENT,
        studentId: marcus.id,
        title: "Marcus missed Morning Roll Call",
        type: NotificationType.ABSENCE_ALERT,
        userId: parentUser.id,
      },
      {
        channel: NotificationChannel.IN_APP,
        message: "Consistency report for the week. Marcus is currently at 80%.",
        readAt: new Date(),
        schoolId: school.id,
        sentAt: new Date(),
        status: NotificationStatus.SENT,
        studentId: marcus.id,
        title: "Weekly attendance summary is ready",
        type: NotificationType.WEEKLY_SUMMARY,
        userId: parentUser.id,
      },
      {
        channel: NotificationChannel.IN_APP,
        message: "Parents evening is scheduled for Friday at the school auditorium.",
        readAt: null,
        schoolId: school.id,
        sentAt: new Date(),
        status: NotificationStatus.SENT,
        title: "Parents evening on Friday",
        type: NotificationType.SCHOOL_ANNOUNCEMENT,
        userId: parentUser.id,
      },
    ],
  })

  console.log("Seeded parent portal demo: parent.demo@recordit.app / Parent123!")
}

async function main() {
  await seedSuperAdmin()
  await seedParentPortalDemo()
}

main()
  .catch((error) => {
    console.error("Seed failed")
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
