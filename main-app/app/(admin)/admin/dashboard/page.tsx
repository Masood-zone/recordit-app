import type { Metadata } from "next"

import { DashboardHome } from "@/components/dashboard/dashboard-home"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "RecordIT school admin dashboard home.",
}

export default function AdminDashboardPage() {
  return (
    <DashboardHome
      eyebrow="School Admin"
      title="Admin Dashboard"
      description="A school operations home for managing staff, classes, attendance sessions, biometric devices, and reports."
      highlights={[
        { icon: "groups", label: "People", value: "Staff and students" },
        { icon: "fingerprint", label: "Devices", value: "Biometric setup" },
        { icon: "analytics", label: "Reports", value: "Attendance insight" },
      ]}
    />
  )
}
