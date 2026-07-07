"use client"

import { FormEvent, useMemo, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import {
  PageHeader,
  SelectField,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/school-admin/school-admin-ui"
import { useAdminGenerateReport, useAdminReports } from "@/services/admin/admin"
import { useTeacherGenerateReport, useTeacherReports } from "@/services/teacher/teacher"

type R = Record<string, unknown>
type Role = "admin" | "teacher"

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
  if (!value) return "-"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString()
}

function time(value: unknown) {
  if (!value) return "-"
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function AttendanceReportsPage({ role }: { role: Role }) {
  const [filters, setFilters] = useState<Record<string, string>>({
    classId: "ALL",
    date: todayInput(),
    studentId: "ALL",
    type: "DAILY",
  })
  const adminReports = useAdminReports(filters, role === "admin")
  const teacherReports = useTeacherReports(filters, role === "teacher")
  const adminGenerate = useAdminGenerateReport()
  const teacherGenerate = useTeacherGenerateReport()
  const data = role === "admin" ? adminReports.data : teacherReports.data
  const isLoading = role === "admin" ? adminReports.isLoading : teacherReports.isLoading
  const generate = role === "admin" ? adminGenerate : teacherGenerate
  const summary = obj(data?.summary)
  const records = list(data?.records)
  const classes = list(data?.classes)
  const students = list(data?.students).filter(
    (student) => filters.classId === "ALL" || text(student.classId) === filters.classId
  )
  const ranking = list(data?.ranking)
  const classPerformance = list(data?.classPerformance)
  const recentReports = list(data?.recentReports)

  const csv = useMemo(() => {
    const rows = [
      ["Student", "Student ID", "Class", "Status", "Date", "Time", "Method", "Offline"],
      ...records.map((record) => {
        const student = obj(record.student)
        return [
          [student.firstName, student.otherName, student.lastName].map((part) => text(part)).filter(Boolean).join(" "),
          text(student.studentNumber),
          text(obj(student.class).name, "Unassigned"),
          text(record.status),
          date(record.markedAt),
          time(record.markedAt),
          text(record.verificationMethod),
          record.capturedOffline ? "Yes" : "No",
        ]
      }),
    ]
    return rows.map((row) => row.map(csvValue).join(",")).join("\n")
  }, [records])

  function updateFilter(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `recordit-${filters.type.toLowerCase()}-attendance.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await generate.mutateAsync({
        ...filters,
        title: `${filters.type} Attendance Report`,
      })
      toast.success("Report generated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report could not be generated")
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb={role === "admin" ? "School Admin / Reports" : "Teacher / Reports"}
        title="Attendance Reports"
        description="Generate daily, weekly, monthly, termly, and custom attendance summaries from synced records."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <MaterialSymbol icon="print" />
              Print
            </Button>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!records.length}>
              <MaterialSymbol icon="download" />
              CSV
            </Button>
          </>
        }
      />
      <form onSubmit={saveReport} className="mb-6 rounded-xl border border-outline-variant bg-white p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <SelectField label="Report Type" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="TERMLY">Termly</option>
            <option value="CUSTOM">Custom</option>
          </SelectField>
          <SelectField label="Class" value={filters.classId} onChange={(event) => updateFilter("classId", event.target.value)}>
            <option value="ALL">All Classes</option>
            {classes.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.name)}</option>)}
          </SelectField>
          <SelectField label="Student" value={filters.studentId} onChange={(event) => updateFilter("studentId", event.target.value)}>
            <option value="ALL">All Students</option>
            {students.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.firstName)} {text(item.lastName)} / {text(item.studentNumber)}</option>)}
          </SelectField>
          {filters.type === "CUSTOM" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-2 text-sm font-semibold">
                <span>Start</span>
                <input type="date" value={filters.start || todayInput()} onChange={(event) => updateFilter("start", event.target.value)} className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>End</span>
                <input type="date" value={filters.end || todayInput()} onChange={(event) => updateFilter("end", event.target.value)} className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none" />
              </label>
            </div>
          ) : (
            <label className="grid gap-2 text-sm font-semibold">
              <span>Date</span>
              <input type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none" />
            </label>
          )}
          <Button className="self-end" disabled={generate.isPending}>
            <MaterialSymbol icon={generate.isPending ? "progress_activity" : "add_chart"} className={generate.isPending ? "animate-spin" : ""} />
            {generate.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>
      </form>

      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading report data...</p> : null}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard tone="dark" icon="analytics" label="Attendance" value={`${text(summary.attendanceRate, "0")}%`} />
        <StatCard icon="task_alt" label="Present" value={text(summary.present, "0")} />
        <StatCard icon="event_busy" label="Absent" value={text(summary.absent, "0")} />
        <StatCard tone="blue" icon="schedule" label="Late" value={text(summary.late, "0")} />
        <StatCard icon="verified" label="Excused" value={text(summary.excused, "0")} />
        <StatCard icon="cloud_done" label="Offline Synced" value={text(summary.offlineSynced, "0")} />
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">Class Performance</h2>
              <p className="text-sm text-on-surface-variant">Attendance percentage by class for the selected range.</p>
            </div>
            <StatusBadge status={text(obj(data?.range).type, filters.type)} />
          </div>
          <div className="grid gap-4">
            {classPerformance.length ? classPerformance.map((item) => (
              <div key={text(item.className)} className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{text(item.className)}</span>
                  <span className="text-on-surface-variant">{text(item.attendanceRate, "0")}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-secondary-container" style={{ width: `${Math.min(Number(item.attendanceRate || 0), 100)}%` }} />
                </div>
              </div>
            )) : <p className="text-on-surface-variant">No class records found for this range.</p>}
          </div>
        </div>
        <TableShell title={<h2 className="text-xl font-bold">Recently Generated</h2>}>
          <div className="divide-y divide-outline-variant">
            {recentReports.length ? recentReports.map((report) => (
              <div key={text(report.id)} className="p-4">
                <p className="font-bold">{text(report.title)}</p>
                <p className="text-xs text-on-surface-variant">{text(report.type)} / {date(report.createdAt)}</p>
              </div>
            )) : <p className="p-4 text-on-surface-variant">No generated reports yet.</p>}
          </div>
        </TableShell>
      </section>

      <section className="mb-6">
        <TableShell title={<h2 className="text-xl font-bold">Student Attendance Ranking</h2>} footer={`${ranking.length} students`}>
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-primary-container text-white">
              <tr>{["Student", "Class", "Present", "Late", "Absent", "Attendance"].map((head) => <th key={head} className="p-4">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {ranking.map((item) => (
                <tr key={text(item.studentId)}>
                  <td className="p-4"><p className="font-bold">{text(item.studentName)}</p><p className="text-sm text-on-surface-variant">{text(item.studentNumber)}</p></td>
                  <td className="p-4">{text(item.className)}</td>
                  <td className="p-4">{text(item.present, "0")}</td>
                  <td className="p-4">{text(item.late, "0")}</td>
                  <td className="p-4">{text(item.absent, "0")}</td>
                  <td className="p-4"><StatusBadge status={`${text(item.attendanceRate, "0")}%`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>

      <TableShell title={<h2 className="text-xl font-bold">Attendance Records</h2>} footer={`${records.length} records`}>
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-surface-container">
            <tr>{["Student", "Class", "Status", "Date", "Time", "Method", "Source"].map((head) => <th key={head} className="p-4">{head}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {records.map((record) => {
              const student = obj(record.student)
              return (
                <tr key={text(record.id)}>
                  <td className="p-4"><p className="font-bold">{text(student.firstName)} {text(student.lastName)}</p><p className="text-sm text-on-surface-variant">{text(student.studentNumber)}</p></td>
                  <td className="p-4">{text(obj(student.class).name, "Unassigned")}</td>
                  <td className="p-4"><StatusBadge status={text(record.status)} /></td>
                  <td className="p-4">{date(record.markedAt)}</td>
                  <td className="p-4">{time(record.markedAt)}</td>
                  <td className="p-4">{text(record.verificationMethod)}</td>
                  <td className="p-4">{record.capturedOffline ? "Offline sync" : "Live"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableShell>
    </div>
  )
}
