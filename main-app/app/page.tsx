import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7Xvg7F7boaT6lNlY8N8ep4-M7e49opxUTx4bf5zKecHOfxPxF2zRtHnFJkmbkZY1V1vqgN4HUiykCqYhC06uak-iaORT02JMOx3NC8HLk-FNT8hNGsYYtijkqw423CjceaAVvZwFN3V5XTv0daVQ-qDdNzqEFHN_OOHQu19aEmKM4zLVoNVOuZ3J6q6Kuha2PbRtkT3H4o71kYcecujquckxJGHRwI-zeq18Y6C1tgE5MJf6-0zfmBw"

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDVbRQxOIVDh7-JMA5F34TlOIa2uPip3ZKgXs7CFc93BmVO5lE9OWVsJuzCT3vvex38zJ9OqF5iTppvym6WvXPpYliL0Cx6IfJN4cR1ffLy1lnRGc1bWsk1CoNzL9jxFTyaYgloyqGLqjC7HjnCoM6LQeXyZKAiTey727d_5wGiUfcjbGSaWn9UVkF9c7eJt2rKgjw-i-QijF7aZ-xAj-e1pZeAio8DRbpySk18XGvtQzaOpDYPcuZ8CA"

const navItems = ["Home", "Solutions", "Pricing", "About"]

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-[#f7f9ff] text-[#0d1d2a]">
      <header className="sticky top-0 z-50 h-16 w-full border-b border-[#c5c6d2] bg-[#f7f9ff] shadow-sm">
        <nav className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-bold tracking-normal text-[#00113a]"
            >
              RecordIT
            </Link>
            <div className="hidden gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href={item === "Home" ? "/" : "#features"}
                  className={
                    item === "Home"
                      ? "border-b-2 border-[#2552ca] text-base font-semibold text-[#2552ca]"
                      : "text-base text-[#444650] transition-colors hover:text-[#2552ca]"
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden h-9 items-center gap-2 rounded-full bg-[#e2efff] px-4 md:flex">
              <MaterialSymbol
                icon="search"
                className="text-base text-[#757682]"
              />
              <input
                aria-label="Search resources"
                className="w-48 border-none bg-transparent font-mono text-xs text-[#0d1d2a] outline-none placeholder:text-[#757682]"
                placeholder="Search resources..."
              />
            </div>
            <button
              aria-label="Notifications"
              className="grid size-10 place-items-center text-[#2552ca] transition-transform active:scale-95"
            >
              <MaterialSymbol icon="notifications" />
            </button>
            <button
              aria-label="Help"
              className="hidden size-10 place-items-center text-[#2552ca] transition-transform active:scale-95 sm:grid"
            >
              <MaterialSymbol icon="help" />
            </button>
            <div className="size-8 overflow-hidden rounded-full bg-[#d4e4f6]">
              <img
                src={avatarImage}
                alt="School administrator"
                className="size-full object-cover"
              />
            </div>
          </div>
        </nav>
      </header>

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
                <img
                  src={heroImage}
                  alt="Student touching a biometric scanner"
                  className="size-full object-cover"
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

      <section id="features" className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h3 className="mb-4 text-2xl leading-8 font-semibold tracking-normal text-[#00113a]">
              The Future of Institutional Security
            </h3>
            <div className="mx-auto h-1.5 w-20 rounded-full bg-[#2552ca]" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-[#c5c6d2] bg-[#ecf4ff] p-8 transition-shadow duration-300 hover:shadow-lg md:col-span-2">
              <div className="relative z-10">
                <div className="mb-6 grid size-14 place-items-center rounded-xl bg-[#446ce4] text-white shadow-md">
                  <MaterialSymbol icon="fingerprint" className="text-3xl" />
                </div>
                <h4 className="mb-3 text-2xl leading-8 font-semibold tracking-normal text-[#00113a]">
                  Biometric Attendance
                </h4>
                <p className="mb-6 max-w-md text-base leading-6 text-[#444650]">
                  Eliminate proxy attendance with military-grade biometric
                  scanning. Fast, accurate, and impossible to fake.
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="rounded-full bg-[#002d33]/10 px-3 py-1 font-mono text-xs text-[#009eb0]">
                    99.9% Accuracy
                  </span>
                  <span className="rounded-full bg-[#dce1ff] px-3 py-1 font-mono text-xs text-[#003baf]">
                    0.2s Scan Speed
                  </span>
                </div>
              </div>
              <MaterialSymbol
                icon="fingerprint"
                className="absolute right-0 bottom-0 text-[200px] leading-none text-[#00113a]/10 transition-opacity group-hover:text-[#00113a]/20"
              />
            </div>

            <div className="flex flex-col justify-between rounded-xl bg-[#00113a] p-8 text-white shadow-xl transition-transform hover:-translate-y-1">
              <div>
                <div className="mb-6 grid size-12 place-items-center rounded-xl bg-[#758dd5] text-[#002366]">
                  <MaterialSymbol icon="school" filled />
                </div>
                <h4 className="mb-3 text-2xl leading-8 font-semibold tracking-normal">
                  Multi-School Management
                </h4>
                <p className="text-base leading-6 text-[#dbe1ff] opacity-90">
                  Unified dashboard for educational groups and districts to
                  oversee multiple institutions seamlessly.
                </p>
              </div>
              <Link
                href="#"
                className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#dce1ff] hover:underline"
              >
                Configure District
                <MaterialSymbol icon="open_in_new" />
              </Link>
            </div>

            <div className="group flex flex-col rounded-xl border border-[#c5c6d2] bg-[#f7f9ff] p-8 transition-shadow hover:shadow-lg">
              <div className="mb-6 grid size-12 place-items-center rounded-xl bg-[#9cf0ff] text-[#001f24] shadow-sm">
                <MaterialSymbol icon="family_restroom" />
              </div>
              <h4 className="mb-3 text-2xl leading-8 font-semibold tracking-normal text-[#00113a]">
                Parent Monitoring
              </h4>
              <p className="mb-6 text-base leading-6 text-[#444650]">
                Real-time SMS and App notifications for parents the moment a
                student scans in or out.
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-[#c5c6d2] pt-6">
                <span className="font-mono text-xs text-[#757682]">
                  Push Notifications
                </span>
                <MaterialSymbol
                  icon="send"
                  className="text-[#2552ca] transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#c5c6d2] bg-linear-to-br from-white to-[#e2efff] p-8 transition-shadow hover:shadow-lg md:col-span-2">
              <div className="flex flex-col gap-8 md:flex-row">
                <div className="flex-1">
                  <div className="mb-6 grid size-12 place-items-center rounded-xl bg-[#003baf] text-white shadow-sm">
                    <MaterialSymbol icon="analytics" />
                  </div>
                  <h4 className="mb-3 text-2xl leading-8 font-semibold tracking-normal text-[#00113a]">
                    Attendance Reports
                  </h4>
                  <p className="text-base leading-6 text-[#444650]">
                    Generate automated weekly, monthly, and yearly reports.
                    Identify trends in absenteeism and punctuality with advanced
                    AI heatmaps.
                  </p>
                </div>
                <div className="flex-1 rounded-xl border border-[#c5c6d2]/30 bg-white p-4 shadow-sm">
                  <div className="space-y-4">
                    {["w-3/4", "w-1/2", "w-5/6"].map((width) => (
                      <div
                        key={width}
                        className="h-4 w-full overflow-hidden rounded-full bg-[#e2efff]"
                      >
                        <div className={`h-full bg-[#2552ca] ${width}`} />
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-mono text-xs text-[#757682]">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>Jun</span>
                      <span>Sep</span>
                      <span>Dec</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#2552ca] p-10 text-center shadow-2xl md:p-20">
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-6 text-3xl leading-10 font-bold tracking-normal text-white md:text-[32px]">
                Ready to secure your institution?
              </h2>
              <p className="mb-10 text-lg leading-7 text-[#dce1ff] opacity-90">
                Join over 500+ schools worldwide using RecordIT for seamless and
                secure biometric attendance.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  className="h-16 rounded-xl bg-white px-10 text-base font-bold text-[#2552ca] hover:bg-[#f7f9ff]"
                >
                  <Link href="/login">Start Your Trial</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-16 rounded-xl border-2 border-[#dce1ff] bg-transparent px-10 text-base font-bold text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/login">Book a Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-[#c5c6d2] bg-[#cbdcee] py-12">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <span className="text-2xl font-bold text-[#0d1d2a]">RecordIT</span>
            <p className="max-w-xs text-center font-mono text-xs tracking-widest text-[#444650] uppercase md:text-left">
              © 2024 RecordIT Biometric Systems. All Rights Reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy", "Terms of Service", "Security Audit"].map(
              (item) => (
                <Link
                  key={item}
                  href="#"
                  className="font-mono text-xs font-bold tracking-wider text-[#444650] uppercase transition-colors hover:text-[#2552ca]"
                >
                  {item}
                </Link>
              )
            )}
          </div>
          <div className="flex gap-4">
            {["share", "mail"].map((icon) => (
              <button
                key={icon}
                aria-label={icon}
                className="grid size-10 place-items-center rounded-full bg-[#e2efff] text-[#2552ca] transition-all hover:bg-[#2552ca] hover:text-white"
              >
                <MaterialSymbol icon={icon} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
