import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse, UserRole } from "@/types"

const API_ACCESS_CACHE_TTL_MS = 15 * 1000

async function findApiUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      image: true,
      role: true,
      status: true,
      schoolId: true,
      school: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          region: true,
          status: true,
        },
      },
      teacherProfile: {
        select: {
          id: true,
          department: true,
          staffNumber: true,
          title: true,
        },
      },
      guardianProfile: {
        select: {
          id: true,
          address: true,
          occupation: true,
          relationship: true,
          schoolId: true,
        },
      },
    },
  })
}

type ApiUser = Awaited<ReturnType<typeof findApiUser>>
type ApiAccessCacheEntry = { expiresAt: number; value: Promise<ApiUser> }

const globalForApiAuth = globalThis as typeof globalThis & {
  recorditApiAccessCache?: Map<string, ApiAccessCacheEntry>
}
const apiAccessCache =
  globalForApiAuth.recorditApiAccessCache ?? new Map<string, ApiAccessCacheEntry>()

if (process.env.NODE_ENV !== "production") {
  globalForApiAuth.recorditApiAccessCache = apiAccessCache
}

async function getApiUser(userId: string) {
  const cached = apiAccessCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const value = findApiUser(userId).catch((error) => {
    apiAccessCache.delete(userId)
    throw error
  })
  apiAccessCache.set(userId, {
    expiresAt: Date.now() + API_ACCESS_CACHE_TTL_MS,
    value,
  })
  return value
}

export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message,
      code: code ?? (status === 404 ? "NOT_FOUND" : "SERVER_ERROR"),
    },
    { status }
  )
}

export async function requireApiRole(request: Request, roles: UserRole[]) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user?.id) {
    return {
      response: apiError("Authentication required", 401, "UNAUTHORIZED"),
      user: null,
    }
  }

  const user = await getApiUser(session.user.id)

  if (!user || user.status !== "ACTIVE") {
    return {
      response: apiError("Authentication required", 401, "UNAUTHORIZED"),
      user: null,
    }
  }

  if (!roles.includes(user.role as UserRole)) {
    return {
      response: apiError(
        "You do not have access to this resource",
        403,
        "FORBIDDEN"
      ),
      user: null,
    }
  }

  return { response: null, user }
}

export async function requireSchoolAdminApi(request: Request) {
  const auth = await requireApiRole(request, ["SCHOOL_ADMIN"])

  if (auth.response) {
    return { response: auth.response, user: null, schoolId: null }
  }

  const user = auth.user!

  if (!user?.schoolId || user.school?.status !== "ACTIVE") {
    return {
      response: apiError("Active school access is required", 403, "FORBIDDEN"),
      user: null,
      schoolId: null,
    }
  }

  return {
    response: null,
    user,
    schoolId: user.schoolId,
    school: user.school,
  }
}

export async function requireTeacherApi(request: Request) {
  const auth = await requireApiRole(request, ["TEACHER"])

  if (auth.response) {
    return { response: auth.response, user: null, schoolId: null, teacher: null }
  }

  const user = auth.user!

  if (!user?.schoolId || user.school?.status !== "ACTIVE" || !user.teacherProfile) {
    return {
      response: apiError("Active teacher access is required", 403, "FORBIDDEN"),
      user: null,
      schoolId: null,
      teacher: null,
    }
  }

  return {
    response: null,
    user,
    schoolId: user.schoolId,
    school: user.school,
    teacher: user.teacherProfile,
  }
}

export async function requireParentGuardianApi(request: Request) {
  const auth = await requireApiRole(request, ["PARENT_GUARDIAN"])

  if (auth.response) {
    return {
      response: auth.response,
      user: null,
      schoolId: null,
      guardian: null,
      school: null,
    }
  }

  const user = auth.user!

  if (
    !user?.guardianProfile ||
    !user.schoolId ||
    user.school?.status !== "ACTIVE"
  ) {
    return {
      response: apiError("Active parent access is required", 403, "FORBIDDEN"),
      user: null,
      schoolId: null,
      guardian: null,
      school: null,
    }
  }

  return {
    response: null,
    user,
    schoolId: user.schoolId,
    guardian: user.guardianProfile,
    school: user.school,
  }
}
