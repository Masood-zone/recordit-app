"use client"

import { useEffect } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center bg-[#f7f9ff] px-4 py-12 font-sans text-[#0d1d2a] sm:px-6">
          <section className="w-full max-w-[560px] rounded-xl border border-[#c5c6d2] bg-white p-8 text-center shadow-[0_4px_12px_rgb(0_35_102/0.05)] md:p-10">
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-xl bg-[#00113a] text-white shadow-lg shadow-[#00113a]/20">
              <MaterialSymbol icon="warning" className="text-4xl" />
            </div>
            <p className="mb-3 font-mono text-xs font-bold tracking-[0.12em] text-[#2552ca] uppercase">
              Critical Error
            </p>
            <h1 className="text-3xl leading-10 font-bold tracking-normal text-[#00113a]">
              RecordIT needs a refresh
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base leading-6 text-[#444650]">
              The app shell could not recover from an unexpected error.
            </p>
            {error.digest ? (
              <p className="mx-auto mt-4 max-w-md rounded-lg bg-[#ecf4ff] px-3 py-2 font-mono text-xs break-words text-[#444650]">
                Error digest: {error.digest}
              </p>
            ) : null}
            <div className="mt-8">
              <Button
                type="button"
                className="h-12 rounded-xl bg-[#2552ca] px-6 text-sm font-semibold text-white hover:bg-[#003baf]"
                onClick={() => unstable_retry()}
              >
                Try again
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
