import type { Metadata } from "next"

import { TeacherWorkInProgressPage } from "@/components/teacher/teacher-pages"

export const metadata: Metadata = {
  title: "Pending Attendance",
  description: "Teacher pending attendance work in progress.",
}

export default function Page() {
  return <TeacherWorkInProgressPage title="Pending Attendance" variant="pending" />
}
