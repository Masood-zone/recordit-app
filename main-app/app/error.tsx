"use client"

import { useEffect } from "react"

import { AppStateScreen } from "@/components/app-state/app-state-screen"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <AppStateScreen
      eyebrow="Error"
      title="Something went wrong"
      description="RecordIT could not complete this request. You can try again or return home."
      icon="error"
      detail={error.digest ? `Error digest: ${error.digest}` : undefined}
      action={{
        label: "Back to home",
        href: "/",
      }}
      secondaryAction={
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-2 border-[#c5c6d2] bg-transparent px-6 text-sm font-semibold text-[#00113a] hover:bg-[#d4e4f6]"
          onClick={() => unstable_retry()}
        >
          Try again
        </Button>
      }
    />
  )
}
