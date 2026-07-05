import { prisma } from "@/lib/prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"

export async function notifyPaymentSuccess(args: {
  amount: number
  member: {
    email: string
    id: string
    name: string
    phone: string | null
  }
  organizationName: string
  paidAt: Date
  programTitle: string
  reference: string
}) {
  const paidAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(args.paidAt)

  await prisma.notification.create({
    data: {
      message: `Your payment of GHS ${args.amount.toFixed(2)} for ${args.programTitle} was confirmed.`,
      title: "Payment successful",
      channel: "IN_APP",
      status: "SENT",
      sentAt: new Date(),
      userId: args.member.id,
    },
  })

  try {
    await emailService.sendPaymentSuccessEmail({
      amount: args.amount,
      memberEmail: args.member.email,
      memberName: args.member.name,
      organizationName: args.organizationName,
      paidAt,
      programTitle: args.programTitle,
      reference: args.reference,
    })
  } catch (error) {
    console.error("Payment success email failed:", error)
  }

  if (args.member.phone) {
    try {
      await smsService.sendPaymentSuccessSMS({
        amount: args.amount,
        memberName: args.member.name,
        organizationName: args.organizationName,
        paidAt,
        phoneNumber: args.member.phone,
        programTitle: args.programTitle,
        reference: args.reference,
      })
    } catch (error) {
      console.error("Payment success SMS failed:", error)
    }
  }
}
