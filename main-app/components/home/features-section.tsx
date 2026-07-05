import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"

export function FeaturesSection() {
  return (
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
              href="/login"
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
  )
}
