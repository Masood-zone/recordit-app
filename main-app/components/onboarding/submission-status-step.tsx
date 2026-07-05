"use client"

import Link from "next/link"
import { useState } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"

function loadSubmission() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return JSON.parse(
      window.sessionStorage.getItem("recordit:onboarding:submitted") || "null"
    ) as { schoolName?: string; status?: string } | null
  } catch {
    return null
  }
}

export function SubmissionStatusStep() {
  const [submission] = useState(loadSubmission)
  const schoolName = submission?.schoolName || "Your school"

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <section className="recordit-card overflow-hidden">
        <div className="bg-primary p-8 text-primary-foreground">
          <div className="mb-5 grid size-16 place-items-center rounded-full bg-white text-primary">
            <MaterialSymbol icon="check_circle" />
          </div>
          <h1 className="text-3xl font-bold">Application Received</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">
            {schoolName} has been submitted successfully. The RecordIT team is
            now verifying the school profile and administrator account.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
          {[
            ["Application Submitted", "Complete", "check_circle"],
            ["Under Review", "In progress", "pending"],
            ["Approval Pending", "Next update", "verified"],
          ].map(([title, status, icon]) => (
            <div
              key={title}
              className="rounded-lg border border-outline-variant p-5"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-lg bg-surface-container text-primary">
                <MaterialSymbol icon={icon} />
              </div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{status}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="grid h-fit gap-4">
        <div className="recordit-card p-5">
          <h2 className="font-bold text-primary">What to Expect</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            RecordIT will send an email and SMS update to the contact
            representative. The school administrator can sign in to view
            approval status while full modules remain locked.
          </p>
        </div>
        <div className="recordit-card bg-surface-container-lowest p-5">
          <h2 className="font-bold text-primary">Need Help?</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Contact RecordIT support if your school details need correction
            before approval.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/login">Go to Approval Status</Link>
          </Button>
        </div>
      </aside>
    </div>
  )
}
