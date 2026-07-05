"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
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
  useSuperAdminSchools,
  useSuspendSuperAdminSchool,
} from "@/services/super-admin/schools"
import type { SchoolStatus } from "@/types"

export function SchoolsManagement() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<SchoolStatus | "ALL">("ALL")
  const params = useMemo(
    () => ({ page: 1, pageSize: 20, search, status }),
    [search, status]
  )
  const { data, error, isLoading } = useSuperAdminSchools(params)
  const approve = useApproveSuperAdminSchool()
  const suspend = useSuspendSuperAdminSchool()
  const reactivate = useReactivateSuperAdminSchool()

  async function runAction(
    action: "approve" | "suspend" | "reactivate",
    schoolId: string
  ) {
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
        eyebrow="Schools"
        title="Schools Directory"
        description="Review onboarding submissions, manage active schools, and lock or reactivate institutions."
        actions={
          <Button asChild>
            <Link href="/onboarding/step-1">Add New School</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile
          icon="verified"
          label="Active Schools"
          value={data?.summary.ACTIVE ?? 0}
        />
        <StatTile
          icon="pending"
          label="Pending Approval"
          value={data?.summary.PENDING ?? 0}
        />
        <StatTile
          icon="block"
          label="Suspended"
          value={data?.summary.SUSPENDED ?? 0}
        />
      </section>

      <section className="recordit-card overflow-hidden">
        <div className="grid gap-3 border-b border-outline-variant p-5 md:grid-cols-[1fr_180px_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by school name, code, city, or region..."
          />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as SchoolStatus | "ALL")
            }
            className="h-12 rounded-lg bg-input px-3 text-sm font-semibold"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("")
              setStatus("ALL")
            }}
          >
            Clear Filters
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-destructive">{error.message}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase">
              <tr>
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Usage</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-on-surface-variant"
                  >
                    Loading schools...
                  </td>
                </tr>
              ) : null}
              {data?.schools.map((school) => (
                <tr key={school.id} className="border-t border-outline-variant">
                  <td className="px-6 py-4">
                    <Link
                      href={`/super-admin/schools/${school.id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {school.name}
                    </Link>
                    <p className="text-xs text-on-surface-variant">
                      {school.code}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">
                      {school.admin?.name ?? "No admin"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {school.admin?.email ?? school.email}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {[school.city, school.region].filter(Boolean).join(", ") ||
                      "Ghana"}
                  </td>
                  <td className="px-6 py-4">
                    {school._count.students} students / {school._count.classes}{" "}
                    classes
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={school.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <IconLink
                        href={`/super-admin/schools/${school.id}`}
                        icon="visibility"
                        label="View details"
                      />
                      {school.status === "PENDING" ? (
                        <IconButton
                          icon="check_circle"
                          label="Approve"
                          onClick={() => runAction("approve", school.id)}
                        />
                      ) : null}
                      {school.status === "ACTIVE" ? (
                        <IconButton
                          icon="block"
                          label="Suspend"
                          onClick={() => runAction("suspend", school.id)}
                        />
                      ) : null}
                      {school.status === "SUSPENDED" ? (
                        <IconButton
                          icon="verified"
                          label="Reactivate"
                          onClick={() => runAction("reactivate", school.id)}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.schools.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-on-surface-variant"
                  >
                    No schools match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="grid size-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary"
    >
      <MaterialSymbol icon={icon} />
    </button>
  )
}

function IconLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      title={label}
      className="grid size-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary"
    >
      <MaterialSymbol icon={icon} />
    </Link>
  )
}
