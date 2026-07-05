import { useMutation } from "@tanstack/react-query"

import { toApiClientError } from "@/lib/api-client-error"
import type {
  ApiResponse,
  UploadedCloudinaryFile,
  UploadFileInput,
  UploadPurpose,
} from "@/types"

export type { UploadedCloudinaryFile, UploadFileInput, UploadPurpose }

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
      throw toApiClientError(
        { response: { data: payload, status: res.status } },
        payload.message || "File upload failed"
      )
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
