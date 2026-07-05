"use client"

import { useMutation } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import api from "@/lib/axios"
import type { ApiResponse } from "@/types"

export type SchoolOnboardingInput = {
  adminEmail: string
  adminFirstName: string
  adminLastName: string
  adminPhone: string
  city: string
  confirmPassword: string
  contactEmail: string
  contactName: string
  contactPhone: string
  contactRole: string
  password: string
  region: string
  schoolAddress: string
  schoolCode: string
  schoolEmail: string
  schoolName: string
  schoolPhone: string
}

export type SchoolOnboardingResult = {
  schoolId: string
  status: string
}

export async function submitSchoolOnboarding(input: SchoolOnboardingInput) {
  try {
    const res = await api.post<ApiResponse<SchoolOnboardingResult>>(
      "/onboarding/school",
      input
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "School onboarding failed")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "School onboarding failed")
  }
}

export function useSubmitSchoolOnboarding() {
  return useMutation({
    mutationFn: submitSchoolOnboarding,
  })
}
