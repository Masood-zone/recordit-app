import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import type { SchoolStatus } from "@/types"

export function StatusBadge({ status }: { status: SchoolStatus }) {
  const classes = {
    ACTIVE: "bg-success/10 text-[#065f46] border-success/30",
    INACTIVE:
      "bg-surface-container text-on-surface-variant border-outline-variant",
    PENDING: "bg-warning/10 text-[#92400e] border-warning/30",
    SUSPENDED: "bg-destructive/10 text-destructive border-destructive/30",
  }[status]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase ${classes}`}
    >
      {status}
    </span>
  )
}

export function StatTile({
  helper,
  icon,
  label,
  value,
}: {
  helper?: string
  icon: string
  label: string
  value: number | string
}) {
  return (
    <article className="recordit-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
          <MaterialSymbol icon={icon} />
        </div>
        {helper ? (
          <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-semibold text-on-surface-variant">
            {helper}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-bold tracking-[0.1em] text-on-surface-variant uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    </article>
  )
}

export function PageHeader({
  actions,
  eyebrow,
  title,
  description,
}: {
  actions?: React.ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-sm font-bold tracking-[0.12em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <p className="mt-2 max-w-3xl text-on-surface-variant">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}
