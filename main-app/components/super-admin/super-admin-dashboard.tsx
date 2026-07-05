"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useSuperAdminDashboard } from "@/services/super-admin/dashboard"
import {
  PageHeader,
  StatTile,
  StatusBadge,
} from "@/components/super-admin/super-admin-ui"

export function SuperAdminDashboard() {
  const { data, error, isLoading } = useSuperAdminDashboard()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="recordit-card p-6 text-destructive">{error.message}</div>
    )
  }

  const metrics = data!.metrics

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Welcome back, Super Admin"
        description="Oversee school onboarding, attendance growth, platform health, and approval activity across RecordIT."
        actions={
          <>
            <Button asChild>
              <Link href="/super-admin/schools">View Schools</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/onboarding/step-1">Open Onboarding</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon="school"
          label="Total Schools"
          value={metrics.totalSchools}
        />
        <StatTile
          icon="verified"
          label="Active Schools"
          value={metrics.activeSchools}
        />
        <StatTile
          icon="pending"
          label="Pending Approval"
          value={metrics.pendingSchools}
        />
        <StatTile
          icon="block"
          label="Suspended"
          value={metrics.suspendedSchools}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="recordit-card p-6">
          <h2 className="text-xl font-bold text-primary">
            Attendance Activity
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile
              icon="groups"
              label="Students"
              value={metrics.totalStudents}
            />
            <StatTile
              icon="badge"
              label="Teachers"
              value={metrics.totalTeachers}
            />
            <StatTile
              icon="analytics"
              label="Attendance Records"
              value={metrics.attendanceRecords}
            />
          </div>
        </div>

        <div className="recordit-card p-6">
          <h2 className="text-xl font-bold text-primary">Schools by Status</h2>
          <div className="mt-6 grid gap-3">
            {[
              ["Active", metrics.activeSchools],
              ["Pending", metrics.pendingSchools],
              ["Suspended", metrics.suspendedSchools],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-surface-container-low p-4"
              >
                <span className="font-semibold">{label}</span>
                <span className="text-2xl font-bold text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="recordit-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-6">
          <h2 className="text-xl font-bold text-primary">
            Recent Onboarding Activity
          </h2>
          <Button asChild variant="link">
            <Link href="/super-admin/schools">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase">
              <tr>
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.recentSchools.map((school) => (
                <tr key={school.id} className="border-t border-outline-variant">
                  <td className="px-6 py-4 font-semibold">
                    <Link href={`/super-admin/schools/${school.id}`}>
                      {school.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{school.code}</td>
                  <td className="px-6 py-4">
                    {[school.city, school.region].filter(Boolean).join(", ") ||
                      "Ghana"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={school.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse rounded-xl bg-surface-container" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-surface-container"
          />
        ))}
      </div>
    </div>
  )
}
