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
    totalSchools,
    activeSchools,
    pendingSchools,
    suspendedSchools,
    totalStudents,
    totalTeachers,
    totalUsers,
    attendanceRecords,
    recentSchools,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.count({ where: { status: SchoolStatus.PENDING } }),
    prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
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
