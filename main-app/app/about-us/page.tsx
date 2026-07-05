import type { Metadata } from "next"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { PublicFooter } from "@/components/home/public-footer"
import { PublicNavbar } from "@/components/home/public-navbar"

const stakeholders = [
  {
    name: "KUFFOUR DOUGLAS NANA",
    id: "5221040870",
  },
  {
    name: "BAFFOUR KONADU DANIEL",
    id: "5221040853",
  },
  {
    name: "MUSAH DAUDA",
    id: "5221040855",
  },
]

export const metadata: Metadata = {
  title: "About Us | RecordIT",
  description:
    "Meet the RecordIT project stakeholders behind the biometric attendance system.",
  alternates: {
    canonical: "/about-us",
  },
}

export default function AboutUsPage() {
  return (
    <main className="min-h-svh bg-[#f7f9ff] text-[#0d1d2a]">
      <PublicNavbar />
      <section className="bg-[#f7f9ff] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#dce1ff] px-3 py-1 font-mono text-xs font-bold tracking-[0.05em] text-[#2552ca] uppercase">
              Project Stakeholders
            </span>
            <h1 className="text-3xl leading-10 font-bold tracking-normal text-[#00113a] md:text-[32px]">
              About RecordIT
            </h1>
            <p className="mt-4 text-lg leading-7 text-[#444650]">
              RecordIT is a biometric attendance system shaped around secure
              student verification, real-time school operations, and reliable
              reporting for educational institutions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {stakeholders.map((stakeholder) => (
              <article
                key={stakeholder.id}
                className="rounded-xl border border-[#c5c6d2] bg-white p-8 text-center shadow-[0_4px_12px_rgb(0_35_102/0.05)]"
              >
                <div className="mx-auto mb-6 grid size-28 place-items-center rounded-full border border-[#c5c6d2] bg-[#ecf4ff] text-[#2552ca]">
                  <MaterialSymbol icon="person" className="text-5xl" />
                </div>
                <h2 className="text-lg font-bold tracking-normal text-[#00113a]">
                  {stakeholder.name}
                </h2>
                <p className="mt-2 font-mono text-sm text-[#444650]">
                  {stakeholder.id}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  )
}
