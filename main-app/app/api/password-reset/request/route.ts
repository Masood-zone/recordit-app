import { createHash, randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { UserStatus } from "@/app/generated/prisma/enums"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GENERIC_MESSAGE = "Account Reset instructions have been sent."
const THROTTLE_PREFIX = "recordit-password-reset"
const THROTTLE_WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 3

function jsonSuccess() {
  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

function normalizePhone(value: string) {
  const digits = phoneDigits(value)

  if (digits.length === 9) return `233${digits}`
  if (digits.length === 10 && digits.startsWith("0")) {
    return `233${digits.slice(1)}`
  }
  if (digits.length === 12 && digits.startsWith("233")) return digits

  return digits
}

function throttleIdentifier(identifier: string) {
  const hash = createHash("sha256")
    .update(identifier.toLowerCase())
    .digest("hex")

  return `${THROTTLE_PREFIX}:${hash}`
}

async function isThrottled(identifier: string) {
  const now = new Date()
  const throttleKey = throttleIdentifier(identifier)

  await prisma.verification.deleteMany({
    where: {
      identifier: { startsWith: `${THROTTLE_PREFIX}:` },
      expiresAt: { lt: now },
    },
  })

  const attempts = await prisma.verification.count({
    where: {
      identifier: throttleKey,
      expiresAt: { gt: now },
    },
  })

  if (attempts >= MAX_REQUESTS_PER_WINDOW) return true

  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier: throttleKey,
      value: "requested",
      expiresAt: new Date(now.getTime() + THROTTLE_WINDOW_MS),
    },
  })

  return false
}

async function findEmailForIdentifier(identifier: string) {
  if (isEmail(identifier)) {
    const user = await prisma.user.findFirst({
      where: {
        email: identifier.toLowerCase(),
        status: UserStatus.ACTIVE,
      },
      select: { email: true },
    })

    return user?.email ?? null
  }

  const normalizedPhone = normalizePhone(identifier)
  if (normalizedPhone.length < 9) return null

  const lastNineDigits = normalizedPhone.slice(-9)
  const lastFourDigits = normalizedPhone.slice(-4)
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { phone: { contains: lastNineDigits } },
        { phone: { contains: lastFourDigits } },
      ],
      status: UserStatus.ACTIVE,
    },
    select: {
      email: true,
      phone: true,
    },
    take: 25,
  })

  const matches = users.filter(
    (user) => user.phone && normalizePhone(user.phone) === normalizedPhone
  )

  if (matches.length !== 1) return null

  return matches[0].email
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: "Enter your email address or phone number." },
      { status: 400 }
    )
  }

  const identifier =
    body && typeof body === "object" && "identifier" in body
      ? clean(body.identifier)
      : ""

  if (!identifier) {
    return NextResponse.json(
      { ok: false, message: "Enter your email address or phone number." },
      { status: 400 }
    )
  }

  const normalizedIdentifier = isEmail(identifier)
    ? identifier.toLowerCase()
    : normalizePhone(identifier)

  if (await isThrottled(normalizedIdentifier)) {
    return jsonSuccess()
  }

  const email = await findEmailForIdentifier(identifier)
  if (!email) return jsonSuccess()

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: new URL("/reset-password", request.url).toString(),
      },
    })
  } catch (error) {
    console.error("Password reset request failed:", error)
  }

  return jsonSuccess()
}
