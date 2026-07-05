import type { Metadata } from "next"
import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { requirePendingSchoolAdmin } from "@/lib/dashboard-auth"

export const metadata: Metadata = {
  title: "Approval Status | RecordIT",
}

export default async function ApprovalStatusPage() {
  const user = await requirePendingSchoolAdmin()
  const school = user.school

  return (
    <main className="min-h-svh bg-surface px-4 py-8 text-on-surface sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="recordit-card bg-surface-container-lowest p-6 md:p-8">
          <p className="mb-3 text-sm font-bold tracking-[0.12em] text-primary uppercase">
            RecordIT onboarding
          </p>
          <h1 className="text-3xl font-bold text-primary">Approval Pending</h1>
          <p className="mt-3 max-w-3xl text-on-surface-variant">
            Your school profile is currently under review. Once approved, you
            will be able to add users, register students, enroll fingerprints,
            and start attendance sessions.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-[1fr_340px]">
          <div className="recordit-card p-6">
            <h2 className="text-xl font-bold text-primary">School Profile</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["School Name", school?.name ?? "Pending school"],
                ["School Email", school?.email ?? "Not provided"],
                ["Phone", school?.phone ?? "Not provided"],
                ["Region", school?.region ?? "Not provided"],
                ["Application Status", school?.status ?? "PENDING"],
                ["Submitted By", user.name],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-surface-container-low p-4"
                >
                  <dt className="text-xs font-bold tracking-[0.08em] text-on-surface-variant uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="recordit-card p-6">
            <h2 className="text-xl font-bold text-primary">
              Approval Timeline
            </h2>
            <div className="mt-5 grid gap-4">
              {[
                ["Application Submitted", true],
                ["Under Review", true],
                ["Approval Pending", true],
                ["Approved", false],
              ].map(([label, complete]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span
                    className={`grid size-9 place-items-center rounded-full ${
                      complete
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <MaterialSymbol icon={complete ? "check" : "lock"} />
                  </span>
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </aside>
        </section>

        <section className="recordit-card p-6">
          <h2 className="text-xl font-bold text-primary">
            Locked Until Approval
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Users",
              "Students",
              "Fingerprint Enrollment",
              "Attendance",
              "Reports",
              "Settings",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-on-surface-variant"
              >
                <MaterialSymbol icon="lock" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
