import { requireDashboardRole } from "@/lib/dashboard-auth"
import { ParentShell } from "@/components/parent/parent-shell"

export default async function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireDashboardRole(["PARENT", "PARENT_GUARDIAN"])

  return (
    <ParentShell
      schoolName={user.schoolName ?? "RecordIT School"}
      userName={user.name}
    >
      {children}
    </ParentShell>
  )
}
