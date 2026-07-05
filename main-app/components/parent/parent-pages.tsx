"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { FormEvent, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import {
  useContactSchool,
  useDeleteParentNotification,
  useMarkAllParentNotificationsRead,
  useMarkParentNotificationRead,
  useParentAttendance,
  useParentCalendar,
  useParentChildren,
  useParentDashboard,
  useParentNotifications,
  useParentPreferences,
  useParentProfile,
  useSaveParentPreferences,
  useSaveParentProfile,
} from "@/services/parent/parent"
import { cn } from "@/lib/utils"

type R = Record<string, unknown>

function obj(value: unknown): R {
  return value && typeof value === "object" ? (value as R) : {}
}

function list(value: unknown): R[] {
  return Array.isArray(value) ? (value as R[]) : []
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

function bool(value: unknown) {
  return Boolean(value)
}

function date(value: unknown) {
  if (!value) return "Not recorded"
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return "Not recorded"
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function time(value: unknown) {
  if (!value) return "N/A"
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function initials(name: unknown) {
  const parts = text(name, "Student").split(" ").filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S"
}

function statusTone(status: unknown) {
  const value = text(status).toUpperCase()
  if (value === "PRESENT") return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (value === "ABSENT") return "bg-red-100 text-red-700 border-red-200"
  if (value === "LATE") return "bg-amber-100 text-amber-800 border-amber-200"
  if (value === "EXCUSED") return "bg-blue-100 text-blue-800 border-blue-200"
  return "bg-surface-container text-on-surface-variant border-outline-variant"
}

function typeLabel(value: unknown) {
  return text(value, "ACCOUNT_UPDATE").replaceAll("_", " ").toLowerCase()
}

function errorLabel(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function PageTitle({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: React.ReactNode
  description?: string
  eyebrow?: string
  title: string
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase text-on-surface-variant">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-on-surface-variant">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </header>
  )
}

function AvatarTile({ image, name, size = "lg" }: { image?: unknown; name: unknown; size?: "sm" | "lg" | "xl" }) {
  const classes = size === "xl" ? "size-24 text-2xl" : size === "lg" ? "size-16 text-lg" : "size-12 text-sm"
  const url = text(image)
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-container-high font-bold text-primary", classes)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={text(name)} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}

function StatBox({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "danger" | "blue" }) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4 text-center shadow-card",
        tone === "danger"
          ? "border-red-100 bg-red-50"
          : tone === "blue"
            ? "border-blue-100 bg-blue-50"
            : "border-outline-variant bg-white"
      )}
    >
      <div className="text-2xl font-bold text-primary">{value}</div>
      <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
    </article>
  )
}

function ChildCard({ child, compact = false }: { child: R; compact?: boolean }) {
  const attendance = obj(child.attendance)
  const latest = obj(child.latestAttendance)
  return (
    <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
      <div className="flex gap-4">
        <AvatarTile image={child.photoUrl} name={child.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-primary">{text(child.name, "Student")}</h2>
              <p className="truncate text-sm font-semibold text-on-surface-variant">
                {text(child.className, "Class")} / {text(child.schoolName, "School")}
              </p>
            </div>
            <span className="rounded-full bg-surface-container px-3 py-1 text-sm font-bold text-primary">
              {text(attendance.percentage, "0")}%
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
            <MaterialSymbol icon={text(latest.status) === "ABSENT" ? "warning" : "check_circle"} className="text-[18px] text-success" filled />
            <span>
              Latest:{" "}
              <span className="font-bold text-on-surface">
                {text(latest.status, "No attendance yet")}
              </span>
            </span>
          </div>
        </div>
      </div>
      {compact ? null : (
        <>
          <div className="my-4 h-px bg-outline-variant" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-secondary-container text-white">
                <MaterialSymbol icon="shield" className="text-[18px]" />
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-surface-container text-primary">
                <MaterialSymbol icon="history" className="text-[18px]" />
              </span>
            </div>
            <Button asChild>
              <Link href={`/parent/children/${text(child.id)}/attendance`}>
                View Attendance
                <MaterialSymbol icon="arrow_forward" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </article>
  )
}

function EmptyParentState({ message = "No records are available yet." }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant bg-white p-8 text-center shadow-card">
      <MaterialSymbol icon="family_restroom" className="mx-auto mb-3 text-4xl text-primary" />
      <h2 className="text-lg font-bold text-primary">Nothing to show yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">{message}</p>
    </div>
  )
}

export function ParentDashboardView() {
  const { data, isLoading } = useParentDashboard()
  const child = obj(data?.selectedChild)
  const attendance = obj(child.attendance)
  const children = list(data?.children)

  if (isLoading) return <p className="text-on-surface-variant">Loading parent dashboard...</p>

  return (
    <div>
      <PageTitle
        eyebrow="Guardian Account"
        title="Welcome, Parent/Guardian"
        description={`${text(obj(data?.parent).name, "Guardian")} / ${text(obj(data?.school).name, "RecordIT School")}`}
      />
      {child.id ? (
        <div className="space-y-6">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold",
              text(obj(child.latestAttendance).status) === "ABSENT"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-cyan-200 bg-cyan-50 text-primary"
            )}
          >
            <MaterialSymbol icon={text(obj(child.latestAttendance).status) === "ABSENT" ? "warning" : "check_circle"} filled />
            {text(data?.statusMessage, "Your child's attendance is up to date.")}
          </div>
          <section className="rounded-xl border border-outline-variant bg-white shadow-card">
            <div className="p-5">
              <ChildCard child={child} compact />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-outline-variant bg-white p-4 sm:grid-cols-4">
              <StatBox label="Present Days" value={text(attendance.present, "0")} />
              <StatBox label="Absent Days" value={text(attendance.absent, "0")} tone="danger" />
              <StatBox label="Late Days" value={text(attendance.late, "0")} tone="blue" />
              <StatBox label="Attendance" value={`${text(attendance.percentage, "0")}%`} />
            </div>
            <div className="px-4 pb-4">
              <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary-container"
                  style={{ width: `${Math.min(Number(attendance.percentage || 0), 100)}%` }}
                />
              </div>
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold text-on-surface-variant">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [`/parent/children/${text(child.id)}/attendance`, "event_note", "Attendance Details", "View monthly breakdowns"],
                ["/parent/notifications", "notifications", "Notifications", `${text(data?.unreadCount, "0")} unread alerts`],
                ["/parent/contact-school", "contact_mail", "Contact School", "Phone and email contacts"],
              ].map(([href, icon, label, helper]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4 shadow-card hover:bg-surface-container-low"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-surface-container text-primary">
                      <MaterialSymbol icon={icon} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-primary">{label}</span>
                      <span className="block truncate text-xs text-on-surface-variant">{helper}</span>
                    </span>
                  </span>
                  <MaterialSymbol icon="chevron_right" />
                </Link>
              ))}
            </div>
          </section>
          {children.length > 1 ? (
            <Button asChild variant="outline">
              <Link href="/parent/children">View all linked children</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <EmptyParentState message="Your parent account is active, but no children have been linked yet." />
      )}
    </div>
  )
}

export function ParentChildrenView() {
  const { data, isLoading } = useParentChildren()
  const children = list(data?.children)

  return (
    <div>
      <PageTitle
        title="My Children"
        description="Real-time attendance and safety monitoring for every child linked to your account."
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading children...</p> : null}
      <div className="space-y-4">
        {children.length ? children.map((child) => <ChildCard key={text(child.id)} child={child} />) : <EmptyParentState />}
      </div>
    </div>
  )
}

export function ParentAttendanceView() {
  const params = useParams<{ studentId: string }>()
  const search = useSearchParams()
  const filter = search.get("filter") || "month"
  const [customStart, setCustomStart] = useState(search.get("start") || "")
  const [customEnd, setCustomEnd] = useState(search.get("end") || "")
  const queryParams: Record<string, string> = { filter }
  if (customStart && filter === "custom") queryParams.start = customStart
  if (customEnd && filter === "custom") queryParams.end = customEnd
  const { data, isLoading } = useParentAttendance(params.studentId, queryParams)
  const student = obj(data?.student)
  const summary = obj(data?.summary)
  const records = list(data?.records)

  const filterHref = (nextFilter: string) =>
    `/parent/children/${params.studentId}/attendance?filter=${nextFilter}`

  return (
    <div>
      <PageTitle
        title={text(student.name, "Attendance Details")}
        description={`${text(student.className, "Class")} / ${text(student.schoolName, "School")}`}
        action={
          <Button asChild variant="outline">
            <Link href={`/parent/children/${params.studentId}/calendar`}>
              <MaterialSymbol icon="calendar_month" />
              Calendar
            </Link>
          </Button>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading attendance...</p> : null}
      <section className="mb-6 rounded-xl border border-outline-variant bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarTile image={student.photoUrl} name={student.name} />
            <div>
              <h2 className="text-xl font-bold text-primary">{text(student.name, "Student")}</h2>
              <p className="text-sm text-on-surface-variant">{text(student.studentNumber)}</p>
            </div>
          </div>
          <div className="grid size-20 place-items-center rounded-full border-8 border-cyan-100 text-center">
            <span className="text-xl font-bold text-primary">{text(summary.percentage, "0")}%</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Present" value={text(summary.present, "0")} />
          <StatBox label="Late" value={text(summary.late, "0")} tone="blue" />
          <StatBox label="Absent" value={text(summary.absent, "0")} tone="danger" />
          <StatBox label="Excused" value={text(summary.excused, "0")} />
        </div>
      </section>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[
          ["week", "This Week"],
          ["month", "This Month"],
          ["term", "This Term"],
          ["custom", "Custom Date Range"],
        ].map(([value, label]) => (
          <Button key={value} asChild variant={filter === value ? "default" : "outline"}>
            <Link href={filterHref(value)}>{label}</Link>
          </Button>
        ))}
      </div>
      {filter === "custom" ? (
        <div className="mb-5 grid gap-3 rounded-xl border border-outline-variant bg-white p-4 shadow-card sm:grid-cols-[1fr_1fr_auto]">
          <input className="h-11 rounded-lg bg-surface-container px-3" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
          <input className="h-11 rounded-lg bg-surface-container px-3" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
          <Button asChild>
            <Link href={`/parent/children/${params.studentId}/attendance?filter=custom&start=${customStart}&end=${customEnd}`}>
              Apply
            </Link>
          </Button>
        </div>
      ) : null}
      <AttendanceRecords records={records} />
    </div>
  )
}

function AttendanceRecords({ records }: { records: R[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
      <div className="border-b border-outline-variant p-5">
        <h2 className="text-xl font-bold text-primary">Recent Attendance</h2>
      </div>
      {records.length ? (
        <div className="divide-y divide-outline-variant">
          {records.map((record) => {
            const session = obj(record.session)
            return (
              <div key={text(record.id)} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-surface-container text-primary">
                    <MaterialSymbol icon="calendar_today" />
                  </span>
                  <div>
                    <p className="font-bold text-primary">{date(record.markedAt)}</p>
                    <p className="text-sm text-on-surface-variant">
                      {time(record.markedAt)} / {text(session.title, "Attendance")}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {text(obj(session.class).name, "Class session")} / {text(obj(obj(session.teacher).user).name, "Teacher")}
                    </p>
                  </div>
                </div>
                <span className={cn("w-fit rounded-full border px-3 py-1 text-xs font-bold", statusTone(record.status))}>
                  {text(record.status)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-6"><EmptyParentState message="No attendance records were found for this period." /></div>
      )}
    </section>
  )
}

export function ParentCalendarView() {
  const params = useParams<{ studentId: string }>()
  const [selected, setSelected] = useState<R | null>(null)
  const { data, isLoading } = useParentCalendar(params.studentId, { filter: "month" })
  const student = obj(data?.student)
  const records = list(data?.records)
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const offset = first.getDay()
  const byDay = new Map(records.map((record) => [new Date(String(record.markedAt)).getDate(), record]))
  const cells = Array.from({ length: offset + daysInMonth }, (_, index) => {
    const day = index - offset + 1
    return day > 0 ? day : null
  })

  return (
    <div>
      <PageTitle
        title={`${now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
        eyebrow={text(student.name, "Attendance Calendar")}
        description="Tap a marked date to view attendance details."
        action={<Button asChild variant="outline"><Link href={`/parent/children/${params.studentId}/attendance`}>Details</Link></Button>}
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading calendar...</p> : null}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low py-3 text-center text-xs font-bold text-on-surface-variant">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 p-2">
          {cells.map((day, index) => {
            const record = day ? byDay.get(day) : null
            return day ? (
              <button
                key={day}
                onClick={() => record && setSelected(record)}
                className={cn(
                  "aspect-square rounded-lg border text-sm font-bold",
                  record ? statusTone(record.status) : "border-transparent bg-surface-container-low text-on-surface-variant"
                )}
              >
                {day}
              </button>
            ) : (
              <div key={`blank-${index}`} className="aspect-square" />
            )
          })}
        </div>
      </section>
      <div className="mt-5 flex flex-wrap gap-2">
        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
          <span key={status} className={cn("rounded-full border px-3 py-1 text-xs font-bold", statusTone(status))}>
            {status}
          </span>
        ))}
      </div>
      {selected ? (
        <section className="mt-5 rounded-xl border border-outline-variant bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-primary">{date(selected.markedAt)}</h2>
              <p className="text-sm text-on-surface-variant">
                {text(obj(selected.session).title, "Attendance")} / {time(selected.markedAt)}
              </p>
            </div>
            <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", statusTone(selected.status))}>
              {text(selected.status)}
            </span>
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">
            {text(selected.remarks, "No remarks were added for this attendance record.")}
          </p>
        </section>
      ) : null}
    </div>
  )
}

export function ParentNotificationsView() {
  const { data, isLoading } = useParentNotifications()
  const markRead = useMarkParentNotificationRead()
  const markAll = useMarkAllParentNotificationsRead()
  const remove = useDeleteParentNotification()
  const items = list(data?.notifications)

  async function safe(action: Promise<unknown>, success: string, failure: string) {
    try {
      await action
      toast.success(success)
    } catch (error) {
      toast.error(errorLabel(error, failure))
    }
  }

  return (
    <div>
      <PageTitle
        eyebrow="Stay Updated"
        title="Alerts Center"
        description={`${text(data?.unreadCount, "0")} unread notifications`}
        action={
          <Button variant="outline" disabled={markAll.isPending} onClick={() => safe(markAll.mutateAsync(), "All notifications marked as read", "Update failed")}>
            <MaterialSymbol icon="done_all" />
            Mark all read
          </Button>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading notifications...</p> : null}
      <div className="space-y-4">
        {items.length ? items.map((item) => {
          const unread = !item.readAt
          return (
            <article key={text(item.id)} className={cn("rounded-xl border bg-white p-4 shadow-card", unread ? "border-primary/30" : "border-outline-variant opacity-80")}>
              <div className="flex gap-4">
                <span className={cn("relative grid size-12 shrink-0 place-items-center rounded-xl", text(item.type) === "ABSENCE_ALERT" ? "bg-red-100 text-red-700" : "bg-surface-container text-primary")}>
                  <MaterialSymbol icon={text(item.type) === "SCHOOL_ANNOUNCEMENT" ? "campaign" : text(item.type) === "WEEKLY_SUMMARY" ? "analytics" : "warning"} filled />
                  {unread ? <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-white bg-destructive" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase text-secondary-container">{typeLabel(item.type)}</p>
                    <span className="text-xs text-on-surface-variant">{date(item.createdAt)}</span>
                  </div>
                  <h2 className="font-bold text-on-surface">{text(item.title)}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{text(item.message)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {unread ? (
                      <Button size="sm" disabled={markRead.isPending} onClick={() => safe(markRead.mutateAsync(text(item.id)), "Notification marked as read", "Update failed")}>
                        Mark as Read
                      </Button>
                    ) : null}
                    {item.studentId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/parent/children/${text(item.studentId)}/attendance`}>View Attendance</Link>
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => safe(remove.mutateAsync(text(item.id)), "Notification deleted", "Delete failed")}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          )
        }) : <EmptyParentState message="You do not have any parent notifications yet." />}
      </div>
    </div>
  )
}

export function ParentPreferencesView() {
  const { data } = useParentPreferences()
  const save = useSaveParentPreferences()
  const prefs = obj(data?.preferences)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const input = Object.fromEntries(new FormData(form).entries())
    const payload = {
      emailEnabled: input.emailEnabled === "on",
      smsEnabled: input.smsEnabled === "on",
      whatsappEnabled: input.whatsappEnabled === "on",
      inAppEnabled: input.inAppEnabled === "on",
      absentAlerts: input.absentAlerts === "on",
      lateAlerts: input.lateAlerts === "on",
      weeklySummary: input.weeklySummary === "on",
      termlySummary: input.termlySummary === "on",
    }
    try {
      await save.mutateAsync(payload)
      toast.success("Notification preferences saved")
    } catch (error) {
      toast.error(errorLabel(error, "Preferences could not be saved"))
    }
  }

  return (
    <div>
      <PageTitle title="Notification Settings" description="Choose how and when RecordIT should notify you." />
      <form onSubmit={onSubmit} className="space-y-6">
        <PreferenceSection title="Delivery Channels">
          <ToggleRow name="emailEnabled" icon="mail" title="Email Notifications" description="Daily reports and formal notices" defaultChecked={prefs.emailEnabled !== false} />
          <ToggleRow name="smsEnabled" icon="sms" title="SMS Alerts" description="Urgent attendance updates" defaultChecked={prefs.smsEnabled !== false} />
          <ToggleRow name="whatsappEnabled" icon="chat" title="WhatsApp Messages" description="Convenient instant messaging" defaultChecked={bool(prefs.whatsappEnabled)} />
          <ToggleRow name="inAppEnabled" icon="app_shortcut" title="In-app Badges" description="Real-time dashboard alerts" defaultChecked={prefs.inAppEnabled !== false} />
        </PreferenceSection>
        <PreferenceSection title="Attendance Updates">
          <ToggleRow name="absentAlerts" icon="warning" title="Notify me when my child is absent" description="Send an alert when attendance is missed" defaultChecked={prefs.absentAlerts !== false} />
          <ToggleRow name="lateAlerts" icon="schedule" title="Notify me when my child is late" description="Send an alert for late arrival records" defaultChecked={prefs.lateAlerts !== false} />
          <ToggleRow name="weeklySummary" icon="analytics" title="Send weekly attendance summary" description="Receive a simple weekly attendance overview" defaultChecked={prefs.weeklySummary !== false} />
          <ToggleRow name="termlySummary" icon="summarize" title="Send termly attendance summary" description="Receive an end-of-term attendance overview" defaultChecked={bool(prefs.termlySummary)} />
        </PreferenceSection>
        <div className="flex gap-3">
          <Button disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Preferences"}</Button>
          <Button type="reset" variant="outline" disabled={save.isPending}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}

function PreferenceSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase text-on-surface-variant">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">{children}</div>
    </section>
  )
}

function ToggleRow({ defaultChecked, description, icon, name, title }: { defaultChecked: boolean; description: string; icon: string; name: string; title: string }) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-outline-variant p-4 last:border-b-0">
      <span className="flex min-w-0 items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-container text-primary">
          <MaterialSymbol icon={icon} />
        </span>
        <span className="min-w-0">
          <span className="block font-bold text-primary">{title}</span>
          <span className="block text-xs text-on-surface-variant">{description}</span>
        </span>
      </span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-5 shrink-0 accent-primary" />
    </label>
  )
}

export function ParentProfileView() {
  const { data } = useParentProfile()
  const save = useSaveParentProfile()
  const parent = obj(data?.parent)
  const children = list(data?.children)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    try {
      await save.mutateAsync(Object.fromEntries(new FormData(form).entries()))
      toast.success("Profile updated")
    } catch (error) {
      toast.error(errorLabel(error, "Profile could not be saved"))
    }
  }

  return (
    <div>
      <PageTitle title="My Profile" description="View and update your parent contact details." />
      <section className="mb-6 rounded-xl border border-outline-variant bg-white p-6 text-center shadow-card">
        <AvatarTile image={parent.image} name={parent.name} size="xl" />
        <h2 className="mt-4 text-2xl font-bold text-primary">{text(parent.name, "Parent/Guardian")}</h2>
        <div className="mt-2 flex justify-center gap-2">
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-secondary-container">Verified Guardian</span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">{text(parent.relationship, "Guardian")}</span>
        </div>
      </section>
      <form onSubmit={onSubmit} className="mb-6 grid gap-4 rounded-xl border border-outline-variant bg-white p-5 shadow-card sm:grid-cols-2">
        <Field name="firstName" label="First Name" defaultValue={text(parent.firstName)} />
        <Field name="lastName" label="Last Name" defaultValue={text(parent.lastName)} />
        <Field name="email" label="Email" defaultValue={text(parent.email)} readOnly />
        <Field name="phone" label="Phone" defaultValue={text(parent.phone)} />
        <Field name="relationship" label="Relationship" defaultValue={text(parent.relationship)} />
        <Field name="occupation" label="Occupation" defaultValue={text(parent.occupation)} />
        <Field name="address" label="Address" defaultValue={text(parent.address)} className="sm:col-span-2" />
        <div className="flex gap-3 sm:col-span-2">
          <Button disabled={save.isPending}>{save.isPending ? "Saving..." : "Edit Contact Details"}</Button>
          <Button asChild variant="outline"><Link href="/forgot-password">Change Password</Link></Button>
        </div>
      </form>
      <section className="rounded-xl border border-outline-variant bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-outline-variant p-5">
          <h2 className="text-xl font-bold text-primary">Linked Children</h2>
          <span className="text-sm font-bold text-secondary-container">{children.length} Students</span>
        </div>
        <div className="divide-y divide-outline-variant">
          {children.map((child) => (
            <Link key={text(child.id)} href={`/parent/children/${text(child.id)}/attendance`} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-container-low">
              <span className="flex min-w-0 items-center gap-3">
                <AvatarTile image={child.photoUrl} name={child.name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{text(child.name)}</span>
                  <span className="block truncate text-xs text-on-surface-variant">{text(child.className)}</span>
                </span>
              </span>
              <MaterialSymbol icon="chevron_right" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({ className, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-on-surface", className)}>
      <span>{label}</span>
      <input className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none focus:border-primary read-only:text-on-surface-variant" {...props} />
    </label>
  )
}

export function ContactSchoolView() {
  const search = useSearchParams()
  const studentId = search.get("studentId") || undefined
  const { data, isLoading } = useContactSchool(studentId)
  const school = obj(data?.school)
  const child = obj(data?.child)
  const teacher = obj(data?.leadTeacher)
  const address = [school.address, school.city, school.region].map((part) => text(part)).filter(Boolean).join(", ")

  return (
    <div>
      <PageTitle title="Contact School" description="School and class teacher contacts for quick parent support." />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading contacts...</p> : null}
      <section className="mb-5 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card">
        <div className="bg-primary-container p-6 text-white">
          <p className="text-xs font-bold uppercase text-white/70">Institution</p>
          <h2 className="text-2xl font-bold">{text(school.name, "RecordIT School")}</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Button asChild>
            <a href={`tel:${text(school.phone) || "#"}`}>
              <MaterialSymbol icon="call" />
              Call School
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`mailto:${text(school.email) || "#"}`}>
              <MaterialSymbol icon="mail" />
              Email School
            </a>
          </Button>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <ContactCard icon="location_on" title="School Address" lines={[address || "Address not set"]} />
        <ContactCard icon="contact_mail" title="Official Channels" lines={[text(school.phone, "Phone not set"), text(school.email, "Email not set")]} />
      </div>
      <section className="mt-5 rounded-xl border border-outline-variant bg-primary-container p-6 text-white shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Class Teacher</h2>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold">Direct Line</span>
        </div>
        {teacher.id ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AvatarTile image={teacher.image} name={teacher.name} />
              <div>
                <h3 className="text-lg font-bold">{text(teacher.name)}</h3>
                <p className="text-sm text-white/75">{text(child.className)} Lead Instructor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary"><a href={`tel:${text(teacher.phone) || "#"}`}>Call</a></Button>
              <Button asChild variant="outline"><a href={`mailto:${text(teacher.email) || "#"}`}>Email</a></Button>
            </div>
          </div>
        ) : (
          <p className="text-white/75">No lead class teacher contact is available yet.</p>
        )}
      </section>
    </div>
  )
}

function ContactCard({ icon, lines, title }: { icon: string; lines: string[]; title: string }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-surface-container text-primary">
          <MaterialSymbol icon={icon} />
        </span>
        <h2 className="font-bold text-primary">{title}</h2>
      </div>
      <div className="space-y-2 text-on-surface-variant">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </section>
  )
}
