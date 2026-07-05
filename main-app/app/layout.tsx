import { JetBrains_Mono, Manrope } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { Providers } from "@/components/providers/providers"
import { cn } from "@/lib/utils"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "RecordIT",
  title: {
    default: "RecordIT | Smart Biometric Attendance",
    template: "%s | RecordIT",
  },
  description:
    "RecordIT is a secure biometric school attendance platform for real-time verification, attendance reporting, and institutional monitoring.",
  keywords: [
    "RecordIT",
    "biometric attendance",
    "school attendance system",
    "student attendance",
    "fingerprint attendance",
  ],
  authors: [{ name: "RecordIT Biometric Systems" }],
  creator: "RecordIT Biometric Systems",
  publisher: "RecordIT Biometric Systems",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "/",
    siteName: "RecordIT",
    title: "RecordIT | Smart Biometric Attendance",
    description:
      "Secure biometric attendance for schools, administrators, teachers, parents, and students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecordIT | Smart Biometric Attendance",
    description:
      "Secure biometric attendance for schools, administrators, teachers, parents, and students.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
}

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        manrope.variable
      )}
    >
      <head>
        <meta charSet="utf-8" />
        {/* Prototype icon fonts */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body className={`${manrope.variable} ${fontMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
