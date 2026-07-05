import type { Metadata } from "next"

import { FingerprintEnrollmentWorkflow } from "@/components/biometric/attendance-workflows"

export const metadata: Metadata = {
  title: "Fingerprint Enrollment",
  description: "Enroll a student fingerprint for biometric attendance.",
}

export default function Page() {
  return <FingerprintEnrollmentWorkflow role="teacher" />
}
