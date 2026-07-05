---
name: amanah-api-patterns
description: >
  Guide for calling and interacting with APIs in the Amanah Welfare System using Tanstack Query and Axios.
  Use when: (1) adding new API service functions, (2) creating React Query hooks for data fetching or mutations,
  (3) understanding the Axios setup and error handling, (4) debugging API-related issues, or (5) reviewing
  how existing services are structured.
---

# API Layer Patterns — Tanstack Query + Axios

This skill documents how the Amanah Welfare System handles client-side API communication.

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

Each domain has a service file under `services/<role>/`. Example: `services/super-admin/organizations.ts`.

Every service file exports:
1. **Async service functions** — perform the Axios call
2. **React Query hooks** — wrap service functions for components

### Service Function Pattern (Read)

```ts
import api from "@/lib/axios"
import { toApiClientError } from "@/lib/api-client-error"
import type { ApiResponse } from "@/types"
import type { SuperAdminOrganizationsData } from "@/types/super-admin-organizations"

export async function getSuperAdminOrganizations() {
  try {
    const res = await api.get<ApiResponse<SuperAdminOrganizationsData>>(
      "/super-admin/organizations"
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Organizations could not be loaded")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "Organizations could not be loaded")
  }
}
```

### Service Function Pattern (Write — POST/PUT/PATCH)

```ts
export async function registerOrganization(input: RegisterOrganizationInput) {
  try {
    const res = await api.post<ApiResponse<SuperAdminOrganizationDetailData>>(
      "/super-admin/organizations",
      input
    )

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Organization registration failed")
    }

    return res.data.data
  } catch (error) {
    throw toApiClientError(error, "Organization registration failed")
  }
}
```

### Service Function Pattern (Write — with path param)

```ts
export async function suspendOrganization(
  organizationId: string,
  input: SuspendOrganizationInput
) {
  try {
    const res = await api.patch<ApiResponse<unknown>>(
      `/super-admin/organizations/${organizationId}/suspend`,
      input
    )

    if (!res.data.success) {
      throw new Error(res.data.message || "Organization suspension failed")
    }

    return res.data
  } catch (error) {
    throw toApiClientError(error, "Organization suspension failed")
  }
}
```

---

## React Query Hooks

### Query Hook (Read)

```ts
import { useQuery } from "@tanstack/react-query"

export function useSuperAdminOrganizations() {
  return useQuery({
    queryKey: ["super-admin", "organizations"],
    queryFn: getSuperAdminOrganizations,
  })
}
```

**Query key convention:** `["<role>", "<resource>"]` — e.g., `["organizer", "members"]`, `["super-admin", "dashboard"]`

For single-item queries, append the ID:

```ts
export function useSuperAdminOrganization(organizationId: string) {
  return useQuery({
    queryKey: ["super-admin", "organizations", organizationId],
    queryFn: () => getSuperAdminOrganization(organizationId),
    enabled: Boolean(organizationId),  // don't fetch until ID is available
  })
}
```

### Mutation Hook (Write)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useRegisterOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "organizations"] })
      queryClient.invalidateQueries({ queryKey: ["super-admin", "applications"] })
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] })
    },
  })
}
```

**Mutation with parameters:**

```ts
export function useSuspendOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      input,
    }: {
      organizationId: string
      input: SuspendOrganizationInput
    }) => suspendOrganization(organizationId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "organizations"] })
      queryClient.invalidateQueries({
        queryKey: ["super-admin", "organizations", variables.organizationId],
      })
    },
  })
}
```

**Immediate cache update (optimistic):**

```ts
export function useUpdateSuperAdminSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSuperAdminSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(["super-admin", "settings"], settings)
      queryClient.invalidateQueries({ queryKey: ["super-admin", "settings"] })
    },
  })
}
```

---

## Consuming Hooks in Components

```tsx
"use client"

import { useSuperAdminOrganizations, useRegisterOrganization } from "@/services/super-admin/organizations"

export function OrganizationsContent() {
  const { data, error, isLoading } = useSuperAdminOrganizations()
  const registerMutation = useRegisterOrganization()

  // Loading state
  if (isLoading) return <div className="animate-pulse ..." />

  // Error state
  if (error) {
    return <div className="text-destructive">{error.message}</div>
  }

  // Use data
  const organizations = data?.organizations ?? []

  // Trigger mutation
  async function handleSubmit() {
    try {
      await registerMutation.mutateAsync(formData)
      toast.success("Organization registered.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed.")
    }
  }

  return (
    <Button disabled={registerMutation.isPending} onClick={handleSubmit}>
      {registerMutation.isPending ? "Registering..." : "Register"}
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

---

## Adding a New API Endpoint — Step by Step

1. **Define types** in `types/<domain>.ts`:
   ```ts
   export interface MyResourceData { /* ... */ }
   export interface CreateMyResourceInput { /* ... */ }
   ```

2. **Create service file** at `services/<role>/<domain>.ts`:
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
- **Query keys must be consistent** — if a mutation affects multiple resources, invalidate all relevant keys (e.g., `["super-admin", "organizations"]` AND `["super-admin", "dashboard"]`)
