import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import { emailService } from "@/services/email/email-service"
import { smsService } from "@/services/sms/sms-service"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        returned: true,
      },
      status: {
        type: "string",
        input: false,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const account = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          email: true,
          name: true,
          phone: true,
        },
      })

      const userEmail = account?.email || user.email
      const userName = account?.name || user.name || "there"
      const jobs: Array<Promise<void>> = [
        emailService.sendPasswordResetEmail({
          resetUrl: url,
          userEmail,
          userName,
        }),
      ]

      if (account?.phone) {
        jobs.push(
          smsService.sendPasswordResetSMS({
            phoneNumber: account.phone,
            resetUrl: url,
            userName,
          })
        )
      }

      const results = await Promise.allSettled(jobs)
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Password reset delivery failed:", result.reason)
        }
      }
    },
    onPasswordReset: async ({ user }) => {
      console.info(`RecordIT password reset completed for ${user.email}`)
    },
  },
})
