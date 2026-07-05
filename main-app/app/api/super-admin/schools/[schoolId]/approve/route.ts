import { NextResponse } from "next/server"

import { AuditAction, SchoolStatus } from "@/app/generated/prisma/enums"
import { apiError, requireApiRole } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type RouteContext = {
  params: Promise<{ schoolId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const { schoolId } = await context.params
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true },
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

  return NextResponse.json<ApiResponse>({
    success: true,
    message: "School approved",
    data: { school: updated },
  })
}
