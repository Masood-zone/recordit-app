"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  InputField,
  PageHeader,
  SelectField,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/school-admin/school-admin-ui"
import {
  useTeacherDashboard,
  useTeacherPatch,
  useTeacherStudent,
  useTeacherStudents,
} from "@/services/teacher/teacher"

type R = Record<string, unknown>

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

function list(value: unknown): R[] {
  return Array.isArray(value) ? (value as R[]) : []
}

function obj(value: unknown): R {
  return value && typeof value === "object" ? (value as R) : {}
}

function date(value: unknown) {
  if (!value) return "Not set"
  return new Date(String(value)).toLocaleDateString()
}

function dateInput(value: unknown) {
  if (!value) return ""
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

function time(value: unknown) {
  if (!value) return "Today"
  return new Date(String(value)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function errorMessage(error: unknown, fallback = "Request failed") {
  return error instanceof Error ? error.message : fallback
}

function submitData(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = event.currentTarget
  const data = Object.fromEntries(new FormData(form).entries())
  return { data, form }
}

function fullName(student: R) {
  return [student.firstName, student.otherName, student.lastName].map((part) => text(part)).filter(Boolean).join(" ")
}

export function TeacherDashboardPage() {
  const { data, isLoading } = useTeacherDashboard()
  const metrics = obj(data?.metrics)
  const teacher = obj(data?.teacher)
  const classes = list(data?.classes)
  const sessions = list(data?.todaySessions)
  const trend = list(data?.trend)
  const today = data?.today ? new Date(String(data.today)) : new Date()

  return (
    <div>
      <PageHeader
        breadcrumb={today.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
        title={`Welcome, ${text(teacher.name, "Teacher")}`}
        description={`${text(data?.schoolName, "RecordIT School")} classroom overview and assigned students.`}
        actions={
          <>
            <Button asChild>
              <Link href="/teacher/attendance-sessions">
                <MaterialSymbol icon="fingerprint" />
                Start Attendance
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/students">
                <MaterialSymbol icon="groups" />
                View Students
              </Link>
            </Button>
          </>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading teacher dashboard...</p> : null}

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" icon="class" label="My Classes" value={text(metrics.assignedClasses, "0")} helper="Active" />
        <StatCard icon="groups" label="Students Assigned" value={text(metrics.studentsAssigned, "0")} />
        <StatCard icon="event_available" label="Attendance Sessions Today" value={text(metrics.todaySessions, "0")} helper="WIP" />
        <StatCard tone="blue" icon="pending_actions" label="Pending Attendance" value={text(metrics.pendingAttendance, "0")} helper="WIP" />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#00113a]">
              <MaterialSymbol icon="schedule" className="text-secondary-container" />
              Today&apos;s Schedule
            </h2>
            <StatusBadge status="WIP" />
          </div>
          <div className="space-y-3">
            {sessions.length ? (
              sessions.map((session) => {
                const klass = obj(session.class)
                return (
                  <div
                    key={text(session.id)}
                    className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row md:items-center"
                  >
                    <div className="grid size-20 shrink-0 place-items-center rounded-xl border border-outline-variant bg-white text-center">
                      <span className="text-sm font-bold text-on-surface-variant">{time(session.sessionDate)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-primary-container">{text(klass.name, text(session.title))}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {text(klass.code, "No code")} / {text(session.status, "Scheduled")} / {text(obj(session._count).records, "0")} records
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/teacher/attendance-sessions">Preview</Link>
                    </Button>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon="event_busy"
                title="No attendance sessions for today"
                message="Attendance session creation is marked work in progress for the teacher workflow."
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
            <div className="grid gap-3">
              {[
                ["/teacher/attendance-sessions", "add_task", "Start Attendance", "WIP"],
                ["/teacher/pending-attendance", "visibility", "View Class Attendance", "WIP"],
                ["/teacher/students", "groups", "Manage Students", ""],
              ].map(([href, icon, label, badge]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-xl bg-surface-container p-4 font-semibold text-on-surface hover:bg-surface-container-high"
                >
                  <span className="flex items-center gap-3">
                    <MaterialSymbol icon={icon} className="text-primary" />
                    {label}
                  </span>
                  {badge ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{badge}</span> : <MaterialSymbol icon="chevron_right" />}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-bold">Weekly Attendance Trend</h2>
            <div className="flex h-36 items-end gap-3">
              {trend.map((item) => (
                <div key={text(item.label)} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end rounded-lg bg-surface-container">
                    <div
                      className="w-full rounded-lg bg-secondary-container"
                      style={{ height: `${Math.max(Number(item.rate || 0), 4)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant">{text(item.label)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#00113a]">Assigned Classes</h2>
          <Button asChild variant="outline">
            <Link href="/teacher/students">View Students</Link>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.length ? classes.map((item) => <TeacherClassCard key={text(item.id)} item={item} />) : (
            <EmptyState
              icon="class"
              title="No assigned classes yet"
              message="Your school administrator needs to assign classes before students appear here."
            />
          )}
        </div>
      </section>
    </div>
  )
}

function TeacherClassCard({ item }: { item: R }) {
  const lastSession = obj(list(item.attendanceSessions)[0])

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="h-2 bg-secondary-container" />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.14em] text-secondary-container uppercase">
              {text(item.code, "No code")}
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-primary-container">{text(item.name)}</h3>
          </div>
          <StatusBadge status={text(item.statusToday, "WIP")} />
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <InfoTile icon="groups" label="Students" value={text(obj(item._count).students, "0")} />
          <InfoTile icon="event" label="Last Session" value={lastSession.sessionDate ? date(lastSession.sessionDate) : "None"} />
        </div>
        <div className="grid gap-2 border-t border-outline-variant pt-4">
          <Button asChild>
            <Link href="/teacher/attendance-sessions">
              <MaterialSymbol icon="fingerprint" />
              Start Attendance
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <Link href="/teacher/pending-attendance">Records</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/teacher/students?classId=${text(item.id)}`}>Students</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
      <p className="text-xs font-bold tracking-[0.12em] text-on-surface-variant uppercase">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-bold">
        <MaterialSymbol icon={icon} className="text-base text-primary" />
        {value}
      </p>
    </div>
  )
}

export function TeacherStudentsPage({ initialClassId = "ALL" }: { initialClassId?: string }) {
  const [search, setSearch] = useState("")
  const [classId, setClassId] = useState(initialClassId)
  const params = useMemo(() => {
    const next: Record<string, string> = {}
    if (search) next.search = search
    if (classId !== "ALL") next.classId = classId
    return Object.keys(next).length ? next : undefined
  }, [classId, search])
  const { data, isLoading } = useTeacherStudents(params)
  const students = list(data?.students)
  const classes = list(data?.classes)

  return (
    <div>
      <PageHeader
        breadcrumb="Teacher / Students"
        title="Students"
        description="View and update students in your assigned classes."
      />
      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_260px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-12 rounded-full bg-white px-5 shadow-card outline-none"
          placeholder="Search by student name or ID..."
        />
        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          className="h-12 rounded-full border border-outline-variant bg-white px-4 shadow-card outline-none"
        >
          <option value="ALL">All assigned classes</option>
          {classes.map((item) => (
            <option key={text(item.id)} value={text(item.id)}>
              {text(item.name)}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading students...</p> : null}
      <TableShell footer={`Showing ${students.length} students`}>
        {students.length ? (
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-primary-container text-white">
              <tr>{["Student", "Student ID", "Class", "Fingerprint", "Last Attendance", "Status", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.map((student) => {
                const klass = obj(student.class)
                const lastRecord = obj(list(student.attendanceRecords)[0])
                return (
                  <tr key={text(student.id)}>
                    <td className="p-4">
                      <p className="font-bold">{fullName(student)}</p>
                      <p className="text-sm text-on-surface-variant">{text(student.gender)}</p>
                    </td>
                    <td className="p-4">{text(student.studentNumber)}</td>
                    <td className="p-4">{text(klass.name, "Unassigned")}</td>
                    <td className="p-4"><StatusBadge status={list(student.fingerprints).length ? "ENROLLED" : "WIP"} /></td>
                    <td className="p-4">{lastRecord.markedAt ? `${date(lastRecord.markedAt)} / ${text(lastRecord.status)}` : "No records"}</td>
                    <td className="p-4"><StatusBadge status={Boolean(student.isActive)} /></td>
                    <td className="p-4">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/teacher/students/${text(student.id)}`}>Update Details</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon="groups"
              title="No students found"
              message="Students will appear here after your administrator assigns you to classes with active students."
            />
          </div>
        )}
      </TableShell>
    </div>
  )
}

export function TeacherStudentProfilePage() {
  const params = useParams<{ studentId: string }>()
  const router = useRouter()
  const { data, isLoading } = useTeacherStudent(params.studentId)
  const student = obj(data?.student)
  const klass = obj(student.class)
  const update = useTeacherPatch(`/teacher/students/${params.studentId}`)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const { data: form } = submitData(event)

    try {
      await update.mutateAsync({
        ...form,
        isActive: form.isActive === "ACTIVE",
      })
      toast.success("Student details updated")
      router.push("/teacher/students")
    } catch (error) {
      toast.error(errorMessage(error, "Student could not be updated"))
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Students / Update Details"
        title={student.id ? fullName(student) : "Student Details"}
        description={student.id ? `${text(student.studentNumber)} / ${text(klass.name, "Assigned class")}` : "Loading student profile..."}
        actions={
          <>
            <Button asChild>
              <Link href={`/teacher/students/${params.studentId}/fingerprint`}>
                <MaterialSymbol icon="fingerprint" />
                Enroll Fingerprint
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/students">Back to Students</Link>
            </Button>
          </>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading student...</p> : null}
      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={onSubmit} className="grid gap-5 rounded-xl border border-outline-variant bg-white p-6 shadow-card md:grid-cols-2">
          <InputField name="firstName" label="First Name" defaultValue={text(student.firstName)} required />
          <InputField name="lastName" label="Last Name" defaultValue={text(student.lastName)} required />
          <InputField name="otherName" label="Other Name" defaultValue={text(student.otherName)} />
          <InputField name="studentNumber" label="Student ID" defaultValue={text(student.studentNumber)} required />
          <SelectField name="gender" label="Gender" defaultValue={text(student.gender, "OTHER")}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </SelectField>
          <InputField name="dateOfBirth" label="Date of Birth" type="date" defaultValue={dateInput(student.dateOfBirth)} />
          <InputField name="photoUrl" label="Photo URL" defaultValue={text(student.photoUrl)} className="md:col-span-2" />
          <SelectField name="isActive" label="Student Status" defaultValue={student.isActive === false ? "INACTIVE" : "ACTIVE"}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
          <div className="flex items-end gap-3">
            <Button disabled={update.isPending}>
              {update.isPending ? "Saving..." : "Save Student"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/students">Cancel</Link>
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-bold">Class Details</h2>
            <div className="grid gap-4">
              <InfoTile icon="class" label="Class" value={text(klass.name, "Unassigned")} />
              <InfoTile icon="tag" label="Class Code" value={text(klass.code, "-")} />
              <InfoTile icon="fingerprint" label="Fingerprints" value={`${list(student.fingerprints).length} enrolled`} />
            </div>
          </div>
          <TableShell title={<h2 className="text-xl font-bold">Recent Attendance</h2>}>
            <div className="divide-y divide-outline-variant">
              {list(student.attendanceRecords).length ? list(student.attendanceRecords).map((record) => (
                <div key={text(record.id)} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-bold">{text(obj(record.session).title, "Attendance")}</p>
                    <p className="text-sm text-on-surface-variant">{date(record.markedAt)}</p>
                  </div>
                  <StatusBadge status={text(record.status)} />
                </div>
              )) : <p className="p-4 text-on-surface-variant">No attendance records yet.</p>}
            </div>
          </TableShell>
        </div>
      </section>
    </div>
  )
}

export function TeacherWorkInProgressPage({
  title,
  variant,
}: {
  title: string
  variant: "sessions" | "pending"
}) {
  return (
    <div>
      <PageHeader
        breadcrumb="Teacher / Work in Progress"
        title={title}
        description="This attendance workflow is intentionally marked work in progress until the biometric session implementation is ready."
      />
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-outline-variant bg-white p-8 shadow-card">
          <div className="mb-6 grid size-20 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <MaterialSymbol icon={variant === "sessions" ? "fingerprint" : "pending_actions"} className="text-[40px]" />
          </div>
          <h2 className="text-2xl font-bold text-primary-container">Work in progress</h2>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            Attendance sessions, live scans, pending attendance resolution, and class attendance records will be connected in the next attendance implementation pass.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/teacher/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/students">View Students</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
          <h3 className="mb-4 text-lg font-bold">Reserved Scope</h3>
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p>Open attendance session</p>
            <p>Live biometric scan area</p>
            <p>Manual adjustment support</p>
            <p>Session summary and close flow</p>
          </div>
        </div>
      </section>
    </div>
  )
}
