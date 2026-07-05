import { prisma } from "@/lib/prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"

export async function notifyWelfareProgramEnrollment(args: {
  amount: number
  enrollmentKind: "mandatory" | "optional"
  frequency: string
  member: {
    email: string
    id: string
    name: string
    phone: string | null
  }
  organizationName: string
  programTitle: string
}) {
  const mandatory = args.enrollmentKind === "mandatory"
  const message = mandatory
    ? `${args.organizationName} enrolled you in the mandatory welfare program ${args.programTitle}.`
    : `Your enrollment in ${args.programTitle} has been confirmed.`

  await prisma.notification.create({
    data: {
      message,
      title: mandatory
        ? "Mandatory welfare enrollment"
        : "Welfare enrollment confirmed",
      channel: "IN_APP",
      status: "SENT",
      sentAt: new Date(),
      userId: args.member.id,
    },
  })

  try {
    await emailService.sendWelfareProgramEnrollmentEmail({
      amount: args.amount,
      enrollmentKind: args.enrollmentKind,
      frequency: args.frequency,
      memberEmail: args.member.email,
      memberName: args.member.name,
      organizationName: args.organizationName,
      programTitle: args.programTitle,
    })
  } catch (error) {
    console.error("Welfare enrollment email failed:", error)
  }

  if (args.member.phone) {
    try {
      await smsService.sendWelfareProgramEnrollmentSMS({
        amount: args.amount,
        enrollmentKind: args.enrollmentKind,
        frequency: args.frequency,
        memberName: args.member.name,
        organizationName: args.organizationName,
        phoneNumber: args.member.phone,
        programTitle: args.programTitle,
      })
    } catch (error) {
      console.error("Welfare enrollment SMS failed:", error)
    }
  }
}
