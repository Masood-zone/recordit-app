import { requireDashboardRole } from "@/lib/dashboard-auth"
import { SchoolAdminShell } from "@/components/school-admin/school-admin-shell"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireDashboardRole(["ADMIN", "SCHOOL_ADMIN"])

  return (
    <SchoolAdminShell
      schoolName={user.schoolName || "RecordIT School"}
      userName={user.name}
    >
      {children}
    </SchoolAdminShell>
  )
}
