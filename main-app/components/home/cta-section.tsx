import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
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
                variant="outline"
                className="h-16 rounded-xl border-2 border-[#dce1ff] bg-transparent px-10 text-base font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Get Started Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
