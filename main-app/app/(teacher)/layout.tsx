import { requireDashboardRole } from "@/lib/dashboard-auth"
import { TeacherShell } from "@/components/teacher/teacher-shell"

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireDashboardRole(["TEACHER"])

  return (
    <TeacherShell
      schoolName={user.schoolName || "RecordIT School"}
      userName={user.name}
    >
      {children}
    </TeacherShell>
  )
}
