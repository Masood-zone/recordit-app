import type { Metadata } from "next"

import { SchoolAdminDashboardPage } from "@/components/school-admin/admin-pages"

export const metadata: Metadata = {
  title: "School Admin Dashboard",
  description: "RecordIT school admin dashboard.",
}

export default function Page() {
  return <SchoolAdminDashboardPage />
}
