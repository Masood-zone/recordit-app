import Link from "next/link"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PageHeader({
  actions,
  breadcrumb,
  description,
  title,
}: {
  actions?: React.ReactNode
  breadcrumb?: string
  description?: string
  title: string
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {breadcrumb ? (
          <p className="mb-2 text-sm font-bold tracking-[0.12em] text-on-surface-variant uppercase">
            {breadcrumb}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold text-[#00113a] md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}

export function StatCard({
  helper,
  icon,
  label,
  tone = "light",
  value,
}: {
  helper?: string
  icon: string
  label: string
  tone?: "light" | "dark" | "blue"
  value: React.ReactNode
}) {
  return (
    <article
      className={cn(
        "rounded-xl border p-5 shadow-card",
        tone === "dark"
          ? "border-primary-container bg-primary-container text-white"
          : tone === "blue"
            ? "border-secondary-container bg-secondary-container text-white"
            : "border-outline-variant bg-white text-on-surface"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-lg",
            tone === "light" ? "bg-surface-container text-primary" : "bg-white/15 text-white"
          )}
        >
          <MaterialSymbol icon={icon} />
        </span>
        {helper ? (
          <span className="rounded-full bg-biometric/20 px-3 py-1 text-xs font-bold text-biometric">
            {helper}
          </span>
        ) : null}
      </div>
      <p className={cn("text-xs font-bold tracking-[0.14em] uppercase", tone === "light" ? "text-on-surface-variant" : "text-white/70")}>
        {label}
      </p>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </article>
  )
}

export function StatusBadge({ status }: { status?: string | boolean | null }) {
  const text =
    typeof status === "boolean" ? (status ? "ACTIVE" : "INACTIVE") : status || "UNKNOWN"
  const classes =
    text === "ACTIVE" || text === "PRESENT" || text === "ENROLLED"
      ? "bg-cyan-100 text-cyan-800"
      : text === "SUSPENDED" || text === "ABSENT" || text === "ERROR"
        ? "bg-red-100 text-red-700"
        : text === "LATE"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-700"

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", classes)}>
      <span className="mr-1 size-2 rounded-full bg-current" />
      {text}
    </span>
  )
}

export function EmptyState({
  action,
  icon = "inbox",
  message,
  title,
}: {
  action?: React.ReactNode
  icon?: string
  message: string
  title: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant bg-white p-8 text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-surface-container text-primary">
        <MaterialSymbol icon={icon} />
      </span>
      <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-on-surface-variant">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function TableShell({
  children,
  footer,
  title,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  title?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
      {title ? <div className="border-b border-outline-variant p-5">{title}</div> : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t border-outline-variant p-5">{footer}</div> : null}
    </section>
  )
}

export function InputField({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-on-surface", className)}>
      <span>{label}</span>
      <input
        className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none transition focus:border-primary"
        {...props}
      />
    </label>
  )
}

export function SelectField({
  children,
  className,
  label,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-on-surface", className)}>
      <span>{label}</span>
      <select
        className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none transition focus:border-primary"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function PlaceholderPage({
  title,
  message = "Biometric device workflow coming later. This page is reserved so the navigation and permissions are ready without exposing unfinished hardware controls.",
}: {
  message?: string
  title: string
}) {
  return (
    <div>
      <PageHeader breadcrumb="RecordIT Admin" title={title} />
      <EmptyState
        icon="fingerprint"
        title="Biometric device workflow coming later"
        message={message}
        action={
          <Button asChild variant="outline">
            <Link href="/admin/students">Back to Students</Link>
          </Button>
        }
      />
    </div>
  )
}
