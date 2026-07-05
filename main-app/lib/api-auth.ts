import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ApiResponse, UserRole } from "@/types"

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  })

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
