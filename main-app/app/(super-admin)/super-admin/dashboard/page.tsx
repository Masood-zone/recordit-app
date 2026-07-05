import type { Metadata } from "next"

import { DashboardHome } from "@/components/dashboard/dashboard-home"

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "RecordIT Super Admin dashboard home.",
}

export default function SuperAdminDashboardPage() {
  return (
    <DashboardHome
      eyebrow="Super Admin"
      title="Super Admin Dashboard"
      description="A system-level home for overseeing schools, onboarding, platform health, and institution-wide configuration."
      highlights={[
        { icon: "domain", label: "Schools", value: "Manage institutions" },
        { icon: "verified_user", label: "Access", value: "Platform control" },
        { icon: "monitoring", label: "Health", value: "System overview" },
      ]}
    />
  )
}
