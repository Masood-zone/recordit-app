import { NextResponse } from "next/server"

import { AuditAction } from "@/app/generated/prisma/enums"
import { apiError, requireApiRole } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

type RouteContext = {
  params: Promise<{ schoolId: string }>
}

type UpdateSchoolInput = {
  adminEmail?: string
  adminName?: string
  adminPhone?: string
  city?: string
  contactEmail?: string
  contactName?: string
  contactPhone?: string
  contactRole?: string
  email?: string
  name?: string
  phone?: string
  region?: string
}

async function getSchoolDetail(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      region: true,
      country: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      users: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      classes: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
          createdAt: true,
          _count: { select: { students: true } },
        },
      },
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 20,
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          gender: true,
          isActive: true,
          class: { select: { name: true } },
        },
      },
      attendanceSessions: {
        orderBy: { sessionDate: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          sessionDate: true,
          status: true,
          class: { select: { name: true } },
          _count: { select: { records: true } },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          type: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      },
      settings: {
        where: {
          key: {
            in: ["contactName", "contactRole", "contactPhone", "contactEmail"],
          },
        },
        select: {
          key: true,
          value: true,
        },
      },
      _count: {
        select: {
          users: true,
          teachers: true,
          students: true,
          classes: true,
          attendanceRecords: true,
          reports: true,
          biometricDevices: true,
        },
      },
    },
  })

  if (!school) {
    return null
  }

  const settings = Object.fromEntries(
    school.settings.map((setting) => [setting.key, setting.value])
  )

  return {
    ...school,
    admin: school.users.find((user) => user.role === "SCHOOL_ADMIN") ?? null,
    contact: {
      name: settings.contactName ?? "",
      role: settings.contactRole ?? "",
      phone: settings.contactPhone ?? "",
      email: settings.contactEmail ?? "",
    },
    settings: undefined,
  }
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const { schoolId } = await context.params
  const school = await getSchoolDetail(schoolId)

  if (!school) {
    return apiError("School not found", 404, "NOT_FOUND")
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { school },
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const { schoolId } = await context.params
  const input = (await request.json()) as UpdateSchoolInput
  const existingSchool = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true },
  })

  if (!existingSchool) {
    return apiError("School not found", 404, "NOT_FOUND")
  }

  await prisma.$transaction(async (tx) => {
    await tx.school.update({
      where: { id: schoolId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.phone ? { phone: input.phone.trim() } : {}),
        ...(input.city ? { city: input.city.trim() } : {}),
        ...(input.region ? { region: input.region.trim() } : {}),
      },
    })

    const admin = await tx.user.findFirst({
      where: { schoolId, role: "SCHOOL_ADMIN" },
      select: { id: true },
    })

    if (admin && (input.adminName || input.adminEmail || input.adminPhone)) {
      await tx.user.update({
        where: { id: admin.id },
        data: {
          ...(input.adminName ? { name: input.adminName.trim() } : {}),
          ...(input.adminEmail
            ? { email: input.adminEmail.trim().toLowerCase() }
            : {}),
          ...(input.adminPhone ? { phone: input.adminPhone.trim() } : {}),
        },
      })
    }

    for (const [key, value] of [
      ["contactName", input.contactName],
      ["contactRole", input.contactRole],
      ["contactPhone", input.contactPhone],
      ["contactEmail", input.contactEmail],
    ] as const) {
      if (typeof value === "string") {
        await tx.schoolSetting.upsert({
          where: { schoolId_key: { schoolId, key } },
          create: { schoolId, key, value: value.trim() },
          update: { value: value.trim() },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        schoolId,
        userId: auth.user!.id,
        action: AuditAction.UPDATE,
        entity: "School",
        entityId: schoolId,
        description: "Super Admin updated school profile details.",
      },
    })
  })

  const school = await getSchoolDetail(schoolId)

  return NextResponse.json<ApiResponse>({
    success: true,
    message: "School updated",
    data: { school },
  })
}
