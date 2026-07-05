import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AppStateScreenProps = {
  eyebrow: string
  title: string
  description: string
  icon: string
  action?: {
    label: string
    href: string
  }
  secondaryAction?: React.ReactNode
  isLoading?: boolean
  detail?: string
}

export function AppStateScreen({
  eyebrow,
  title,
  description,
  icon,
  action,
  secondaryAction,
  isLoading,
  detail,
}: AppStateScreenProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f7f9ff] px-4 py-12 text-[#0d1d2a] sm:px-6">
      <section className="w-full max-w-[560px] rounded-xl border border-[#c5c6d2] bg-white p-8 text-center shadow-[0_4px_12px_rgb(0_35_102/0.05)] md:p-10">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-xl bg-[#00113a] text-white shadow-lg shadow-[#00113a]/20">
          <MaterialSymbol
            icon={icon}
            className={cn("text-4xl", isLoading && "animate-spin")}
          />
        </div>
        <p className="mb-3 font-mono text-xs font-bold tracking-[0.12em] text-[#2552ca] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-3xl leading-10 font-bold tracking-normal text-[#00113a]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-6 text-[#444650]">
          {description}
        </p>

        {detail ? (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-[#ecf4ff] px-3 py-2 font-mono text-xs break-words text-[#444650]">
            {detail}
          </p>
        ) : null}

        {(action || secondaryAction) && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {action ? (
              <Button
                asChild
                className="h-12 rounded-xl bg-[#2552ca] px-6 text-sm font-semibold text-white hover:bg-[#003baf]"
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : null}
            {secondaryAction}
          </div>
        )}
      </section>
    </main>
  )
}
