import { NextResponse } from "next/server"

import { AuditAction, SchoolStatus, UserRole } from "@/app/generated/prisma/enums"
import { apiError, requireApiRole } from "@/lib/api-auth"
import { notifyUser } from "@/lib/admin-utils"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type RouteContext = {
  params: Promise<{ schoolId: string }>
}

type ApprovalRecipient = {
  email?: string | null
  name: string
  phone?: string | null
  userId?: string | null
}

function value(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

function dedupeRecipients(recipients: ApprovalRecipient[]) {
  const seen = new Set<string>()

  return recipients.filter((recipient) => {
    const emailKey = value(recipient.email).toLowerCase()
    const phoneKey = value(recipient.phone).replace(/\D/g, "")
    const key = `${emailKey}|${phoneKey}|${recipient.userId ?? ""}`

    if ((!emailKey && !phoneKey) || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const { schoolId } = await context.params
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      email: true,
      id: true,
      name: true,
      phone: true,
      settings: {
        where: {
          key: { in: ["contactEmail", "contactName", "contactPhone"] },
        },
        select: { key: true, value: true },
      },
      users: {
        where: { role: UserRole.SCHOOL_ADMIN },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true, id: true, name: true, phone: true },
      },
    },
  })

  if (!school) {
    return apiError("School not found", 404, "NOT_FOUND")
  }

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.school.update({
      where: { id: schoolId },
      data: { status: SchoolStatus.ACTIVE },
      select: { id: true, name: true, status: true },
    })

    await tx.auditLog.create({
      data: {
        schoolId,
        userId: auth.user!.id,
        action: AuditAction.UPDATE,
        entity: "School",
        entityId: schoolId,
        description: `Super Admin approved ${school.name}.`,
      },
    })

    return approved
  })

  const settings = Object.fromEntries(
    school.settings.map((setting) => [setting.key, setting.value])
  )
  const admin = school.users[0]
  const dashboardUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || ""
  }/admin/dashboard`
  const recipients = dedupeRecipients([
    {
      email: school.email,
      name: school.name,
      phone: school.phone,
    },
    {
      email: settings.contactEmail,
      name: value(settings.contactName) || school.name,
      phone: settings.contactPhone,
    },
    {
      email: admin?.email,
      name: admin?.name || school.name,
      phone: admin?.phone,
      userId: admin?.id,
    },
  ])

  await Promise.allSettled(
    recipients.map((recipient) =>
      notifyUser({
        email: recipient.email,
        message: `Hello ${recipient.name}, ${school.name} has been approved on RecordIT. The School Admin dashboard is now available${dashboardUrl ? ` at ${dashboardUrl}` : ""}.`,
        phone: recipient.phone,
        schoolId,
        subject: "RecordIT school approval completed",
        userId: recipient.userId,
      })
    )
  )

  return NextResponse.json<ApiResponse>({
    success: true,
    message: "School approved",
    data: { school: updated },
  })
}
