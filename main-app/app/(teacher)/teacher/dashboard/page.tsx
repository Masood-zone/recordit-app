import type { Metadata } from "next"

import { DashboardHome } from "@/components/dashboard/dashboard-home"

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  description: "RecordIT teacher dashboard home.",
}

export default function TeacherDashboardPage() {
  return (
    <DashboardHome
      eyebrow="Teacher"
      title="Teacher Dashboard"
      description="A classroom attendance home for opening sessions, monitoring scans, reviewing students, and resolving exceptions."
      highlights={[
        {
          icon: "event_available",
          label: "Sessions",
          value: "Open attendance",
        },
        { icon: "school", label: "Classes", value: "Assigned groups" },
        { icon: "rule", label: "Exceptions", value: "Review issues" },
      ]}
    />
  )
}
