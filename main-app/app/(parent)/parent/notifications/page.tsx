import type { Metadata } from "next"

import { ParentNotificationsView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Parent Notifications",
  description: "RecordIT parent notifications.",
}

export default function ParentNotificationsPage() {
  return <ParentNotificationsView />
}
