import type { Metadata } from "next"

import { TeacherDashboardPage as TeacherDashboard } from "@/components/teacher/teacher-pages"

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  description: "RecordIT teacher dashboard home.",
}

export default function TeacherDashboardPage() {
  return <TeacherDashboard />
}
