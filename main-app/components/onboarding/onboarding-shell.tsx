import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"

const steps = [
  { href: "/onboarding/step-1", label: "School Profile" },
  { href: "/onboarding/step-2", label: "Admin Account" },
  { href: "/onboarding/step-3", label: "Approval Status" },
]

export function OnboardingShell({
  activeStep,
  children,
}: {
  activeStep: number
  children: React.ReactNode
}) {
  return (
    <main className="min-h-svh bg-surface text-on-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <MaterialSymbol icon="fingerprint" />
            </span>
            <span className="text-xl font-bold text-primary">RecordIT</span>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-on-surface-variant sm:flex">
            <MaterialSymbol icon="verified" />
            Professional School Onboarding
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
        <nav className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => {
            const isActive = index + 1 === activeStep
            const isComplete = index + 1 < activeStep

            return (
              <div
                key={step.href}
                className={`rounded-lg border p-4 ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isComplete
                      ? "border-success/30 bg-success/10 text-on-surface"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                      isActive
                        ? "bg-white text-primary"
                        : isComplete
                          ? "bg-success text-success-foreground"
                          : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {isComplete ? <MaterialSymbol icon="check" /> : index + 1}
                  </span>
                  <span className="font-semibold">{step.label}</span>
                </div>
              </div>
            )
          })}
        </nav>

        {children}
      </div>
    </main>
  )
}
