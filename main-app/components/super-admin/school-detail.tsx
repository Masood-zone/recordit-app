"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import {
  PageHeader,
  StatTile,
  StatusBadge,
} from "@/components/super-admin/super-admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useApproveSuperAdminSchool,
  useReactivateSuperAdminSchool,
  useSuperAdminSchool,
  useSuspendSuperAdminSchool,
  useUpdateSuperAdminSchool,
} from "@/services/super-admin/schools"

const tabs = [
  "Overview",
  "Users",
  "Classes",
  "Students",
  "Attendance",
  "Reports",
] as const
type Tab = (typeof tabs)[number]
const tabHref: Record<Tab, string> = {
  Overview: "",
  Users: "users",
  Classes: "classes",
  Students: "students",
  Attendance: "attendance",
  Reports: "reports",
}

export function SchoolDetail({
  initialTab = "Overview",
  schoolId,
}: {
  initialTab?: Tab
  schoolId: string
}) {
  const { data: school, error, isLoading } = useSuperAdminSchool(schoolId)
  const approve = useApproveSuperAdminSchool()
  const suspend = useSuspendSuperAdminSchool()
  const reactivate = useReactivateSuperAdminSchool()
  const update = useUpdateSuperAdminSchool()
  const activeTab = initialTab

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
    )
  }

  if (error || !school) {
    return (
      <div className="recordit-card p-6 text-destructive">
        {error?.message || "School could not be loaded"}
      </div>
    )
  }

  async function runStatus(action: "approve" | "suspend" | "reactivate") {
    try {
      if (action === "approve") {
        await approve.mutateAsync(schoolId)
        toast.success("School approved")
      } else if (action === "suspend") {
        await suspend.mutateAsync(schoolId)
        toast.success("School suspended")
      } else {
        await reactivate.mutateAsync(schoolId)
        toast.success("School reactivated")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="School Details"
        title={school.name}
        description={`${school.code} • ${[school.city, school.region].filter(Boolean).join(", ") || "Ghana"}`}
        actions={
          <>
            <StatusBadge status={school.status} />
            {school.status === "PENDING" ? (
              <Button onClick={() => runStatus("approve")}>Approve</Button>
            ) : null}
            {school.status === "ACTIVE" ? (
              <Button
                variant="destructive"
                onClick={() => runStatus("suspend")}
              >
                Suspend
              </Button>
            ) : null}
            {school.status === "SUSPENDED" ? (
              <Button onClick={() => runStatus("reactivate")}>
                Reactivate
              </Button>
            ) : null}
          </>
        }
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-outline-variant">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/super-admin/schools/${schoolId}${
              tabHref[tab] ? `/${tabHref[tab]}` : ""
            }`}
            className={`px-3 py-4 text-sm font-bold whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {tab}
          </Link>
        ))}
      </nav>

      {activeTab === "Overview" ? (
        <OverviewTab
          school={school}
          isSaving={update.isPending}
          onSave={async (input) => {
            try {
              await update.mutateAsync({ schoolId, input })
              toast.success("School profile updated")
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Update failed")
            }
          }}
        />
      ) : null}
      {activeTab === "Users" ? <UsersTab school={school} /> : null}
      {activeTab === "Classes" ? <ClassesTab school={school} /> : null}
      {activeTab === "Students" ? <StudentsTab school={school} /> : null}
      {activeTab === "Attendance" ? <AttendanceTab school={school} /> : null}
      {activeTab === "Reports" ? <ReportsTab school={school} /> : null}
    </div>
  )
}

function OverviewTab({
  isSaving,
  onSave,
  school,
}: {
  isSaving: boolean
  onSave: (input: Record<string, string>) => Promise<void>
  school: NonNullable<ReturnType<typeof useSuperAdminSchool>["data"]>
}) {
  const [form, setForm] = useState({
    adminEmail: school.admin?.email ?? "",
    adminName: school.admin?.name ?? "",
    adminPhone: school.admin?.phone ?? "",
    city: school.city ?? "",
    contactEmail: school.contact.email,
    contactName: school.contact.name,
    contactPhone: school.contact.phone,
    contactRole: school.contact.role,
    email: school.email ?? "",
    name: school.name,
    phone: school.phone ?? "",
    region: school.region ?? "",
  })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(form)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="grid gap-4 md:grid-cols-4">
        <StatTile
          icon="groups"
          label="Students"
          value={school._count.students}
        />
        <StatTile
          icon="badge"
          label="Teachers"
          value={school._count.teachers}
        />
        <StatTile icon="school" label="Classes" value={school._count.classes} />
        <StatTile
          icon="fingerprint"
          label="Devices"
          value={school._count.biometricDevices}
        />
      </section>

      <form onSubmit={handleSubmit} className="recordit-card p-6 xl:col-span-1">
        <h2 className="text-xl font-bold text-primary">Core Profile</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["name", "School Name"],
            ["email", "School Email"],
            ["phone", "School Phone"],
            ["region", "Region"],
            ["city", "City"],
            ["contactName", "Contact Name"],
            ["contactRole", "Contact Role"],
            ["contactPhone", "Contact Phone"],
            ["contactEmail", "Contact Email"],
            ["adminName", "Admin Name"],
            ["adminEmail", "Admin Email"],
            ["adminPhone", "Admin Phone"],
          ].map(([field, label]) => (
            <label
              key={field}
              className="grid gap-2 text-sm font-semibold text-on-surface-variant"
            >
              {label}
              <Input
                value={form[field as keyof typeof form]}
                onChange={(event) =>
                  updateField(field as keyof typeof form, event.target.value)
                }
              />
            </label>
          ))}
        </div>
        <Button type="submit" className="mt-5" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <aside className="recordit-card h-fit p-6">
        <h2 className="text-xl font-bold text-primary">System Health</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <Info label="Users" value={school._count.users} />
          <Info
            label="Attendance Records"
            value={school._count.attendanceRecords}
          />
          <Info label="Reports" value={school._count.reports} />
          <Info label="Country" value={school.country} />
        </div>
      </aside>
    </div>
  )
}

function UsersTab({ school }: DetailTabProps) {
  return (
    <SimpleTable
      rows={school.users}
      columns={["name", "email", "role", "status"]}
    />
  )
}

function ClassesTab({ school }: DetailTabProps) {
  return (
    <SimpleTable
      rows={school.classes.map((item) => ({
        ...item,
        students: item._count.students,
      }))}
      columns={["name", "code", "level", "students"]}
    />
  )
}

function StudentsTab({ school }: DetailTabProps) {
  return (
    <SimpleTable
      rows={school.students.map((item) => ({
        ...item,
        className: item.class?.name ?? "Unassigned",
        name: `${item.firstName} ${item.lastName}`,
        status: item.isActive ? "Active" : "Inactive",
      }))}
      columns={["studentNumber", "name", "gender", "className", "status"]}
    />
  )
}

function AttendanceTab({ school }: DetailTabProps) {
  return (
    <SimpleTable
      rows={school.attendanceSessions.map((item) => ({
        ...item,
        className: item.class?.name ?? "All classes",
        records: item._count.records,
      }))}
      columns={["title", "className", "status", "records"]}
    />
  )
}

function ReportsTab({ school }: DetailTabProps) {
  return (
    <SimpleTable
      rows={school.reports}
      columns={["title", "type", "startDate", "endDate"]}
    />
  )
}

type DetailTabProps = {
  school: NonNullable<ReturnType<typeof useSuperAdminSchool>["data"]>
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: Array<Record<string, unknown>>
}) {
  return (
    <section className="recordit-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-6 py-3">
                  {column.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-on-surface-variant"
                >
                  No records yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={String(row.id ?? index)}
                  className="border-t border-outline-variant"
                >
                  {columns.map((column) => (
                    <td key={column} className="px-6 py-4">
                      {formatCell(row[column])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between gap-4 rounded-lg bg-surface-container-low p-4">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function formatCell(value: unknown) {
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString()
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  return value == null ? "—" : String(value)
}
