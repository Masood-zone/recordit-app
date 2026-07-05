import type { Metadata } from "next"

import { ParentCalendarView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Attendance Calendar",
  description: "RecordIT parent attendance calendar.",
}

export default function ParentAttendanceCalendarPage() {
  return <ParentCalendarView />
}
