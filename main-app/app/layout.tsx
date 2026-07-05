import { JetBrains_Mono, Manrope } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers/providers"
import { cn } from "@/lib/utils"

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
