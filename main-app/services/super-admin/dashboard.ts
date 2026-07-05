"use client"

import { useQuery } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type { ApiResponse, DateLike, SchoolStatus } from "@/types"

export type SuperAdminDashboardData = {
  metrics: {
    activeSchools: number
    attendanceRecords: number
    pendingSchools: number
    suspendedSchools: number
    totalSchools: number
    totalStudents: number
    totalTeachers: number
    totalUsers: number
  }
  recentSchools: Array<{
    city: string | null
    code: string
    createdAt: DateLike
    id: string
    name: string
    region: string | null
    status: SchoolStatus
  }>
}

export const superAdminDashboardKeys = {
  all: ["super-admin", "dashboard"] as const,
}

export async function getSuperAdminDashboard() {
  try {
    const res = await api.get<ApiResponse<SuperAdminDashboardData>>(
      "/super-admin/dashboard"
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Dashboard could not be loaded")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "Dashboard could not be loaded")
  }
}

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: superAdminDashboardKeys.all,
    queryFn: getSuperAdminDashboard,
  })
}
