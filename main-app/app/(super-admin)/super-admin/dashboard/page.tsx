import type { Metadata } from "next"

import { SuperAdminDashboard } from "@/components/super-admin/super-admin-dashboard"

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "RecordIT Super Admin dashboard home.",
}

export default function SuperAdminDashboardPage() {
  return <SuperAdminDashboard />
}
