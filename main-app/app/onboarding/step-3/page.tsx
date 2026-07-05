import type { Metadata } from "next"

import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { SubmissionStatusStep } from "@/components/onboarding/submission-status-step"

export const metadata: Metadata = {
  title: "Application Status | RecordIT Onboarding",
}

export default function OnboardingStepThreePage() {
  return (
    <OnboardingShell activeStep={3}>
      <SubmissionStatusStep />
    </OnboardingShell>
  )
}
