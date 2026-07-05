import type { Metadata } from "next"

import { DashboardHome } from "@/components/dashboard/dashboard-home"

export const metadata: Metadata = {
  title: "Parent Dashboard",
  description: "RecordIT parent dashboard home.",
}

export default function ParentDashboardPage() {
  return (
    <DashboardHome
      eyebrow="Parent"
      title="Parent Dashboard"
      description="A guardian home for checking attendance updates, student activity, alerts, and school communication."
      highlights={[
        {
          icon: "family_restroom",
          label: "Students",
          value: "Linked children",
        },
        { icon: "notifications", label: "Alerts", value: "Realtime updates" },
        { icon: "history", label: "Attendance", value: "Daily records" },
      ]}
    />
  )
}
