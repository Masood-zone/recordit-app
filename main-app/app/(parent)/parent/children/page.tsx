import type { Metadata } from "next"

import { ParentChildrenView } from "@/components/parent/parent-pages"

export const metadata: Metadata = {
  title: "My Children",
  description: "RecordIT parent children overview.",
}

export default function ParentChildrenPage() {
  return <ParentChildrenView />
}
