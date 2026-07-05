---
name: recordit-api-patterns
description: >
  Guide for calling and interacting with APIs in the RecordIT Biometric Attendance System using Tanstack Query and Axios.
  Use when: (1) adding new API service functions, (2) creating React Query hooks for data fetching or mutations,
  (3) understanding the Axios setup and error handling, (4) debugging API-related issues, or (5) reviewing
  how existing services are structured.
---

# API Layer Patterns — Tanstack Query + Axios

This skill documents how RecordIT handles client-side API communication.

## Architecture Overview

```
Component → React Query Hook → Service Function → Axios Instance → API Route
                                                           ↓
                                                    Response Interceptor
                                                    (401 → redirect /login)
```

**Key files:**
- `lib/axios.ts` — Singleton Axios instance with interceptors
- `lib/api-client-error.ts` — Typed error class and conversion helpers
- `types/index.ts` — `ApiResponse<T>` envelope type
- `services/` — Service functions + React Query hooks per domain
- `components/providers/providers.tsx` — `QueryClientProvider` wraps the app

---

## Axios Instance (`lib/axios.ts`)

A single pre-configured Axios instance is shared across the app:

```ts
import api from "@/lib/axios"
```

**Configuration:**
- `baseURL`: `process.env.NEXT_PUBLIC_API_URL` or `"/api"`
- `withCredentials: true` — sends cookies for session auth
- `Content-Type: application/json`

**Interceptors:**
- **Request**: Pass-through (extend here if you need auth headers or logging)
- **Response**: On `401 Unauthorized`, redirects to `/login` on the client

**Usage:** Always import `api` from `@/lib/axios`. Never create new Axios instances.

---

## Standard API Response Envelope (`types/index.ts`)

Every API endpoint returns this shape:

```ts
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>  // field-level validation errors
  code?: string
}
```

All service functions must check `res.data.success` before accessing `res.data.data`.

---

## Error Handling (`lib/api-client-error.ts`)

**`ApiClientError`** — Custom error class with:
- `message: string` — Human-readable error text
- `status?: number` — HTTP status code
- `code?: string` — Application-level error code
- `fieldErrors?: Record<string, string[]>` — Per-field validation errors

**`toApiClientError(error, fallbackMessage)`** — Converts unknown errors (Axios, native, or other) into `ApiClientError`. Use this in every service function's `catch` block.

**`getApiErrorLabel(error)`** — Extracts `{ message, code }` for UI display.

---

## Service File Structure

Each domain has a service file under `services/<domain>/`. Examples:
- `services/super-admin/schools.ts` — School management CRUD
- `services/super-admin/dashboard.ts` — Super admin dashboard data
- `services/admin/admin.ts` — School admin operations
- `services/onboarding/school-onboarding.ts` — Multi-step school registration
- `services/uploads/uploads.ts` — Cloudinary file uploads
- `services/email/email-service.ts` — Email sending (Nodemailer + React Email)
- `services/sms/sms-service.ts` — SMS sending
- `services/notifications/notifications.ts` — In-app notifications

Every service file exports:
1. **Async service functions** — perform the Axios call
2. **React Query hooks** — wrap service functions for components

### Service Function Pattern (Read)

```ts
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type { SuperAdminSchoolsData } from "@/types/super-admin-schools"

export async function getSuperAdminSchools() {
  try {
    const res = await api.get<ApiResponse<SuperAdminSchoolsData>>(
      "/super-admin/schools"
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Schools could not be loaded")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "Schools could not be loaded")
  }
}
```

### Service Function Pattern (Write — POST/PUT/PATCH)

```ts
export async function approveSchool(
  schoolId: string,
  input: ApproveSchoolInput
) {
  try {
    const res = await api.post<ApiResponse<SchoolDetailData>>(
      `/super-admin/schools/${schoolId}/approve`,
      input
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "School approval failed")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "School approval failed")
  }
}
```

### Service Function Pattern (Write — with path param)

```ts
export async function suspendSchool(
  schoolId: string,
  input: SuspendSchoolInput
) {
  try {
    const res = await api.patch<ApiResponse<unknown>>(
      `/super-admin/schools/${schoolId}/suspend`,
      input
    )

    if (!res.data.success) {
      throw new Error(res.data.message || "School suspension failed")
    }

    return res.data
  } catch (error) {
    throw toApiClientError(error, "School suspension failed")
  }
}
```

---

## React Query Hooks

### Query Hook (Read)

```ts
import { useQuery } from "@tanstack/react-query"

export function useSuperAdminSchools() {
  return useQuery({
    queryKey: ["super-admin", "schools"],
    queryFn: getSuperAdminSchools,
  })
}
```

**Query key convention:** `["<role>", "<resource>"]` — e.g. `["super-admin", "schools"]`, `["admin", "students"]`

For single-item queries, append the ID:

```ts
export function useSuperAdminSchool(schoolId: string) {
  return useQuery({
    queryKey: ["super-admin", "schools", schoolId],
    queryFn: () => getSuperAdminSchool(schoolId),
    enabled: Boolean(schoolId),
  })
}
```

### Mutation Hook (Write)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useApproveSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      input,
    }: {
      schoolId: string
      input: ApproveSchoolInput
    }) => approveSchool(schoolId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "schools"] })
      queryClient.invalidateQueries({
        queryKey: ["super-admin", "schools", variables.schoolId],
      })
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] })
    },
  })
}
```

**Immediate cache update (optimistic):**

```ts
export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSchoolSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(["admin", "settings"], settings)
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] })
    },
  })
}
```

---

## Consuming Hooks in Components

```tsx
"use client"

import { useSuperAdminSchools, useApproveSchool } from "@/services/super-admin/schools"

export function SchoolsManagement() {
  const { data, error, isLoading } = useSuperAdminSchools()
  const approveMutation = useApproveSchool()

  if (isLoading) return <div className="animate-pulse ..." />

  if (error) {
    return <div className="text-destructive">{error.message}</div>
  }

  const schools = data?.schools ?? []

  async function handleApprove(schoolId: string) {
    try {
      await approveMutation.mutateAsync({ schoolId, input: { approvedBy: "super-admin" } })
      toast.success("School approved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed.")
    }
  }

  return (
    <Button
      disabled={approveMutation.isPending}
      onClick={() => handleApprove(schoolId)}
    >
      {approveMutation.isPending ? "Approving..." : "Approve"}
    </Button>
  )
}
```

**Key points:**
- Use `mutateAsync` with `try/catch` for imperative control flow (e.g., closing modals on success)
- Check `mutation.isPending` to disable buttons and show loading text
- Display `data`, `error`, `isLoading` from query hooks

---

## File Uploads (Special Case)

File uploads use native `fetch` instead of Axios because Axios handles FormData differently:

```ts
export async function uploadFileToCloudinary({ file, purpose }: UploadFileInput) {
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
```

Cloudinary utilities are in `lib/cloudinary/`:
- `cloudinary-service.ts` — Server-side upload and management
- `cloudinary-utils.ts` — URL helpers, transformation utils

---

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/auth/[...all]` | better-auth catch-all (login, register, session) |
| `GET /api/super-admin/dashboard` | Super admin dashboard stats |
| `GET /api/super-admin/schools` | List all schools |
| `POST /api/super-admin/schools/[schoolId]/approve` | Approve school |
| `PATCH /api/super-admin/schools/[schoolId]/suspend` | Suspend school |
| `POST /api/super-admin/schools/[schoolId]/reactivate` | Reactivate school |
| `POST /api/onboarding/school` | School onboarding submission |
| `POST /api/uploads` | File upload to Cloudinary |
| `/api/admin/[...path]` | School admin catch-all proxy |

---

## Adding a New API Endpoint — Step by Step

1. **Define types** in `types/<domain>.ts`:
   ```ts
   export interface MyResourceData { /* ... */ }
   export interface CreateMyResourceInput { /* ... */ }
   ```

2. **Create service file** at `services/<domain>/<resource>.ts`:
   - Import `api` from `@/lib/axios`, `toApiClientError` from `@/lib/api-client-error`, `ApiResponse` from `@/types`
   - Write async function following the read/write pattern above
   - Write `useQuery` or `useMutation` hook
   - Export both the function and the hook

3. **Use in component**:
   - Import the hook from the service file
   - Destructure `data`, `error`, `isLoading` (queries) or `mutateAsync`, `isPending` (mutations)

---

## Common Mistakes to Avoid

- **Never skip `res.data.success` check** — the backend returns `{ success: false, message: "..." }` on business errors without throwing
- **Always use `toApiClientError` in catch blocks** — it normalizes Axios errors, native errors, and `ApiClientError` instances into a single type
- **Don't create new Axios instances** — use the shared `api` from `@/lib/axios`
- **Don't forget `enabled` on conditional queries** — e.g., `enabled: Boolean(id)` prevents fetching before the ID is available
- **Don't mutate cache directly without invalidation** — use `setQueryData` for immediate UI updates, then `invalidateQueries` to refetch fresh data
- **Query keys must be consistent** — if a mutation affects multiple resources, invalidate all relevant keys (e.g., `["super-admin", "schools"]` AND `["super-admin", "dashboard"]`)
