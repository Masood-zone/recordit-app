"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"

export type TeacherEntity = Record<string, unknown>

export const teacherKeys = {
  all: ["teacher"] as const,
  attendanceSessions: ["teacher", "attendance-sessions"] as const,
  dashboard: ["teacher", "dashboard"] as const,
  reports: (params?: Record<string, string>) => ["teacher", "reports", params] as const,
  students: (params?: Record<string, string>) => ["teacher", "students", params] as const,
  student: (studentId?: string) => ["teacher", "students", studentId] as const,
  syncRoster: ["teacher", "fingerprints", "sync-roster"] as const,
}

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>, fallback: string) {
  try {
    const res = await promise
    if (!res.data.success) throw new Error(res.data.message || fallback)
    return res.data.data as T
  } catch (error) {
    throw toApiClientError(error, fallback)
  }
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: teacherKeys.dashboard,
    queryFn: () =>
      unwrap<TeacherEntity>(api.get("/teacher/dashboard"), "Teacher dashboard could not be loaded"),
  })
}

export function useTeacherStudents(params?: Record<string, string>, enabled = true) {
  return useQuery({
    enabled,
    queryKey: teacherKeys.students(params),
    queryFn: () =>
      unwrap<TeacherEntity>(
        api.get("/teacher/students", { params }),
        "Students could not be loaded"
      ),
  })
}

export function useTeacherStudent(studentId?: string) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: teacherKeys.student(studentId),
    queryFn: () =>
      unwrap<TeacherEntity>(
        api.get(`/teacher/students/${studentId}`),
        "Student could not be loaded"
      ),
  })
}

export function useTeacherAttendanceSessions(enabled = true) {
  return useQuery({
    enabled,
    queryKey: teacherKeys.attendanceSessions,
    queryFn: () =>
      unwrap<TeacherEntity>(
        api.get("/teacher/attendance-sessions"),
        "Attendance sessions could not be loaded"
      ),
  })
}

export function useTeacherReports(params?: Record<string, string>, enabled = true) {
  return useQuery({
    enabled,
    queryKey: teacherKeys.reports(params),
    queryFn: () =>
      unwrap<TeacherEntity>(api.get("/teacher/reports", { params }), "Reports could not be loaded"),
  })
}

export function useTeacherSyncRoster(enabled = true) {
  return useQuery({
    enabled,
    queryKey: teacherKeys.syncRoster,
    queryFn: () =>
      unwrap<TeacherEntity>(
        api.get("/teacher/fingerprints/sync-roster"),
        "Fingerprint roster could not be loaded"
      ),
  })
}

export function useTeacherPost(path: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TeacherEntity) =>
      unwrap<TeacherEntity>(api.post(path, input), "Save failed"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}

export function useTeacherGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TeacherEntity) =>
      unwrap<TeacherEntity>(api.post("/teacher/reports", input), "Report could not be generated"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}

export function useTeacherPatch(path: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TeacherEntity) =>
      unwrap<TeacherEntity>(api.patch(path, input), "Update failed"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.all }),
  })
}
