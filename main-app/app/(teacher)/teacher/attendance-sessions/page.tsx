import type { Metadata } from "next"

import { TeacherWorkInProgressPage } from "@/components/teacher/teacher-pages"

export const metadata: Metadata = {
  title: "Attendance Sessions",
  description: "Teacher attendance sessions work in progress.",
}

export default function Page() {
  return <TeacherWorkInProgressPage title="Attendance Sessions" variant="sessions" />
}
