import { NextResponse } from "next/server"

import { SchoolStatus, UserRole } from "@/app/generated/prisma/enums"
import { requireApiRole } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types"

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["SUPER_ADMIN"])

  if (auth.response) {
    return auth.response
  }

  const [
    schoolStatusCounts,
    totalStudents,
    totalTeachers,
    totalUsers,
    attendanceRecords,
    recentSchools,
  ] = await Promise.all([
    prisma.school.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.user.count({ where: { role: { not: UserRole.SUPER_ADMIN } } }),
    prisma.attendanceRecord.count(),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        region: true,
        status: true,
        createdAt: true,
      },
    }),
  ])
  const schoolsByStatus = new Map(
    schoolStatusCounts.map((item) => [item.status, item._count._all])
  )
  const totalSchools = schoolStatusCounts.reduce((total, item) => total + item._count._all, 0)
  const activeSchools = schoolsByStatus.get(SchoolStatus.ACTIVE) ?? 0
  const pendingSchools = schoolsByStatus.get(SchoolStatus.PENDING) ?? 0
  const suspendedSchools = schoolsByStatus.get(SchoolStatus.SUSPENDED) ?? 0

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      metrics: {
        totalSchools,
        activeSchools,
        pendingSchools,
        suspendedSchools,
        totalStudents,
        totalTeachers,
        totalUsers,
        attendanceRecords,
      },
      recentSchools,
    },
  })
}
