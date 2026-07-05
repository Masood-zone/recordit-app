import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

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
  },
})
