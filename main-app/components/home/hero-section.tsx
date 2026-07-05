import Image from "next/image"
import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { heroImage } from "./constants"

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-[#f7f9ff] py-16 md:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#446ce4]/20 bg-[#dce1ff] px-3 py-1">
              <span className="recordit-scan-pulse size-2 rounded-full bg-[#00daf3]" />
              <span className="font-mono text-xs font-bold tracking-[0.05em] text-[#2552ca] uppercase">
                New: Biometric AI 2.0 Available
              </span>
            </div>
            <h1 className="mb-4 text-3xl leading-10 font-bold tracking-normal text-[#00113a] md:text-[32px]">
              RecordIT
            </h1>
            <h2 className="mb-6 text-2xl leading-8 font-semibold tracking-normal text-[#2552ca]">
              Smart Attendance. Trusted Education.
            </h2>
            <p className="mb-10 max-w-xl text-lg leading-7 text-[#444650]">
              A high-security biometric school attendance system designed for
              administrators, teachers, and parents. Real-time tracking with
              institutional grade reliability.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="h-14 rounded-xl bg-[#2552ca] px-8 text-sm font-semibold text-white shadow-[0_8px_24px_rgb(0_35_102/0.12)] hover:bg-[#003baf]"
              >
                <Link href="/login">
                  Get Started
                  <MaterialSymbol icon="arrow_forward" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 rounded-xl border-2 border-[#c5c6d2] bg-transparent px-8 text-sm font-semibold text-[#00113a] hover:bg-[#d4e4f6]"
              >
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>

          <div className="relative md:col-span-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] border border-[#c5c6d2]/30 bg-[#d9eafc] shadow-2xl">
              <Image
                src={heroImage}
                alt="Student touching a biometric scanner"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute right-4 bottom-4 left-4 rounded-xl border border-white/40 bg-white/80 p-4 shadow-lg backdrop-blur-xl sm:right-6 sm:bottom-6 sm:left-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-[#2552ca]">
                    LIVE STATUS
                  </span>
                  <span className="rounded-full bg-[#009eb0] px-2 py-0.5 text-[10px] text-white">
                    ACTIVE
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#446ce4] text-white">
                    <MaterialSymbol icon="fingerprint" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#00113a]">
                      Biometric Syncing...
                    </div>
                    <div className="truncate font-mono text-xs text-[#444650]">
                      Scanning Institution: Central Academy
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
