import { requireDashboardRole } from "@/lib/dashboard-auth"

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireDashboardRole(["TEACHER"])

  return children
}
