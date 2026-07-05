import { requireDashboardRole } from "@/lib/dashboard-auth"

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireDashboardRole(["SUPER_ADMIN"])

  return children
}
