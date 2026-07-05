import type { Metadata } from "next"

import { ContactSchoolView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "Contact School",
  description: "RecordIT parent school contact page.",
}

export default function ParentContactSchoolPage() {
  return <ContactSchoolView />
}
