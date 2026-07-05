import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-[#c5c6d2] bg-[#cbdcee] py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <span className="text-2xl font-bold text-[#0d1d2a]">RecordIT</span>
          <p className="max-w-xs text-center font-mono text-xs tracking-widest text-[#444650] uppercase md:text-left">
            © 2026 RecordIT Biometric Systems. All Rights Reserved.
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
  )
}
