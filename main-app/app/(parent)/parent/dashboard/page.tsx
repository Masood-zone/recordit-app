import type { Metadata } from "next"

import { ParentDashboardView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Parent Dashboard",
  description: "RecordIT parent dashboard home.",
}

export default function ParentDashboardPage() {
  return <ParentDashboardView />
}
