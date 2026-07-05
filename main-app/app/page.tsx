import type { Metadata } from "next"

import { HomePage } from "@/components/home/home-page"

export const metadata: Metadata = {
  title: "RecordIT | Smart Biometric Attendance",
  description:
    "RecordIT is a high-security biometric school attendance system for administrators, teachers, parents, and students.",
  alternates: {
    canonical: "/",
  },
}

export default function LandingPage() {
  return <HomePage />
}
