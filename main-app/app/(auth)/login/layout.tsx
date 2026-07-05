import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description:
    "Login to the RecordIT biometric attendance system for secure school attendance operations.",
  alternates: {
    canonical: "/login",
  },
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
