import { MaterialSymbol } from "@/components/common/MaterialSymbol"

type DashboardHomeProps = {
  eyebrow: string
  title: string
  description: string
  highlights: Array<{
    icon: string
    label: string
    value: string
  }>
}

export function DashboardHome({
  eyebrow,
  title,
  description,
  highlights,
}: DashboardHomeProps) {
  return (
    <main className="min-h-svh bg-[#f7f9ff] text-[#0d1d2a]">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-8 sm:px-6 md:py-12">
        <header className="rounded-xl border border-[#c5c6d2] bg-white p-6 shadow-[0_4px_12px_rgb(0_35_102/0.05)] md:p-8">
          <p className="mb-3 font-mono text-xs font-bold tracking-[0.12em] text-[#2552ca] uppercase">
            {eyebrow}
          </p>
          <h1 className="text-3xl leading-10 font-bold tracking-normal text-[#00113a]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-6 text-[#444650]">
            {description}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-[#c5c6d2] bg-white p-5 shadow-[0_4px_12px_rgb(0_35_102/0.05)]"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-[#ecf4ff] text-[#2552ca]">
                <MaterialSymbol icon={item.icon} />
              </div>
              <div className="text-sm text-[#444650]">{item.label}</div>
              <div className="mt-1 text-xl font-bold text-[#00113a]">
                {item.value}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
