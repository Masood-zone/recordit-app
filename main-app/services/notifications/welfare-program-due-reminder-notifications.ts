import { NotificationType } from "@/app/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"

interface DueReminderMember {
  email: string
  id: string
  name: string
  phone: string | null
}

export interface DueReminderNotificationResult {
  emailSentAt?: Date
  errors: string[]
  inAppSentAt?: Date
  smsSentAt?: Date
}

export function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

export async function notifyWelfareProgramDueReminder(args: {
  amount: number
  dueAt: Date
  frequency: string
  member: DueReminderMember
  organizationName: string
  programTitle: string
}): Promise<DueReminderNotificationResult> {
  const dueDate = formatDueDate(args.dueAt)
  const result: DueReminderNotificationResult = { errors: [] }
  const message = `${args.programTitle} contribution is due on ${dueDate}.`

  try {
    await prisma.notification.create({
      data: {
        message,
        title: "Welfare contribution due tomorrow",
        type: NotificationType.WARNING,
        userId: args.member.id,
      },
    })
    result.inAppSentAt = new Date()
  } catch (error) {
    console.error("Welfare due in-app notification failed:", error)
    result.errors.push("in-app notification failed")
  }

  try {
    await emailService.sendWelfareProgramDueReminderEmail({
      amount: args.amount,
      dueDate,
      frequency: args.frequency,
      memberEmail: args.member.email,
      memberName: args.member.name,
      organizationName: args.organizationName,
      programTitle: args.programTitle,
    })
    result.emailSentAt = new Date()
  } catch (error) {
    console.error("Welfare due reminder email failed:", error)
    result.errors.push("email failed")
  }

  if (args.member.phone) {
    try {
      await smsService.sendWelfareProgramDueReminderSMS({
        amount: args.amount,
        dueDate,
        frequency: args.frequency,
        memberName: args.member.name,
        organizationName: args.organizationName,
        phoneNumber: args.member.phone,
        programTitle: args.programTitle,
      })
      result.smsSentAt = new Date()
    } catch (error) {
      console.error("Welfare due reminder SMS failed:", error)
      result.errors.push("sms failed")
    }
  }

  return result
}
