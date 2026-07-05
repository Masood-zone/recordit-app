import { requireDashboardRole } from "@/lib/dashboard-auth"

export default async function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireDashboardRole(["PARENT", "PARENT_GUARDIAN"])

  return children
}
