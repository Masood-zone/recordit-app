import type { Metadata } from "next"

import { ParentProfileView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Parent Profile",
  description: "RecordIT parent profile.",
}

export default function ParentProfilePage() {
  return <ParentProfileView />
}
