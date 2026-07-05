import { randomBytes, randomUUID } from "node:crypto"

import { hashPassword } from "better-auth/crypto"

import {
  AuditAction,
  NotificationChannel,
  NotificationStatus,
  UserRole,
  UserStatus,
} from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"

export function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function optionalClean(value: unknown) {
  const text = clean(value)
  return text.length > 0 ? text : undefined
}

export function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase()
}

export function temporaryPassword() {
  return `Rec-${randomBytes(5).toString("base64url")}9!`
}

export function fieldErrors(
  input: Record<string, unknown>,
  fields: string[]
) {
  const errors: Record<string, string[]> = {}

  for (const field of fields) {
    if (!clean(input[field])) {
      errors[field] = ["This field is required"]
    }
  }

  return errors
}

export async function upsertCredentialAccount(userId: string, password: string) {
  const passwordHash = await hashPassword(password)
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  })

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: passwordHash },
    })
    return
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    },
  })
}

export async function createUserWithAccount(args: {
  email: string
  firstName: string
  lastName: string
  name?: string
  password: string
  phone?: string
  role: UserRole
  schoolId: string
  status?: UserStatus
}) {
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: normalizeEmail(args.email),
      emailVerified: true,
      firstName: args.firstName,
      lastName: args.lastName,
      name: args.name || `${args.firstName} ${args.lastName}`.trim(),
      phone: args.phone,
      role: args.role,
      schoolId: args.schoolId,
      status: args.status || UserStatus.ACTIVE,
    },
  })

  await upsertCredentialAccount(user.id, args.password)

  return user
}

export async function recordAudit(args: {
  action: AuditAction
  description: string
  entity: string
  entityId?: string
  schoolId: string
  userId: string
}) {
  await prisma.auditLog.create({
    data: {
      action: args.action,
      description: args.description,
      entity: args.entity,
      entityId: args.entityId,
      schoolId: args.schoolId,
      userId: args.userId,
    },
  })
}

export async function notifyUser(args: {
  email?: string | null
  message: string
  phone?: string | null
  schoolId: string
  subject: string
  userId?: string | null
}) {
  const jobs: Array<Promise<unknown>> = []

  if (args.email) {
    jobs.push(
      prisma.notification
        .create({
          data: {
            channel: NotificationChannel.EMAIL,
            message: args.message,
            schoolId: args.schoolId,
            status: NotificationStatus.PENDING,
            title: args.subject,
            userId: args.userId,
          },
        })
        .then(async (notification) => {
          try {
            await emailService.sendEmail({
              to: args.email!,
              subject: args.subject,
              text: args.message,
              html: `<p>${args.message}</p>`,
            })
            await prisma.notification.update({
              where: { id: notification.id },
              data: { status: NotificationStatus.SENT, sentAt: new Date() },
            })
          } catch (error) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                failedAt: new Date(),
                failureReason:
                  error instanceof Error ? error.message : "Email failed",
                status: NotificationStatus.FAILED,
              },
            })
          }
        })
    )
  }

  if (args.phone) {
    jobs.push(
      prisma.notification
        .create({
          data: {
            channel: NotificationChannel.SMS,
            message: args.message,
            schoolId: args.schoolId,
            status: NotificationStatus.PENDING,
            title: args.subject,
            userId: args.userId,
          },
        })
        .then(async (notification) => {
          try {
            await smsService.sendSMS({ to: args.phone!, message: args.message })
            await prisma.notification.update({
              where: { id: notification.id },
              data: { status: NotificationStatus.SENT, sentAt: new Date() },
            })
          } catch (error) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                failedAt: new Date(),
                failureReason: error instanceof Error ? error.message : "SMS failed",
                status: NotificationStatus.FAILED,
              },
            })
          }
        })
    )
  }

  await Promise.allSettled(jobs)
}

export const userSelect = {
  createdAt: true,
  email: true,
  firstName: true,
  id: true,
  lastName: true,
  name: true,
  phone: true,
  role: true,
  status: true,
} as const
