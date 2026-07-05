import { requireDashboardRole } from "@/lib/dashboard-auth"
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell"

export default async function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireDashboardRole(["SUPER_ADMIN"])

  return <SuperAdminShell userName={user.name}>{children}</SuperAdminShell>
}
