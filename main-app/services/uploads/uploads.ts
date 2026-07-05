import { useMutation } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"

export type UploadPurpose =
  | "organizationLogo"
  | "organizationBanner"
  | "userProfile"
  | "welfareProgramCover"

export interface UploadedCloudinaryFile {
  bytes?: number
  format?: string
  height?: number
  originalName?: string
  previewUrl: string
  public_id: string
  secure_url: string
  url: string
  width?: number
}

export interface UploadFileInput {
  file: File
  purpose: UploadPurpose
}

export async function uploadFileToCloudinary({
  file,
  purpose,
}: UploadFileInput): Promise<UploadedCloudinaryFile> {
  try {
    const body = new FormData()
    body.append("file", file)
    body.append("purpose", purpose)

    const res = await fetch("/api/uploads", {
      body,
      credentials: "include",
      method: "POST",
    })
    const payload = (await res.json()) as ApiResponse<UploadedCloudinaryFile>

    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || "File upload failed")
    }

    return payload.data
  } catch (error) {
    throw toApiClientError(error, "File upload failed")
  }
}

export function useUploadFile() {
  return useMutation({
    mutationFn: uploadFileToCloudinary,
  })
}
