import type { Metadata } from "next"

import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { SchoolProfileStep } from "@/components/onboarding/school-profile-step"

export const metadata: Metadata = {
  title: "School Profile | RecordIT Onboarding",
}

export default function OnboardingStepOnePage() {
  return (
    <OnboardingShell activeStep={1}>
      <SchoolProfileStep />
    </OnboardingShell>
  )
}
