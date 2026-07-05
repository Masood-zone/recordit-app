import { NextResponse } from "next/server"

import { UserRole } from "@/app/generated/prisma/enums"
import { requireApiRole } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse, SchoolStatus } from "@/types"

const CONTACT_SETTING_KEYS = [
  "contactName",
  "contactRole",
  "contactPhone",
  "contactEmail",
]

const schoolSelect = {
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
  _count: {
    select: {
      users: true,
      students: true,
      classes: true,
      attendanceRecords: true,
    },
  },
  users: {
    where: { role: UserRole.SCHOOL_ADMIN },
    take: 1,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    },
  },
  settings: {
    where: {
      key: {
        in: CONTACT_SETTING_KEYS,
      },
    },
    select: {
      key: true,
      value: true,
    },
  },
} as const

function mapSchool(school: {
  settings: Array<{ key: string; value: string }>
  users: Array<unknown>
  [key: string]: unknown
}) {
  const settings = Object.fromEntries(
    school.settings.map((setting) => [setting.key, setting.value])
  )

  return {
    ...school,
    admin: school.users[0] ?? null,
    contact: {
      name: settings.contactName ?? "",
      role: settings.contactRole ?? "",
      phone: settings.contactPhone ?? "",
      email: settings.contactEmail ?? "",
    },
    users: undefined,
    settings: undefined,
  }
}

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim()
  const status = searchParams.get("status") as SchoolStatus | "ALL" | null
  const page = Math.max(Number(searchParams.get("page") || 1), 1)
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 12), 1),
    50
  )

  const where = {
    ...(status && status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
            { region: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [schools, total, counts] = await Promise.all([
    prisma.school.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: schoolSelect,
    }),
    prisma.school.count({ where }),
    prisma.school.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      schools: schools.map((school) => mapSchool(school as never)),
      summary: Object.fromEntries(
        counts.map((item) => [item.status, item._count._all])
      ),
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  })
}
