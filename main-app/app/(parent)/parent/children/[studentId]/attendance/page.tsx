import type { Metadata } from "next"

import { ParentAttendanceView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Attendance Details",
  description: "RecordIT parent attendance details.",
}

export default function ParentAttendancePage() {
  return <ParentAttendanceView />
}
