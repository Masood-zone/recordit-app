"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"

export type ParentEntity = Record<string, unknown>

export const parentKeys = {
  all: ["parent"] as const,
  dashboard: ["parent", "dashboard"] as const,
  children: ["parent", "children"] as const,
  attendance: (studentId?: string, params?: Record<string, string>) =>
    ["parent", "children", studentId, "attendance", params] as const,
  calendar: (studentId?: string, params?: Record<string, string>) =>
    ["parent", "children", studentId, "calendar", params] as const,
  notifications: ["parent", "notifications"] as const,
  preferences: ["parent", "preferences"] as const,
  profile: ["parent", "profile"] as const,
  contactSchool: (studentId?: string) => ["parent", "contact-school", studentId] as const,
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

export function useParentDashboard() {
  return useQuery({
    queryKey: parentKeys.dashboard,
    queryFn: () =>
      unwrap<ParentEntity>(api.get("/parent/dashboard"), "Parent dashboard could not be loaded"),
  })
}

export function useParentChildren() {
  return useQuery({
    queryKey: parentKeys.children,
    queryFn: () => unwrap<ParentEntity>(api.get("/parent/children"), "Children could not be loaded"),
  })
}

export function useParentAttendance(studentId?: string, params?: Record<string, string>) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: parentKeys.attendance(studentId, params),
    queryFn: () =>
      unwrap<ParentEntity>(
        api.get(`/parent/children/${studentId}/attendance`, { params }),
        "Attendance records could not be loaded"
      ),
  })
}

export function useParentCalendar(studentId?: string, params?: Record<string, string>) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: parentKeys.calendar(studentId, params),
    queryFn: () =>
      unwrap<ParentEntity>(
        api.get(`/parent/children/${studentId}/calendar`, { params }),
        "Attendance calendar could not be loaded"
      ),
  })
}

export function useParentNotifications() {
  return useQuery({
    queryKey: parentKeys.notifications,
    queryFn: () =>
      unwrap<ParentEntity>(api.get("/parent/notifications"), "Notifications could not be loaded"),
  })
}

export function useParentPreferences() {
  return useQuery({
    queryKey: parentKeys.preferences,
    queryFn: () =>
      unwrap<ParentEntity>(api.get("/parent/preferences"), "Preferences could not be loaded"),
  })
}

export function useParentProfile() {
  return useQuery({
    queryKey: parentKeys.profile,
    queryFn: () => unwrap<ParentEntity>(api.get("/parent/profile"), "Profile could not be loaded"),
  })
}

export function useContactSchool(studentId?: string) {
  return useQuery({
    queryKey: parentKeys.contactSchool(studentId),
    queryFn: () =>
      unwrap<ParentEntity>(
        api.get("/parent/contact-school", { params: studentId ? { studentId } : undefined }),
        "School contacts could not be loaded"
      ),
  })
}

function useInvalidateParent(...queryKeys: ReadonlyArray<readonly unknown[]>) {
  const queryClient = useQueryClient()
  return () => {
    for (const queryKey of queryKeys.length ? queryKeys : [parentKeys.all]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }
}

export function useMarkParentNotificationRead() {
  const invalidate = useInvalidateParent(parentKeys.notifications, parentKeys.dashboard)
  return useMutation({
    mutationFn: (notificationId: string) =>
      unwrap<ParentEntity>(
        api.patch(`/parent/notifications/${notificationId}/read`, {}),
        "Notification could not be marked as read"
      ),
    onSuccess: invalidate,
  })
}

export function useMarkAllParentNotificationsRead() {
  const invalidate = useInvalidateParent(parentKeys.notifications, parentKeys.dashboard)
  return useMutation({
    mutationFn: () =>
      unwrap<ParentEntity>(
        api.patch("/parent/notifications/read-all", {}),
        "Notifications could not be marked as read"
      ),
    onSuccess: invalidate,
  })
}

export function useDeleteParentNotification() {
  const invalidate = useInvalidateParent(parentKeys.notifications, parentKeys.dashboard)
  return useMutation({
    mutationFn: (notificationId: string) =>
      unwrap<ParentEntity>(
        api.delete(`/parent/notifications/${notificationId}`),
        "Notification could not be deleted"
      ),
    onSuccess: invalidate,
  })
}

export function useSaveParentPreferences() {
  const invalidate = useInvalidateParent(parentKeys.preferences)
  return useMutation({
    mutationFn: (input: ParentEntity) =>
      unwrap<ParentEntity>(
        api.patch("/parent/preferences", input),
        "Preferences could not be saved"
      ),
    onSuccess: invalidate,
  })
}

export function useSaveParentProfile() {
  const invalidate = useInvalidateParent(parentKeys.profile, parentKeys.dashboard)
  return useMutation({
    mutationFn: (input: ParentEntity) =>
      unwrap<ParentEntity>(api.patch("/parent/profile", input), "Profile could not be saved"),
    onSuccess: invalidate,
  })
}
