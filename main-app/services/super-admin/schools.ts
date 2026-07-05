"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type {
  ApiResponse,
  DateLike,
  SchoolStatus,
  UserRole,
  UserStatus,
} from "@/types"
import { superAdminDashboardKeys } from "@/services/super-admin/dashboard"

export type SuperAdminSchoolContact = {
  email: string
  name: string
  phone: string
  role: string
}

export type SuperAdminSchoolAdmin = {
  email: string
  id: string
  name: string
  phone: string | null
  status: UserStatus
}

export type SuperAdminSchoolListItem = {
  _count: {
    attendanceRecords: number
    classes: number
    students: number
    users: number
  }
  address: string | null
  admin: SuperAdminSchoolAdmin | null
  city: string | null
  code: string
  contact: SuperAdminSchoolContact
  country: string
  createdAt: DateLike
  email: string | null
  id: string
  name: string
  phone: string | null
  region: string | null
  status: SchoolStatus
  updatedAt: DateLike
}

export type SuperAdminSchoolDetail = SuperAdminSchoolListItem & {
  _count: SuperAdminSchoolListItem["_count"] & {
    biometricDevices: number
    reports: number
    teachers: number
  }
  attendanceSessions: Array<{
    _count: { records: number }
    class: { name: string } | null
    id: string
    sessionDate: DateLike
    status: string
    title: string
  }>
  classes: Array<{
    _count: { students: number }
    code: string | null
    createdAt: DateLike
    id: string
    level: string | null
    name: string
  }>
  reports: Array<{
    createdAt: DateLike
    endDate: DateLike
    id: string
    startDate: DateLike
    title: string
    type: string
  }>
  students: Array<{
    class: { name: string } | null
    firstName: string
    gender: string
    id: string
    isActive: boolean
    lastName: string
    studentNumber: string
  }>
  users: Array<{
    createdAt: DateLike
    email: string
    id: string
    name: string
    phone: string | null
    role: UserRole
    status: UserStatus
  }>
}

export type SuperAdminSchoolsParams = {
  page?: number
  pageSize?: number
  search?: string
  status?: SchoolStatus | "ALL"
}

export type SuperAdminSchoolsData = {
  page: number
  pageSize: number
  schools: SuperAdminSchoolListItem[]
  summary: Partial<Record<SchoolStatus, number>>
  total: number
  totalPages: number
}

export type UpdateSuperAdminSchoolInput = {
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

export const superAdminSchoolKeys = {
  all: ["super-admin", "schools"] as const,
  list: (params: SuperAdminSchoolsParams) =>
    ["super-admin", "schools", "list", params] as const,
  detail: (schoolId: string) => ["super-admin", "schools", schoolId] as const,
}

export async function getSuperAdminSchools(params: SuperAdminSchoolsParams) {
  try {
    const res = await api.get<ApiResponse<SuperAdminSchoolsData>>(
      "/super-admin/schools",
      { params }
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Schools could not be loaded")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "Schools could not be loaded")
  }
}

export async function getSuperAdminSchool(schoolId: string) {
  try {
    const res = await api.get<ApiResponse<{ school: SuperAdminSchoolDetail }>>(
      `/super-admin/schools/${schoolId}`
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "School could not be loaded")
    }

    return res.data.data.school
  } catch (error) {
    throw toApiClientError(error, "School could not be loaded")
  }
}

export async function updateSuperAdminSchool({
  input,
  schoolId,
}: {
  input: UpdateSuperAdminSchoolInput
  schoolId: string
}) {
  try {
    const res = await api.patch<
      ApiResponse<{ school: SuperAdminSchoolDetail }>
    >(`/super-admin/schools/${schoolId}`, input)

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "School update failed")
    }

    return res.data.data.school
  } catch (error) {
    throw toApiClientError(error, "School update failed")
  }
}

async function mutateSchoolStatus(schoolId: string, action: string) {
  try {
    const res = await api.patch<ApiResponse<{ school: { id: string } }>>(
      `/super-admin/schools/${schoolId}/${action}`
    )

    if (!res.data.success) {
      throw new Error(res.data.message || "School status update failed")
    }

    return res.data
  } catch (error) {
    throw toApiClientError(error, "School status update failed")
  }
}

export function useSuperAdminSchools(params: SuperAdminSchoolsParams) {
  return useQuery({
    queryKey: superAdminSchoolKeys.list(params),
    queryFn: () => getSuperAdminSchools(params),
  })
}

export function useSuperAdminSchool(schoolId: string) {
  return useQuery({
    queryKey: superAdminSchoolKeys.detail(schoolId),
    queryFn: () => getSuperAdminSchool(schoolId),
    enabled: Boolean(schoolId),
  })
}

function useInvalidateSchoolQueries() {
  const queryClient = useQueryClient()

  return async (schoolId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: superAdminSchoolKeys.all }),
      queryClient.invalidateQueries({
        queryKey: superAdminSchoolKeys.detail(schoolId),
      }),
      queryClient.invalidateQueries({ queryKey: superAdminDashboardKeys.all }),
    ])
  }
}

export function useUpdateSuperAdminSchool() {
  const invalidate = useInvalidateSchoolQueries()

  return useMutation({
    mutationFn: updateSuperAdminSchool,
    onSuccess: async (_school, variables) => {
      await invalidate(variables.schoolId)
    },
  })
}

export function useApproveSuperAdminSchool() {
  const invalidate = useInvalidateSchoolQueries()

  return useMutation({
    mutationFn: (schoolId: string) => mutateSchoolStatus(schoolId, "approve"),
    onSuccess: async (_data, schoolId) => {
      await invalidate(schoolId)
    },
  })
}

export function useSuspendSuperAdminSchool() {
  const invalidate = useInvalidateSchoolQueries()

  return useMutation({
    mutationFn: (schoolId: string) => mutateSchoolStatus(schoolId, "suspend"),
    onSuccess: async (_data, schoolId) => {
      await invalidate(schoolId)
    },
  })
}

export function useReactivateSuperAdminSchool() {
  const invalidate = useInvalidateSchoolQueries()

  return useMutation({
    mutationFn: (schoolId: string) =>
      mutateSchoolStatus(schoolId, "reactivate"),
    onSuccess: async (_data, schoolId) => {
      await invalidate(schoolId)
    },
  })
}
