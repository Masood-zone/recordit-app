import "dotenv/config"
import { randomUUID } from "node:crypto"

import { hashPassword } from "better-auth/crypto"

import { UserRole, UserStatus } from "../app/generated/prisma/enums"
import { prisma } from "../lib/prisma"

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "superadmin@recordit.app"
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!"
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "RecordIT Super Admin"

async function main() {
  const email = SUPER_ADMIN_EMAIL.trim().toLowerCase()
  const name = SUPER_ADMIN_NAME.trim()
  const [firstName, ...lastNameParts] = name.split(/\s+/)
  const lastName = lastNameParts.join(" ") || null
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  const userId = existingUser?.id || randomUUID()
  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      id: userId,
      name,
      email,
      emailVerified: true,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: firstName || "RecordIT",
      lastName,
    },
    update: {
      name,
      emailVerified: true,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: firstName || "RecordIT",
      lastName,
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

  console.log(`Seeded Super Admin: ${user.email}`)
}

main()
  .catch((error) => {
    console.error("Super Admin seed failed")
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
