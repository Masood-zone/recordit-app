import type { Metadata } from "next"

import { AppStateScreen } from "@/components/app-state/app-state-screen"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested RecordIT page could not be found.",
}

export default function NotFound() {
  return (
    <AppStateScreen
      eyebrow="404"
      title="Page not found"
      description="The page you are looking for does not exist or may have been moved."
      icon="travel_explore"
      action={{
        label: "Back to home",
        href: "/",
      }}
    />
  )
}
