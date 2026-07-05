import type { Metadata } from "next"

import { AdminSetupStep } from "@/components/onboarding/admin-setup-step"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"

export const metadata: Metadata = {
  title: "Admin Setup | RecordIT Onboarding",
}

export default function OnboardingStepTwoPage() {
  return (
    <OnboardingShell activeStep={2}>
      <AdminSetupStep />
    </OnboardingShell>
  )
}
