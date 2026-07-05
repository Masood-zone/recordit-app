import type { Metadata } from "next"

import { ParentPreferencesView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Notification Preferences",
  description: "RecordIT parent notification preferences.",
}

export default function ParentNotificationPreferencesPage() {
  return <ParentPreferencesView />
}
