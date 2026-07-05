import type { Metadata } from "next"

import { AttendanceSessionsWorkflow } from "@/components/biometric/attendance-workflows"

export const metadata: Metadata = {
  title: "Attendance Sessions",
  description: "Teacher attendance sessions work in progress.",
}

export default function Page() {
  return <AttendanceSessionsWorkflow role="teacher" />
}
