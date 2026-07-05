"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  InputField,
  PageHeader,
  PlaceholderPage,
  SelectField,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/school-admin/school-admin-ui"
import {
  useAcademicSetup,
  useAdminDashboard,
  useAdminClasses,
  useAdminOptions,
  useAdminParent,
  useAdminParents,
  useAdminPatch,
  useAdminPost,
  useAdminSettings,
  useAdminStudent,
  useAdminStudents,
  useAdminTeacher,
  useAdminTeachers,
  useAdminUsers,
  useBulkImportStudents,
} from "@/services/admin/admin"

type R = Record<string, unknown>

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

function list(value: unknown): R[] {
  return Array.isArray(value) ? (value as R[]) : []
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

function obj(value: unknown): R {
  return value && typeof value === "object" ? (value as R) : {}
}

function submitData(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = event.currentTarget
  const data = Object.fromEntries(new FormData(form).entries())
  return { data, form }
}

function pendingText(pending: boolean, idle: string, loading = "Saving...") {
  return pending ? loading : idle
}

function errorMessage(error: unknown, fallback = "Request failed") {
  return error instanceof Error ? error.message : fallback
}

function useOptions() {
  const { data } = useAdminOptions()
  return {
    classes: list(data?.classes),
    guardians: list(data?.guardians),
    students: list(data?.students),
    teachers: list(data?.teachers),
    years: list(data?.years),
  }
}

export function SchoolAdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard()
  const metrics = obj(data?.metrics)
  const alerts = obj(data?.alerts)
  const trend = list(data?.trend)
  const activity = list(data?.recentActivity)

  return (
    <div>
      <PageHeader
        breadcrumb={`${date(new Date())} / ${text(data?.academicTerm, "Term")}`}
        title="Good morning, Administrator"
        description={`${text(data?.schoolName, "RecordIT School")} attendance, people, and setup overview.`}
        actions={
          <>
            <Button asChild><Link href="/admin/students/register"><MaterialSymbol icon="person_add" />Register Student</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/reports"><MaterialSymbol icon="download" />Generate Report</Link></Button>
          </>
        }
      />
      {isLoading ? <p>Loading dashboard...</p> : null}
      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" icon="analytics" label="Attendance Today" value={`${text(metrics.attendanceToday, "0")}%`} helper="Live" />
        <StatCard icon="groups" label="Total Students" value={text(metrics.totalStudents, "0")} />
        <StatCard icon="person" label="Total Teachers" value={text(metrics.totalTeachers, "0")} />
        <StatCard icon="family_restroom" label="Parents/Guardians" value={text(metrics.totalParents, "0")} />
        <StatCard icon="class" label="Total Classes" value={text(metrics.totalClasses, "0")} />
        <StatCard icon="event_busy" label="Absentees Today" value={text(metrics.absenteesToday, "0")} />
        <StatCard icon="schedule" label="Late Students Today" value={text(metrics.lateStudentsToday, "0")} />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#00113a]">Weekly Attendance Trend</h2>
            <span className="text-sm text-on-surface-variant">{text(data?.academicYear)}</span>
          </div>
          <div className="flex h-64 items-end gap-3">
            {trend.map((item) => (
              <div key={text(item.label)} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full items-end rounded-lg bg-surface-container">
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
        <div className="grid gap-4">
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["/admin/students/register", "person_add", "Register Student"],
                ["/admin/teachers/new", "person", "Add Teacher"],
                ["/admin/parents/new", "family_restroom", "Add Parent"],
                ["/admin/classes/new", "class", "Create Class"],
                ["/admin/attendance", "fingerprint", "Start Attendance"],
                ["/admin/reports", "analytics", "Generate Report"],
              ].map(([href, icon, label]) => (
                <Link key={href} href={href} className="rounded-xl bg-surface-container p-4 text-center text-sm font-semibold hover:bg-surface-container-high">
                  <MaterialSymbol icon={icon} className="mx-auto mb-2 text-[26px] text-primary" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-bold">Alerts</h2>
            <div className="space-y-3 text-sm">
              <p>{text(alerts.noFingerprint, "0")} students without fingerprint enrollment</p>
              <p>{text(alerts.classesWithoutTeachers, "0")} classes without assigned teachers</p>
              <p>{text(alerts.openSessions, "0")} attendance sessions not closed</p>
            </div>
          </div>
        </div>
      </section>
      <TableShell title={<h2 className="text-xl font-bold">Recent Activity</h2>}>
        <div className="divide-y divide-outline-variant">
          {activity.length ? activity.map((item) => (
            <div key={text(item.id)} className="flex items-start gap-3 p-5">
              <span className="mt-1 size-2 rounded-full bg-primary" />
              <div>
                <p className="font-semibold">{text(item.description, text(item.entity))}</p>
                <p className="text-xs text-on-surface-variant">{date(item.createdAt)} / {text(item.action)}</p>
              </div>
            </div>
          )) : <div className="p-5 text-on-surface-variant">No recent activity yet.</div>}
        </div>
      </TableShell>
    </div>
  )
}

export function AcademicSetupPage() {
  const { data } = useAcademicSetup()
  const years = list(data?.academicYears)
  const terms = list(data?.academicTerms)
  const classes = list(data?.classes)
  const [editingYear, setEditingYear] = useState<R | null>(null)
  const [editingTerm, setEditingTerm] = useState<R | null>(null)
  const createYear = useAdminPost("/admin/academic-years")
  const createTerm = useAdminPost("/admin/academic-terms")
  const updateYear = useAdminPatch(`/admin/academic-years/${text(editingYear?.id)}`)
  const updateTerm = useAdminPatch(`/admin/academic-terms/${text(editingTerm?.id)}`)
  const savingYear = createYear.isPending || updateYear.isPending
  const savingTerm = createTerm.isPending || updateTerm.isPending

  async function onSubmit(path: "year" | "term", event: FormEvent<HTMLFormElement>) {
    const { data: form, form: element } = submitData(event)
    try {
      if (path === "year") {
        await (editingYear ? updateYear : createYear).mutateAsync(form)
        setEditingYear(null)
      } else {
        await (editingTerm ? updateTerm : createTerm).mutateAsync(form)
        setEditingTerm(null)
      }

      toast.success(path === "year" ? "Academic year saved" : "Academic term saved")
      element.reset()
    } catch (error) {
      toast.error(errorMessage(error, "Academic setup could not be saved"))
    }
  }

  return (
    <div>
      <PageHeader title="Academic Setup" description="Manage academic years, terms, and the class foundation used by attendance workflows." />
      <section className="grid gap-6 xl:grid-cols-2">
        <form
          key={editingYear ? text(editingYear.id) : "new-year"}
          onSubmit={(e) => onSubmit("year", e)}
          className="rounded-xl border border-outline-variant bg-white p-6 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Academic Years</h2>
            {editingYear ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingYear(null)}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InputField name="name" label="Academic Year Name" placeholder="2026/2027" defaultValue={text(editingYear?.name)} />
            <InputField name="startsAt" label="Start Date" type="date" defaultValue={dateInput(editingYear?.startsAt)} />
            <InputField name="endsAt" label="End Date" type="date" defaultValue={dateInput(editingYear?.endsAt)} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={Boolean(editingYear?.isActive) || years.length === 0}
              className="size-4 accent-primary"
            />
            Set as active academic year
          </label>
          {years.length === 0 ? (
            <p className="mt-2 text-xs text-on-surface-variant">
              The first academic year is automatically active.
            </p>
          ) : null}
          <Button className="mt-4" disabled={savingYear}>
            {pendingText(savingYear, editingYear ? "Save Academic Year" : "Add Academic Year")}
          </Button>
          <div className="mt-6 divide-y divide-outline-variant">
            {years.length ? years.map((year) => (
              <div key={text(year.id)} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-semibold">{text(year.name)}</p><p className="text-xs text-on-surface-variant">{date(year.startsAt)} - {date(year.endsAt)}</p></div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={Boolean(year.isActive)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingYear(year)}>
                    Edit
                  </Button>
                </div>
              </div>
            )) : <p className="text-on-surface-variant">No academic year has been created yet.</p>}
          </div>
        </form>
        <form
          key={editingTerm ? text(editingTerm.id) : "new-term"}
          onSubmit={(e) => onSubmit("term", e)}
          className="rounded-xl border border-outline-variant bg-white p-6 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Academic Terms</h2>
            {editingTerm ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTerm(null)}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField name="academicYearId" label="Academic Year" defaultValue={text(editingTerm?.academicYearId)}>
              <option value="">Select year</option>
              {years.map((year) => <option key={text(year.id)} value={text(year.id)}>{text(year.name)}</option>)}
            </SelectField>
            <InputField name="name" label="Term Name" placeholder="Term 1" defaultValue={text(editingTerm?.name)} />
            <InputField name="startsAt" label="Start Date" type="date" defaultValue={dateInput(editingTerm?.startsAt)} />
            <InputField name="endsAt" label="End Date" type="date" defaultValue={dateInput(editingTerm?.endsAt)} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={Boolean(editingTerm?.isActive) || terms.length === 0}
              className="size-4 accent-primary"
            />
            Set as active term
          </label>
          <p className="mt-2 text-xs text-on-surface-variant">
            Only one term can be active at a time. Marking this term active will make the others inactive.
          </p>
          <Button className="mt-4" disabled={savingTerm}>
            {pendingText(savingTerm, editingTerm ? "Save Term" : "Add Term")}
          </Button>
          <div className="mt-6 divide-y divide-outline-variant">
            {terms.length ? terms.map((term) => (
              <div key={text(term.id)} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-semibold">{text(term.name)}</p><p className="text-xs text-on-surface-variant">{text(obj(term.academicYear).name)} / {date(term.startsAt)}</p></div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={Boolean(term.isActive)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingTerm(term)}>
                    Edit
                  </Button>
                </div>
              </div>
            )) : <p className="text-on-surface-variant">No terms created yet.</p>}
          </div>
        </form>
      </section>
      <div className="mt-6">
        <ClassesTable classes={classes} />
      </div>
    </div>
  )
}

function ClassesTable({ classes }: { classes: R[] }) {
  return (
    <TableShell title={<div className="flex items-center justify-between"><h2 className="text-xl font-bold">Classes</h2><Button asChild><Link href="/admin/classes/new">Create Class</Link></Button></div>}>
      {classes.length ? (
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-primary-container text-white">
            <tr>{["Class Name", "Class Code", "Level", "Assigned Teacher", "Students", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {classes.map((item) => {
              const teacher = obj(list(item.teacherAssignments)[0]?.teacher)
              return (
                <tr key={text(item.id)}>
                  <td className="p-4 font-semibold">{text(item.name)}</td>
                  <td className="p-4">{text(item.code, "-")}</td>
                  <td className="p-4">{text(item.level, "-")}</td>
                  <td className="p-4">{text(obj(teacher.user).name, "Unassigned")}</td>
                  <td className="p-4">{text(obj(item._count).students, "0")}</td>
                  <td className="p-4"><Button asChild variant="outline" size="sm"><Link href={`/admin/classes/${text(item.id)}`}>View</Link></Button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : <div className="p-6"><EmptyState title="No classes created yet" message="Create your first class to begin student registration." /></div>}
    </TableShell>
  )
}

export function ClassesPage() {
  const { data } = useAdminClasses()
  return <div><PageHeader title="Classes" description="Create, view, and manage school classes." /><ClassesTable classes={list(data?.classes)} /></div>
}

export function ClassFormPage() {
  const params = useParams<{ classId?: string }>()
  const router = useRouter()
  const { years, teachers } = useOptions()
  const create = useAdminPost("/admin/classes")
  const update = useAdminPatch(`/admin/classes/${params.classId}`)
  const isEdit = Boolean(params.classId)
  const saving = isEdit ? update.isPending : create.isPending

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const { data } = submitData(event)
    try {
      await (isEdit ? update : create).mutateAsync(data)
      toast.success(isEdit ? "Class updated" : "Class created")
      router.push("/admin/classes")
    } catch (error) {
      toast.error(errorMessage(error, "Class could not be saved"))
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Class" : "Create Class"} description="Keep the class profile short and easy to scan." />
      <form onSubmit={onSubmit} className="grid max-w-4xl gap-5 rounded-xl border border-outline-variant bg-white p-6 shadow-card md:grid-cols-2">
        <InputField name="name" label="Class Name" placeholder="Grade 10 - A" />
        <InputField name="code" label="Class Code" placeholder="G10-A" />
        <InputField name="level" label="Level" placeholder="Grade 10" />
        <SelectField name="academicYearId" label="Academic Year"><option value="">Select year</option>{years.map((year) => <option key={text(year.id)} value={text(year.id)}>{text(year.name)}</option>)}</SelectField>
        <SelectField name="assignedTeacherId" label="Assigned Teacher"><option value="">Unassigned</option>{teachers.map((teacher) => <option key={text(teacher.id)} value={text(teacher.id)}>{text(obj(teacher.user).name)}</option>)}</SelectField>
        <InputField name="description" label="Description" placeholder="Optional class notes" className="md:col-span-2" />
        <div className="flex gap-3 md:col-span-2">
          <Button disabled={saving}>
            {pendingText(saving, "Save Class")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/classes">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

export function StudentsDirectoryPage() {
  const [search, setSearch] = useState("")
  const { data } = useAdminStudents(search ? { search } : undefined)
  const students = list(data?.students)

  return (
    <div>
      <PageHeader title="Students Directory" breadcrumb="Dashboard / Students" actions={<><Button asChild><Link href="/admin/students/register"><MaterialSymbol icon="person_add" />Register Student</Link></Button><Button asChild variant="outline"><Link href="/admin/students/bulk-import"><MaterialSymbol icon="upload_file" />Bulk Import</Link></Button></>} />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-full bg-white px-5 shadow-card outline-none" placeholder="Search by student name, ID, or class..." />
        <Button variant="outline">Export Data</Button>
      </div>
      <TableShell footer={`Showing ${students.length} students`}>
        {students.length ? (
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-primary-container text-white"><tr>{["Photo", "Student Name", "Student ID", "Class", "Fingerprint", "Status Today", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-outline-variant">
              {students.map((student) => (
                <tr key={text(student.id)}>
                  <td className="p-4"><div className="grid size-12 place-items-center overflow-hidden rounded-lg bg-surface-container">{student.photoUrl ? <img src={text(student.photoUrl)} alt="" className="size-full object-cover" /> : <MaterialSymbol icon="person" />}</div></td>
                  <td className="p-4"><p className="font-bold">{text(student.firstName)} {text(student.lastName)}</p><p className="text-xs text-on-surface-variant">{text(student.gender)}</p></td>
                  <td className="p-4">{text(student.studentNumber)}</td>
                  <td className="p-4">{text(obj(student.class).name, "Unassigned")}</td>
                  <td className="p-4"><StatusBadge status={list(student.fingerprints).length ? "ENROLLED" : "NOT ENROLLED"} /></td>
                  <td className="p-4"><StatusBadge status={Boolean(student.isActive)} /></td>
                  <td className="p-4"><div className="flex gap-2"><Button asChild size="icon-sm" variant="ghost"><Link href={`/admin/students/${text(student.id)}`}><MaterialSymbol icon="visibility" /></Link></Button><Button asChild size="icon-sm" variant="ghost"><Link href={`/admin/students/${text(student.id)}/fingerprint`}><MaterialSymbol icon="fingerprint" /></Link></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="p-6"><EmptyState title="No students found" message="Register a student or import a CSV/XLSX file to start building the directory." /></div>}
      </TableShell>
    </div>
  )
}

export function StudentRegisterPage() {
  const router = useRouter()
  const { classes, guardians } = useOptions()
  const create = useAdminPost("/admin/students")
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)

  async function uploadPhoto(file: File) {
    setPhotoUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("purpose", "studentPhoto")
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData })
      const payload = await res.json()
      if (payload.success) setPhotoUrl(payload.data.secure_url)
      else toast.error(payload.message || "Photo upload failed")
    } finally {
      setPhotoUploading(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const { data } = submitData(event)
    try {
      await create.mutateAsync({ ...data, photoUrl })
      toast.success("Student registered")
      router.push("/admin/students")
    } catch (error) {
      toast.error(errorMessage(error, "Student could not be registered"))
    }
  }

  return (
    <div>
      <PageHeader breadcrumb="Students / Register Student" title="Register Student" description="Enroll a new student into the biometric attendance system." />
      <form onSubmit={onSubmit} className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
        <div className="mb-8 flex items-center justify-between gap-3 text-center text-sm font-semibold text-on-surface-variant">
          {["Student Info", "Class Assignment", "Parent Link", "Biometric"].map((step, index) => <div key={step} className="flex-1"><span className={`mx-auto mb-2 grid size-10 place-items-center rounded-full ${index === 0 ? "bg-primary text-white" : "bg-surface-container"}`}>{index + 1}</span>{step}</div>)}
        </div>
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div>
            <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low text-center text-on-surface-variant">
              {photoUrl ? <img src={photoUrl} alt="" className="size-full rounded-2xl object-cover" /> : <><MaterialSymbol icon={photoUploading ? "progress_activity" : "add_a_photo"} className={`mb-2 text-[42px] ${photoUploading ? "animate-spin" : ""}`} /><span>{photoUploading ? "Uploading..." : "Upload Student Portrait"}</span></>}
              <input className="hidden" type="file" accept="image/*" disabled={photoUploading} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
            </label>
            <p className="mt-3 text-center text-xs italic text-on-surface-variant">Formal portrait required for institutional security identification cards.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <InputField name="firstName" label="First Name" placeholder="Michael" />
            <InputField name="lastName" label="Last Name" placeholder="Thompson" />
            <InputField name="otherName" label="Other Name (Optional)" />
            <InputField name="studentNumber" label="Student ID Number" placeholder="CH-2026-0001" />
            <SelectField name="gender" label="Gender"><option value="">Select Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></SelectField>
            <InputField name="dateOfBirth" label="Date of Birth" type="date" />
            <SelectField name="classId" label="Class Assignment"><option value="">Unassigned</option>{classes.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.name)}</option>)}</SelectField>
            <SelectField name="guardianId" label="Parent/Guardian"><option value="">No link yet</option>{guardians.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(obj(item.user).name)}</option>)}</SelectField>
            <InputField name="guardianRelationship" label="Guardian Relationship" placeholder="Mother" />
            <div className="rounded-xl border border-secondary-container/20 bg-surface-container-low p-4 md:col-span-2"><p className="font-bold text-primary">Identity Verification</p><p className="text-sm text-on-surface-variant">Ensure all data matches the student&apos;s legal documents. Biometric enrollment will be handled later.</p></div>
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <Button asChild variant="ghost">
            <Link href="/admin/students">Cancel Registration</Link>
          </Button>
          <Button disabled={create.isPending || photoUploading}>
            {pendingText(create.isPending, "Save Student")}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function BulkImportPage() {
  const importer = useBulkImportStudents()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<R[]>([])
  const [bulkAction, setBulkAction] = useState<"validate" | "import" | null>(null)

  async function validate(commit: boolean) {
    if (!file) return toast.error("Choose a CSV or XLSX file first")
    setBulkAction(commit ? "import" : "validate")
    try {
      const result = await importer.mutateAsync({ file, commit })
      setPreview(list(result.preview))
      toast.success(commit ? "Students imported" : "Records validated")
    } catch (error) {
      toast.error(errorMessage(error, "Student import failed"))
    } finally {
      setBulkAction(null)
    }
  }

  return (
    <div>
      <PageHeader title="Bulk Student Import" description="Upload, validate, and commit student records in one controlled flow." />
      <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
          <MaterialSymbol icon="upload_file" className="mb-4 text-[54px] text-primary" />
          <h2 className="text-2xl font-bold">Drag and drop CSV or XLSX file here</h2>
          <p className="mt-2 text-on-surface-variant">Maximum file size: 25MB. Maximum 500 records per import.</p>
          <Button type="button" className="mt-6">Upload File</Button>
          <input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? <p className="mt-4 font-semibold text-primary">{file.name}</p> : null}
        </label>
        <div className="rounded-xl bg-secondary-container p-6 text-white shadow-card">
          <h2 className="text-2xl font-bold">Need Help?</h2>
          <p className="mt-2 text-white/80">Headers: StudentID, FirstName, LastName, Gender, Grade.</p>
        </div>
      </section>
      <div className="mb-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => validate(false)} disabled={importer.isPending}>
          {bulkAction === "validate" ? "Validating..." : "Validate Records"}
        </Button>
        <Button onClick={() => validate(true)} disabled={importer.isPending || !preview.length || preview.some((r) => list(r.issues).length)}>
          {bulkAction === "import" ? "Importing..." : "Import Students"}
        </Button>
      </div>
      <TableShell title={<h2 className="text-xl font-bold">Data Preview & Validation</h2>}>
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-surface-container"><tr>{["Status", "Student ID", "First Name", "Last Name", "Grade/Section", "Issue"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-outline-variant">
            {preview.map((row) => {
              const issues = list(row.issues).map((issue) => text(issue)).join(", ")
              return <tr key={text(row.index)} className={issues ? "bg-red-50" : ""}><td className="p-4"><StatusBadge status={issues ? "ERROR" : "ACTIVE"} /></td><td className="p-4">{text(row.studentNumber)}</td><td className="p-4">{text(row.firstName)}</td><td className="p-4">{text(row.lastName)}</td><td className="p-4">{text(row.grade)}</td><td className="p-4 text-destructive">{issues || "-"}</td></tr>
            })}
          </tbody>
        </table>
      </TableShell>
    </div>
  )
}

export function StudentProfilePage() {
  const params = useParams<{ studentId: string }>()
  const { data } = useAdminStudent(params.studentId)
  const student = obj(data?.student)
  const guardian = obj(obj(list(student.guardians)[0]).guardian)
  const records = list(student.attendanceRecords)

  return (
    <div>
      <PageHeader title="Student Profile" breadcrumb={`Students / ${text(student.firstName)} ${text(student.lastName)}`} actions={<Button asChild><Link href={`/admin/students/${params.studentId}/fingerprint`}><MaterialSymbol icon="fingerprint" />Re-enroll Fingerprint</Link></Button>} />
      <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card md:flex md:gap-8">
          <div className="grid size-48 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-container">{student.photoUrl ? <img src={text(student.photoUrl)} alt="" className="size-full object-cover" /> : <MaterialSymbol icon="person" className="text-[54px]" />}</div>
          <div className="mt-5 md:mt-0"><h2 className="text-3xl font-bold text-[#00113a]">{text(student.firstName)} {text(student.lastName)}</h2><p className="font-mono text-on-surface-variant">ID: {text(student.studentNumber)}</p><div className="mt-6 grid gap-4 md:grid-cols-3"><Info label="Class" value={text(obj(student.class).name, "Unassigned")} /><Info label="Gender" value={text(student.gender)} /><Info label="Date of Birth" value={date(student.dateOfBirth)} /><Info label="Biometric Status" value={list(student.fingerprints).length ? "Enrolled" : "Not enrolled"} /><Info label="Status" value={student.isActive ? "Active" : "Inactive"} /></div></div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold">Guardian Contact</h2>
          {guardian.id ? <><p className="font-bold">{text(obj(guardian.user).name)}</p><p className="text-sm text-on-surface-variant">{text(guardian.relationship)}</p><p className="mt-4">{text(obj(guardian.user).phone)}</p><p>{text(obj(guardian.user).email)}</p></> : <p>No guardian linked yet.</p>}
        </div>
      </section>
      <TableShell title={<h2 className="text-xl font-bold">Recent Attendance Logs</h2>}>
        <table className="w-full min-w-[780px] text-left"><thead className="bg-surface-container"><tr>{["Date", "Session", "Class/Room", "Status", "Time Marked"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-outline-variant">{records.map((record) => <tr key={text(record.id)}><td className="p-4">{date(record.markedAt)}</td><td className="p-4">{text(obj(record.session).title)}</td><td className="p-4">{text(obj(obj(record.session).class).name)}</td><td className="p-4"><StatusBadge status={text(record.status)} /></td><td className="p-4">{new Date(String(record.markedAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td></tr>)}</tbody></table>
      </TableShell>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold tracking-[0.12em] text-on-surface-variant uppercase">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>
}

export function TeachersListPage() {
  const { data, isLoading } = useAdminTeachers()
  const teachers = list(data?.teachers)

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="View teacher profiles, assigned classes, and account status before creating a new teacher."
        actions={
          <Button asChild>
            <Link href="/admin/teachers/new">
              <MaterialSymbol icon="person_add" />
              Add Teacher
            </Link>
          </Button>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading teachers...</p> : null}
      <TableShell footer={`Showing ${teachers.length} teachers`}>
        {teachers.length ? (
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-primary-container text-white">
              <tr>{["Teacher", "Staff Number", "Department", "Assigned Classes", "Status", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {teachers.map((teacher) => {
                const user = obj(teacher.user)
                const assignments = list(teacher.classAssignments)

                return (
                  <tr key={text(teacher.id)}>
                    <td className="p-4">
                      <p className="font-bold">{text(user.name)}</p>
                      <p className="text-sm text-on-surface-variant">{text(user.email)}</p>
                    </td>
                    <td className="p-4">{text(teacher.staffNumber, "-")}</td>
                    <td className="p-4">{text(teacher.department, "-")}</td>
                    <td className="p-4">{assignments.map((item) => text(obj(item.class).name)).filter(Boolean).join(", ") || "Unassigned"}</td>
                    <td className="p-4"><StatusBadge status={text(user.status)} /></td>
                    <td className="p-4">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/teachers/${text(teacher.id)}`}>View Profile</Link>
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
              title="No teachers added yet"
              message="Create teacher accounts before assigning classes and attendance sessions."
              action={<Button asChild><Link href="/admin/teachers/new">Add Teacher</Link></Button>}
            />
          </div>
        )}
      </TableShell>
    </div>
  )
}

export function ParentsListPage() {
  const { data, isLoading } = useAdminParents()
  const guardians = list(data?.guardians)

  return (
    <div>
      <PageHeader
        title="Parents/Guardians"
        description="Manage guardian contacts, linked children, and parent access to attendance records."
        actions={
          <Button asChild>
            <Link href="/admin/parents/new">
              <MaterialSymbol icon="person_add" />
              Add Parent/Guardian
            </Link>
          </Button>
        }
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading parents and guardians...</p> : null}
      <TableShell footer={`Showing ${guardians.length} parents/guardians`}>
        {guardians.length ? (
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-primary-container text-white">
              <tr>{["Guardian", "Phone", "Relationship", "Linked Students", "Status", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {guardians.map((guardian) => {
                const user = obj(guardian.user)
                const students = list(guardian.students)

                return (
                  <tr key={text(guardian.id)}>
                    <td className="p-4">
                      <p className="font-bold">{text(user.name)}</p>
                      <p className="text-sm text-on-surface-variant">{text(user.email)}</p>
                    </td>
                    <td className="p-4">{text(user.phone, "-")}</td>
                    <td className="p-4">{text(guardian.relationship, "-")}</td>
                    <td className="p-4">{students.map((item) => {
                      const student = obj(item.student)
                      return `${text(student.firstName)} ${text(student.lastName)}`.trim()
                    }).filter(Boolean).join(", ") || "No linked student"}</td>
                    <td className="p-4"><StatusBadge status={text(user.status)} /></td>
                    <td className="p-4">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/parents/${text(guardian.id)}`}>View Profile</Link>
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
              title="No parents or guardians yet"
              message="Create guardian accounts and link them to students so they can view attendance records."
              action={<Button asChild><Link href="/admin/parents/new">Add Parent/Guardian</Link></Button>}
            />
          </div>
        )}
      </TableShell>
    </div>
  )
}

export function TeacherFormPage() {
  return <PersonForm role="teacher" />
}

export function ParentFormPage() {
  return <PersonForm role="parent" />
}

function PersonForm({ role }: { role: "teacher" | "parent" }) {
  const router = useRouter()
  const { classes, students } = useOptions()
  const create = useAdminPost(role === "teacher" ? "/admin/teachers" : "/admin/parents")
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const { data } = submitData(event)
    try {
      const result = await create.mutateAsync(data)
      const password = text(result.temporaryPassword)
      toast.success(`${role === "teacher" ? "Teacher" : "Parent/guardian"} added${password ? ` / temp password: ${password}` : ""}`)
      router.push("/admin/users")
    } catch (error) {
      toast.error(
        errorMessage(
          error,
          role === "teacher"
            ? "Teacher could not be added"
            : "Parent/guardian could not be added"
        )
      )
    }
  }
  return (
    <div>
      <PageHeader title={role === "teacher" ? "Add Teacher" : "Add Parent/Guardian"} description={role === "teacher" ? "Register a teacher and optionally assign them to a class." : "Register a guardian and link them to a student."} />
      <form onSubmit={onSubmit} className="grid max-w-5xl gap-5 rounded-xl border border-outline-variant bg-white p-6 shadow-card md:grid-cols-2">
        <InputField name="firstName" label="First Name" /><InputField name="lastName" label="Last Name" /><InputField name="email" label="Email" type="email" /><InputField name="phone" label="Phone" />
        {role === "teacher" ? <><InputField name="staffNumber" label="Staff Number" /><InputField name="department" label="Department" /><InputField name="title" label="Title" /><SelectField name="assignedClassId" label="Assigned Class"><option value="">No class</option>{classes.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.name)}</option>)}</SelectField></> : <><InputField name="relationship" label="Relationship" /><InputField name="occupation" label="Occupation" /><InputField name="address" label="Address" /><SelectField name="linkedStudentId" label="Linked Student"><option value="">No student</option>{students.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.firstName)} {text(item.lastName)}</option>)}</SelectField></>}
        <SelectField name="status" label="Account Status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></SelectField>
        <div className="flex gap-3 md:col-span-2">
          <Button disabled={create.isPending}>
            {pendingText(
              create.isPending,
              role === "teacher" ? "Save Teacher" : "Save Parent/Guardian"
            )}
          </Button>
          <Button type="reset" variant="outline" disabled={create.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export function TeacherProfilePage() {
  const params = useParams<{ teacherId: string }>()
  const { data } = useAdminTeacher(params.teacherId)
  const teacher = obj(data?.teacher)
  const user = obj(teacher.user)
  const classes = list(teacher.classAssignments)
  const reset = useAdminPatch(`/admin/users/${text(user.id)}/reset-password`)
  return (
    <div>
      <PageHeader title="Teacher Profile" breadcrumb="Teachers / Profile Details" actions={<><Button><MaterialSymbol icon="edit" />Edit Teacher</Button><Button variant="outline" disabled={reset.isPending || !user.id} onClick={async () => { try { const result = await reset.mutateAsync({}); toast.success(`Temporary password: ${text(result.temporaryPassword)}`) } catch (error) { toast.error(errorMessage(error, "Password reset failed")) } }}><MaterialSymbol icon={reset.isPending ? "progress_activity" : "settings_backup_restore"} className={reset.isPending ? "animate-spin" : ""} />{reset.isPending ? "Resetting..." : "Reset Password"}</Button></>} />
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6"><div className="rounded-xl border border-outline-variant bg-white p-8 text-center shadow-card"><div className="mx-auto mb-6 grid size-44 place-items-center rounded-full bg-surface-container"><MaterialSymbol icon="person" className="text-[54px]" /></div><h2 className="text-xl font-bold">{text(user.name)}</h2><p className="mt-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">{text(teacher.title, "Faculty")}</p><div className="mt-6 space-y-3 text-left"><Info label="Staff Number" value={text(teacher.staffNumber, "-")} /><Info label="Department" value={text(teacher.department, "-")} /><Info label="Status" value={text(user.status)} /></div></div></div>
        <div className="space-y-6"><div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card"><h2 className="mb-4 text-xl font-bold">Contact Information</h2><div className="grid gap-5 md:grid-cols-2"><Info label="Email Address" value={text(user.email)} /><Info label="Phone Number" value={text(user.phone, "-")} /></div></div><div className="grid gap-4 md:grid-cols-2"><StatCard tone="dark" icon="badge" label="Attendance Sessions" value={list(teacher.attendanceSessions).length} /><StatCard tone="blue" icon="school" label="Assigned Classes" value={classes.length} /></div><TableShell title={<h2 className="text-xl font-bold">Assigned Classes</h2>}><div className="divide-y divide-outline-variant">{classes.map((item) => { const klass = obj(item.class); return <div key={text(klass.id)} className="flex items-center justify-between p-5"><div><p className="font-bold">{text(klass.name)}</p><p className="text-sm text-on-surface-variant">{text(klass.code)} / {text(klass.level)}</p></div><p className="font-bold">{text(obj(klass._count).students, "0")} Students</p></div>})}</div></TableShell></div>
      </section>
    </div>
  )
}

export function ParentProfilePage() {
  const params = useParams<{ guardianId: string }>()
  const { data } = useAdminParent(params.guardianId)
  const guardian = obj(data?.guardian)
  const user = obj(guardian.user)
  const students = list(guardian.students)
  return (
    <div>
      <PageHeader title="Parent/Guardian Profile" breadcrumb="Parents / Profile" />
      <section className="grid gap-6 lg:grid-cols-[380px_1fr]"><div className="rounded-xl border border-outline-variant bg-white p-8 shadow-card"><h2 className="text-2xl font-bold">{text(user.name)}</h2><p className="mt-2 text-on-surface-variant">{text(guardian.relationship)}</p><div className="mt-6 space-y-4"><Info label="Email" value={text(user.email)} /><Info label="Phone" value={text(user.phone)} /><Info label="Occupation" value={text(guardian.occupation, "-")} /><Info label="Address" value={text(guardian.address, "-")} /></div></div><TableShell title={<h2 className="text-xl font-bold">Linked Children</h2>}><div className="divide-y divide-outline-variant">{students.map((item) => { const student = obj(item.student); return <div key={text(item.id)} className="flex items-center justify-between p-5"><div><p className="font-bold">{text(student.firstName)} {text(student.lastName)}</p><p className="text-sm text-on-surface-variant">{text(student.studentNumber)} / {text(obj(student.class).name)}</p></div><StatusBadge status={Boolean(item.isPrimary)} /></div>})}</div></TableShell></section>
    </div>
  )
}

export function UserManagementPage() {
  const { data } = useAdminUsers()
  const users = list(data?.users)
  const resetPath = (id: string) => `/admin/users/${id}/reset-password`
  return (
    <div>
      <PageHeader title="User Management" description="Configure system access and manage credentials for institutional stakeholders." actions={<Button asChild><Link href="/admin/teachers/new"><MaterialSymbol icon="person_add" />Add User</Link></Button>} />
      <section className="mb-6 grid gap-4 md:grid-cols-4"><StatCard label="Total Users" icon="groups" value={users.length} /><StatCard label="Administrators" icon="shield_person" value={users.filter((u) => text(u.role) === "SCHOOL_ADMIN").length} /><StatCard label="Teachers" icon="person" value={users.filter((u) => text(u.role) === "TEACHER").length} /><StatCard label="Parents/Guardians" icon="family_restroom" value={users.filter((u) => text(u.role) === "PARENT_GUARDIAN").length} /></section>
      <TableShell title={<h2 className="text-xl font-bold">Administrators / Teachers / Parents</h2>}>
        <table className="w-full min-w-[980px] text-left"><thead className="bg-surface-container"><tr>{["User", "Phone", "Role", "Status", "Date Added", "Actions"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-outline-variant">{users.map((user) => <UserRow key={text(user.id)} user={user} resetPath={resetPath(text(user.id))} />)}</tbody></table>
      </TableShell>
    </div>
  )
}

function UserRow({ resetPath, user }: { resetPath: string; user: R }) {
  const reset = useAdminPatch(resetPath)
  const status = useAdminPatch(`/admin/users/${text(user.id)}`)
  const profileHref = text(user.role) === "TEACHER" && obj(user.teacherProfile).id ? `/admin/teachers/${text(obj(user.teacherProfile).id)}` : text(user.role) === "PARENT_GUARDIAN" && obj(user.guardianProfile).id ? `/admin/parents/${text(obj(user.guardianProfile).id)}` : "/admin/users"
  return <tr><td className="p-4"><p className="font-bold">{text(user.name)}</p><p className="text-sm text-on-surface-variant">{text(user.email)}</p></td><td className="p-4">{text(user.phone, "-")}</td><td className="p-4">{text(user.role)}</td><td className="p-4"><StatusBadge status={text(user.status)} /></td><td className="p-4">{date(user.createdAt)}</td><td className="p-4"><div className="flex gap-2"><Button asChild size="icon-sm" variant="ghost"><Link href={profileHref}><MaterialSymbol icon="visibility" /></Link></Button><Button size="icon-sm" variant="ghost" disabled={status.isPending} onClick={() => status.mutate({ status: text(user.status) === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" }, { onError: (error) => toast.error(errorMessage(error, "User status update failed")) })}><MaterialSymbol icon={status.isPending ? "progress_activity" : "block"} className={status.isPending ? "animate-spin" : ""} /></Button><Button size="icon-sm" variant="ghost" disabled={reset.isPending} onClick={async () => { try { const result = await reset.mutateAsync({}); toast.success(`Temporary password: ${text(result.temporaryPassword)}`) } catch (error) { toast.error(errorMessage(error, "Password reset failed")) } }}><MaterialSymbol icon={reset.isPending ? "progress_activity" : "settings_backup_restore"} className={reset.isPending ? "animate-spin" : ""} /></Button></div></td></tr>
}

export function SettingsPage() {
  const { data } = useAdminSettings()
  const school = obj(data?.school)
  const settings = Object.fromEntries(list(data?.settings).map((item) => [text(item.key), text(item.value)]))
  const update = useAdminPatch("/admin/settings")
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    const { data } = submitData(event)
    try {
      await update.mutateAsync({
        school: { name: data.name, email: data.email, phone: data.phone, address: data.address, city: data.city, region: data.region },
        settings: { attendanceStart: data.attendanceStart, attendanceEnd: data.attendanceEnd, notifyParents: data.notifyParents },
      })
      toast.success("Settings updated")
    } catch (error) {
      toast.error(errorMessage(error, "Settings could not be saved"))
    }
  }
  return (
    <div>
      <PageHeader title="School Settings" description="Manage school profile information and operating preferences." />
      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-card"><h2 className="mb-4 text-xl font-bold">School Profile</h2><div className="grid gap-4 md:grid-cols-2"><InputField name="name" label="School Name" defaultValue={text(school.name)} /><InputField name="email" label="School Email" defaultValue={text(school.email)} /><InputField name="phone" label="Phone" defaultValue={text(school.phone)} /><InputField name="address" label="Address" defaultValue={text(school.address)} /><InputField name="city" label="City" defaultValue={text(school.city)} /><InputField name="region" label="Region" defaultValue={text(school.region)} /></div></section>
        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-card"><h2 className="mb-4 text-xl font-bold">Attendance & Notifications</h2><div className="grid gap-4 md:grid-cols-2"><InputField name="attendanceStart" label="Attendance Start" type="time" defaultValue={text(settings.attendanceStart)} /><InputField name="attendanceEnd" label="Attendance End" type="time" defaultValue={text(settings.attendanceEnd)} /><SelectField name="notifyParents" label="Parent Notifications" defaultValue={text(settings.notifyParents, "enabled")}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></SelectField></div></section>
        <div className="xl:col-span-2">
          <Button disabled={update.isPending}>
            {pendingText(update.isPending, "Save Settings")}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function AdminPlaceholder({ title }: { title: string }) {
  return <PlaceholderPage title={title} />
}
