import { randomUUID } from "node:crypto"

import { hashPassword } from "better-auth/crypto"
import { NextResponse } from "next/server"

import {
  AuditAction,
  SchoolStatus,
  UserRole,
  UserStatus,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"
import type { ApiResponse } from "@/types"

type SchoolOnboardingInput = {
  adminEmail?: string
  adminFirstName?: string
  adminLastName?: string
  adminPhone?: string
  city?: string
  confirmPassword?: string
  contactEmail?: string
  contactName?: string
  contactPhone?: string
  contactRole?: string
  password?: string
  region?: string
  schoolAddress?: string
  schoolCode?: string
  schoolEmail?: string
  schoolName?: string
  schoolPhone?: string
}

function fail(
  message: string,
  status: number,
  errors?: Record<string, string[]>
) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message,
      code: status === 409 ? "CONFLICT" : "VALIDATION_ERROR",
      errors,
    },
    { status }
  )
}

function required(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function POST(request: Request) {
  const input = (await request.json()) as SchoolOnboardingInput
  const errors: Record<string, string[]> = {}

  for (const field of [
    "schoolName",
    "schoolCode",
    "schoolEmail",
    "schoolPhone",
    "schoolAddress",
    "city",
    "region",
    "contactName",
    "contactRole",
    "contactPhone",
    "contactEmail",
    "adminFirstName",
    "adminLastName",
    "adminEmail",
    "adminPhone",
    "password",
    "confirmPassword",
  ] as const) {
    if (!required(input[field])) {
      errors[field] = ["This field is required"]
    }
  }

  if (input.password && input.password.length < 8) {
    errors.password = ["Password must be at least 8 characters"]
  }

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = ["Passwords do not match"]
  }

  if (Object.keys(errors).length > 0) {
    return fail("Please complete the onboarding form", 400, errors)
  }

  const schoolCode = input.schoolCode!.trim().toUpperCase()
  const schoolEmail = normalizeEmail(input.schoolEmail!)
  const adminEmail = normalizeEmail(input.adminEmail!)
  const contactEmail = normalizeEmail(input.contactEmail!)

  const [existingSchool, existingUser] = await Promise.all([
    prisma.school.findFirst({
      where: {
        OR: [{ code: schoolCode }, { email: schoolEmail }],
      },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    }),
  ])

  if (existingSchool) {
    return fail("A school with this code or email already exists", 409)
  }

  if (existingUser) {
    return fail("An account with this administrator email already exists", 409)
  }

  const adminName = `${input.adminFirstName!.trim()} ${input.adminLastName!.trim()}`
  const passwordHash = await hashPassword(input.password!)

  const created = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: input.schoolName!.trim(),
        code: schoolCode,
        email: schoolEmail,
        phone: input.schoolPhone!.trim(),
        address: input.schoolAddress!.trim(),
        city: input.city!.trim(),
        region: input.region!.trim(),
        country: "Ghana",
        status: SchoolStatus.PENDING,
      },
    })

    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        name: adminName,
        email: adminEmail,
        emailVerified: true,
        schoolId: school.id,
        role: UserRole.SCHOOL_ADMIN,
        status: UserStatus.ACTIVE,
        firstName: input.adminFirstName!.trim(),
        lastName: input.adminLastName!.trim(),
        phone: input.adminPhone!.trim(),
      },
    })

    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    })

    await tx.schoolSetting.createMany({
      data: [
        {
          schoolId: school.id,
          key: "contactName",
          value: input.contactName!.trim(),
        },
        {
          schoolId: school.id,
          key: "contactRole",
          value: input.contactRole!.trim(),
        },
        {
          schoolId: school.id,
          key: "contactPhone",
          value: input.contactPhone!.trim(),
        },
        { schoolId: school.id, key: "contactEmail", value: contactEmail },
      ],
    })

    await tx.auditLog.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        action: AuditAction.CREATE,
        entity: "SchoolOnboarding",
        entityId: school.id,
        description: `${school.name} submitted a RecordIT onboarding application.`,
      },
    })

    const emailNotification = await tx.notification.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        channel: "EMAIL",
        status: "PENDING",
        title: "School onboarding received",
        message: `RecordIT received ${school.name}'s onboarding application.`,
      },
    })

    const smsNotification = await tx.notification.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        channel: "SMS",
        status: "PENDING",
        title: "School onboarding received",
        message: `RecordIT received ${school.name}'s onboarding application.`,
      },
    })

    return { school, user, emailNotification, smsNotification }
  })

  const notificationAttempts = [
    emailService
      .sendSchoolOnboardingReceivedEmail({
        contactEmail,
        contactName: input.contactName!.trim(),
        schoolName: created.school.name,
      })
      .then(() =>
        prisma.notification.update({
          where: { id: created.emailNotification.id },
          data: { status: "SENT", sentAt: new Date() },
        })
      )
      .catch((error) =>
        prisma.notification.update({
          where: { id: created.emailNotification.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            failureReason:
              error instanceof Error ? error.message : "Email delivery failed",
          },
        })
      ),
    smsService
      .sendSchoolOnboardingReceivedSMS({
        contactName: input.contactName!.trim(),
        phoneNumber: input.contactPhone!.trim(),
        schoolName: created.school.name,
      })
      .then(() =>
        prisma.notification.update({
          where: { id: created.smsNotification.id },
          data: { status: "SENT", sentAt: new Date() },
        })
      )
      .catch((error) =>
        prisma.notification.update({
          where: { id: created.smsNotification.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            failureReason:
              error instanceof Error ? error.message : "SMS delivery failed",
          },
        })
      ),
  ]

  await Promise.all(notificationAttempts)

  return NextResponse.json<ApiResponse<{ schoolId: string; status: string }>>(
    {
      success: true,
      message: "School onboarding application submitted",
      data: {
        schoolId: created.school.id,
        status: created.school.status,
      },
    },
    { status: 201 }
  )
}
