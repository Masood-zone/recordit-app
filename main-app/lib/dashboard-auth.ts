import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { type DashboardRole, getDashboardHref } from "@/lib/role-dashboard"

type DashboardUser = {
  id: string
  name: string
  email: string
  role: DashboardRole
  status: string
}

export async function requireDashboardRole(
  allowedRoles: DashboardRole[]
): Promise<DashboardUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  })

  if (!user || user.status !== "ACTIVE") {
    redirect("/login")
  }

  const role = user.role as DashboardRole

  if (!allowedRoles.includes(role)) {
    redirect(getDashboardHref(role))
  }

  return {
    ...user,
    role,
  }
}
