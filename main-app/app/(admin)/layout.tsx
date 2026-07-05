import { requireDashboardRole } from "@/lib/dashboard-auth"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireDashboardRole(["ADMIN", "SCHOOL_ADMIN"])

  return children
}
