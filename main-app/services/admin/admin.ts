"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"

export type AdminEntity = Record<string, unknown>

export const adminKeys = {
  all: ["admin"] as const,
  academicSetup: ["admin", "academic-setup"] as const,
  attendanceSetup: ["admin", "attendance-setup"] as const,
  classes: ["admin", "classes"] as const,
  dashboard: ["admin", "dashboard"] as const,
  options: ["admin", "options"] as const,
  parents: ["admin", "parents"] as const,
  reports: (params?: Record<string, string>) => ["admin", "reports", params] as const,
  settings: ["admin", "settings"] as const,
  students: ["admin", "students"] as const,
  teachers: ["admin", "teachers"] as const,
  users: ["admin", "users"] as const,
  attendanceSessions: ["admin", "attendance-sessions"] as const,
  syncRoster: ["admin", "fingerprints", "sync-roster"] as const,
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

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/dashboard"), "Dashboard could not be loaded"),
  })
}

export function useAdminOptions(enabled = true) {
  return useQuery({
    enabled,
    queryKey: adminKeys.options,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/options"), "Options could not be loaded"),
  })
}

export function useAcademicSetup() {
  return useQuery({
    queryKey: adminKeys.academicSetup,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/academic-setup"), "Academic setup could not be loaded"),
  })
}

export function useAdminClasses() {
  return useQuery({
    queryKey: adminKeys.classes,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/classes"), "Classes could not be loaded"),
  })
}

export function useAdminStudents(params?: Record<string, string>, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["admin", "students", params],
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/students", { params }), "Students could not be loaded"),
  })
}

export function useAdminAttendanceSessions(enabled = true) {
  return useQuery({
    enabled,
    queryKey: adminKeys.attendanceSessions,
    queryFn: () =>
      unwrap<AdminEntity>(
        api.get("/admin/attendance-sessions"),
        "Attendance sessions could not be loaded"
      ),
  })
}

export function useAdminAttendanceSetup(enabled = true) {
  return useQuery({
    enabled,
    queryKey: adminKeys.attendanceSetup,
    queryFn: () =>
      unwrap<AdminEntity>(
        api.get("/admin/attendance-setup"),
        "Attendance workspace could not be loaded"
      ),
  })
}

export function useAdminReports(params?: Record<string, string>, enabled = true) {
  return useQuery({
    enabled,
    queryKey: adminKeys.reports(params),
    queryFn: () =>
      unwrap<AdminEntity>(api.get("/admin/reports", { params }), "Reports could not be loaded"),
  })
}

export function useAdminSyncRoster(enabled = true) {
  return useQuery({
    enabled,
    queryKey: adminKeys.syncRoster,
    queryFn: () =>
      unwrap<AdminEntity>(
        api.get("/admin/fingerprints/sync-roster"),
        "Fingerprint roster could not be loaded"
      ),
  })
}

export function useAdminStudent(studentId?: string) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: ["admin", "students", studentId],
    queryFn: () => unwrap<AdminEntity>(api.get(`/admin/students/${studentId}`), "Student could not be loaded"),
  })
}

export function useAdminTeachers() {
  return useQuery({
    queryKey: adminKeys.teachers,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/teachers"), "Teachers could not be loaded"),
  })
}

export function useAdminTeacher(teacherId?: string) {
  return useQuery({
    enabled: Boolean(teacherId),
    queryKey: ["admin", "teachers", teacherId],
    queryFn: () => unwrap<AdminEntity>(api.get(`/admin/teachers/${teacherId}`), "Teacher could not be loaded"),
  })
}

export function useAdminParents() {
  return useQuery({
    queryKey: adminKeys.parents,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/parents"), "Parents could not be loaded"),
  })
}

export function useAdminParent(guardianId?: string) {
  return useQuery({
    enabled: Boolean(guardianId),
    queryKey: ["admin", "parents", guardianId],
    queryFn: () => unwrap<AdminEntity>(api.get(`/admin/parents/${guardianId}`), "Parent could not be loaded"),
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/users"), "Users could not be loaded"),
  })
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: () => unwrap<AdminEntity>(api.get("/admin/settings"), "Settings could not be loaded"),
  })
}

function useInvalidateAdmin(path?: string) {
  const queryClient = useQueryClient()
  return () => {
    if (!path) {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      return
    }

    if (path.includes("/attendance-sessions")) return

    const keys: ReadonlyArray<readonly unknown[]> = path.includes("/fingerprints")
      ? [adminKeys.students, adminKeys.syncRoster]
      : path.includes("/students")
        ? [adminKeys.students, adminKeys.options, adminKeys.attendanceSetup, adminKeys.dashboard]
        : path.includes("/classes")
          ? [adminKeys.classes, adminKeys.options, adminKeys.attendanceSetup, adminKeys.academicSetup]
          : path.includes("/teachers")
            ? [adminKeys.teachers, adminKeys.users, adminKeys.options, adminKeys.dashboard]
            : path.includes("/parents")
              ? [adminKeys.parents, adminKeys.users, adminKeys.options, adminKeys.dashboard]
              : path.includes("/reports")
                ? [["admin", "reports"], adminKeys.dashboard]
                : path.includes("/settings")
                  ? [adminKeys.settings]
                  : [adminKeys.all]

    for (const queryKey of keys) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }
}

export function useAdminPost(path: string) {
  const invalidate = useInvalidateAdmin(path)
  return useMutation({
    mutationFn: (input: AdminEntity) => unwrap<AdminEntity>(api.post(path, input), "Save failed"),
    onSuccess: invalidate,
  })
}

export function useAdminGenerateReport() {
  const invalidate = useInvalidateAdmin("/admin/reports")
  return useMutation({
    mutationFn: (input: AdminEntity) =>
      unwrap<AdminEntity>(api.post("/admin/reports", input), "Report could not be generated"),
    onSuccess: invalidate,
  })
}

export function useAdminPatch(path: string) {
  const invalidate = useInvalidateAdmin(path)
  return useMutation({
    mutationFn: (input: AdminEntity) => unwrap<AdminEntity>(api.patch(path, input), "Update failed"),
    onSuccess: invalidate,
  })
}

export function useAdminDelete(path: string) {
  const invalidate = useInvalidateAdmin(path)
  return useMutation({
    mutationFn: () => unwrap<AdminEntity>(api.delete(path), "Delete failed"),
    onSuccess: invalidate,
  })
}

export function useBulkImportStudents() {
  const invalidate = useInvalidateAdmin("/admin/students")
  return useMutation({
    mutationFn: async ({ commit, file }: { commit: boolean; file: File }) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("commit", String(commit))
      const res = await fetch("/api/admin/students/bulk-import", {
        body: formData,
        credentials: "include",
        method: "POST",
      })
      const payload = (await res.json()) as ApiResponse<AdminEntity>
      if (!res.ok || !payload.success) throw new Error(payload.message || "Import failed")
      return payload.data as AdminEntity
    },
    onSuccess: invalidate,
  })
}
