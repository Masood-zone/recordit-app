"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { bridgeApi, type EnrollmentState, type FingerName, type IdentifyState } from "@/lib/bridge-api"
import {
  enqueueOfflineAttendance,
  listOfflineAttendance,
  queueId,
  removeOfflineAttendance,
  updateOfflineAttendance,
  type OfflineAttendanceQueueItem,
} from "@/lib/offline-attendance-queue"
import {
  EmptyState,
  PageHeader,
  SelectField,
  StatCard,
  StatusBadge,
  TableShell,
} from "@/components/school-admin/school-admin-ui"
import {
  adminKeys,
  useAdminAttendanceSetup,
  useAdminPost,
  useAdminStudent,
  useAdminSyncRoster,
} from "@/services/admin/admin"
import {
  teacherKeys,
  useTeacherAttendanceSetup,
  useTeacherPost,
  useTeacherStudent,
  useTeacherSyncRoster,
} from "@/services/teacher/teacher"

type R = Record<string, unknown>
type Role = "admin" | "teacher"

const FINGERPRINT_OPERATION_TIMEOUT_MS = 60_000
const FINGERPRINT_ENROLLMENT_TIMEOUT_MS = 120_000
const FINGERPRINT_ENROLLMENT_POLL_INTERVAL_MS = 250

const fingerOptions = [
  ["LEFT_THUMB", "Left thumb"],
  ["RIGHT_THUMB", "Right thumb"],
  ["LEFT_INDEX", "Left index"],
  ["RIGHT_INDEX", "Right index"],
  ["LEFT_MIDDLE", "Left middle"],
  ["RIGHT_MIDDLE", "Right middle"],
  ["LEFT_RING", "Left ring"],
  ["RIGHT_RING", "Right ring"],
  ["LEFT_LITTLE", "Left little"],
  ["RIGHT_LITTLE", "Right little"],
] as const

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

function list(value: unknown): R[] {
  return Array.isArray(value) ? (value as R[]) : []
}

function obj(value: unknown): R {
  return value && typeof value === "object" ? (value as R) : {}
}

function fullName(student: R) {
  return [student.firstName, student.otherName, student.lastName].map((part) => text(part)).filter(Boolean).join(" ")
}

function date(value: unknown) {
  if (!value) return "Not set"
  return new Date(String(value)).toLocaleDateString()
}

function time(value: unknown) {
  if (!value) return "-"
  return new Date(String(value)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function apiBase(role: Role) {
  return role === "admin" ? "/admin" : "/teacher"
}

function attendanceSetupKey(role: Role) {
  return role === "admin" ? adminKeys.attendanceSetup : teacherKeys.attendanceSetup
}

function updateCachedSession(queryClient: ReturnType<typeof useQueryClient>, role: Role, value: unknown) {
  const session = obj(value)
  const sessionId = text(session.id)
  if (!sessionId) return

  queryClient.setQueryData<R>(attendanceSetupKey(role), (current) => {
    const data = obj(current)
    const sessions = list(data.sessions)
    const index = sessions.findIndex((item) => text(item.id) === sessionId)
    const nextSessions = [...sessions]
    if (index >= 0) nextSessions[index] = session
    else nextSessions.unshift(session)
    return { ...data, sessions: nextSessions }
  })
}

async function pollUntilDone<T extends { status: string }>(
  load: () => Promise<T>,
  apply: (value: T) => void,
  timeoutMs = FINGERPRINT_OPERATION_TIMEOUT_MS,
  operationName = "Fingerprint operation",
  pollIntervalMs = 900
) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, pollIntervalMs))
    const next = await load()
    apply(next)
    if (next.status === "SUCCESS" || next.status === "FAILED") return next
  }
  throw new Error(`${operationName} timed out after ${timeoutMs / 1000} seconds.`)
}

function BridgeStatusPanel({
  onSync,
  syncing,
}: {
  onSync: () => Promise<void>
  syncing: boolean
}) {
  const [status, setStatus] = useState<R | null>(null)
  const [checking, setChecking] = useState(false)

  async function connect() {
    setChecking(true)
    try {
      const device = await bridgeApi.connectDevice()
      setStatus(device as unknown as R)
      toast.success(device.connected ? "Fingerprint reader connected" : "Bridge responded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bridge is unavailable")
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary-container">Fingerprint Bridge</h2>
          <p className="text-sm text-on-surface-variant">Local ZKTeco bridge at 127.0.0.1:5050.</p>
        </div>
        <StatusBadge status={status?.connected ? "CONNECTED" : "READY"} />
      </div>
      <div className="grid gap-2 text-sm">
        <p>Device: {text(status?.serialNumber, "Not checked")}</p>
        <p>Message: {text(status?.message, "Connect and sync before scanning")}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={connect} disabled={checking}>
          <MaterialSymbol icon="sensors" />
          {checking ? "Checking..." : "Connect Reader"}
        </Button>
        <Button type="button" variant="outline" onClick={onSync} disabled={syncing}>
          <MaterialSymbol icon="sync" />
          {syncing ? "Syncing..." : "Sync Templates"}
        </Button>
      </div>
    </section>
  )
}

function useRoleEnrollment(role: Role, studentId: string) {
  const adminStudent = useAdminStudent(role === "admin" ? studentId : undefined)
  const teacherStudent = useTeacherStudent(role === "teacher" ? studentId : undefined)
  const adminSave = useAdminPost(`/admin/students/${studentId}/fingerprints`)
  const teacherSave = useTeacherPost(`/teacher/students/${studentId}/fingerprints`)
  const adminRoster = useAdminSyncRoster(false)
  const teacherRoster = useTeacherSyncRoster(false)

  return {
    data: role === "admin" ? adminStudent.data : teacherStudent.data,
    isLoading: role === "admin" ? adminStudent.isLoading : teacherStudent.isLoading,
    loadRoster: async () => {
      const result = role === "admin" ? await adminRoster.refetch() : await teacherRoster.refetch()
      return result.data
    },
    save: role === "admin" ? adminSave : teacherSave,
  }
}

export function FingerprintEnrollmentWorkflow({ role }: { role: Role }) {
  const params = useParams<{ studentId: string }>()
  const router = useRouter()
  const { data, isLoading, loadRoster, save } = useRoleEnrollment(role, params.studentId)
  const student = obj(data?.student)
  const klass = obj(student.class)
  const [finger, setFinger] = useState<FingerName>("LEFT_THUMB")
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [working, setWorking] = useState(false)
  const backHref = role === "admin" ? `/admin/students/${params.studentId}` : `/teacher/students/${params.studentId}`

  async function syncRoster() {
    setSyncing(true)
    try {
      const roster = await loadRoster()
      const students = list(roster?.students)
      await bridgeApi.syncStudents(students as never)
      toast.success("Persisted fingerprint templates synced to bridge")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Roster sync failed")
    } finally {
      setSyncing(false)
    }
  }

  async function enroll() {
    if (!student.id) return
    setWorking(true)
    try {
      await bridgeApi.registerStudent({
        className: text(klass.name, "Unassigned"),
        name: fullName(student),
        studentId: text(student.id),
      })
      const start = await bridgeApi.startEnrollment({ studentId: text(student.id), finger })
      setEnrollment({
        enrollIndex: 0,
        finger,
        fpId: 0,
        lastQuality: null,
        message: start.message || "Place the same finger 3 times.",
        scanCount: 0,
        scansRemaining: 3,
        scansRequired: 3,
        status: start.status || "WAITING_FOR_FINGER",
        studentId: text(student.id),
        template9: null,
        template9Length: 0,
        template10: null,
        template10Length: 0,
      })
      const done = await pollUntilDone(
        bridgeApi.enrollmentStatus,
        setEnrollment,
        FINGERPRINT_ENROLLMENT_TIMEOUT_MS,
        "Fingerprint enrollment",
        FINGERPRINT_ENROLLMENT_POLL_INTERVAL_MS
      )
      if (done.status !== "SUCCESS" || !done.template9 || !done.template10) {
        throw new Error(done.message || "Enrollment did not return a usable template")
      }
      await save.mutateAsync({
        device: { bridgeUrl: "http://127.0.0.1:5050", model: "ZKTeco ZK9500" },
        finger,
        fpId: done.fpId,
        qualityScore: done.lastQuality,
        template9: done.template9,
        template10: done.template10,
      })
      toast.success("Fingerprint enrolled and saved")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enrollment failed")
    } finally {
      setWorking(false)
    }
  }

  const enrolled = list(student.fingerprints)

  return (
    <div>
      <PageHeader
        breadcrumb="Students / Fingerprint Enrollment"
        title={student.id ? fullName(student) : "Fingerprint Enrollment"}
        description="Capture and persist student fingerprint templates for biometric attendance."
        actions={<Button asChild variant="outline"><Link href={backHref}>Back to Student</Link></Button>}
      />
      {isLoading ? <p className="mb-4 text-on-surface-variant">Loading student...</p> : null}
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
          <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-sm text-on-surface-variant">ID: {text(student.studentNumber)}</p>
              <h2 className="mt-1 text-2xl font-bold text-primary-container">{fullName(student)}</h2>
              <p className="text-on-surface-variant">{text(klass.name, "Unassigned class")}</p>
            </div>
            <StatusBadge status={enrolled.length ? "ENROLLED" : "NOT ENROLLED"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="grid aspect-square place-items-center rounded-xl bg-primary-container text-white">
              <div className="grid place-items-center gap-3 text-center">
                <span className="grid size-28 place-items-center rounded-full border border-biometric bg-white/10">
                  <MaterialSymbol icon="fingerprint" className="text-[68px]" />
                </span>
                <p className="font-bold">{enrollment?.status || "READY"}</p>
                <p className="text-sm text-white/75">
                  {enrollment ? `${enrollment.scansRemaining} scans left` : "Waiting to start"}
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <SelectField label="Finger" value={finger} onChange={(event) => setFinger(event.target.value as FingerName)}>
                {fingerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </SelectField>
              <div className="rounded-xl bg-surface-container p-4 text-sm">
                <p className="font-bold text-primary-container">Enrollment progress</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-biometric"
                    style={{
                      width: `${Math.round(((enrollment?.scanCount || 0) / (enrollment?.scansRequired || 3)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-on-surface-variant">{enrollment?.message || "Place the selected finger only after starting enrollment."}</p>
              </div>
              <Button type="button" onClick={enroll} disabled={working || !student.id}>
                <MaterialSymbol icon="fingerprint" />
                {working ? "Enrolling..." : "Start Enrollment"}
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <BridgeStatusPanel onSync={syncRoster} syncing={syncing} />
          <TableShell title={<h2 className="text-lg font-bold">Saved Fingerprints</h2>}>
            <div className="divide-y divide-outline-variant">
              {enrolled.length ? enrolled.map((item) => (
                <div key={text(item.id) || text(item.finger)} className="flex items-center justify-between p-4">
                  <span className="font-semibold">{text(item.finger).replaceAll("_", " ")}</span>
                  <StatusBadge status="ENROLLED" />
                </div>
              )) : <p className="p-4 text-on-surface-variant">No fingerprints saved yet.</p>}
            </div>
          </TableShell>
        </div>
      </section>
    </div>
  )
}

function useRoleAttendance(role: Role) {
  const adminSetup = useAdminAttendanceSetup(role === "admin")
  const teacherSetup = useTeacherAttendanceSetup(role === "teacher")
  const adminRoster = useAdminSyncRoster(false)
  const teacherRoster = useTeacherSyncRoster(false)
  const adminPost = useAdminPost(`${apiBase(role)}/attendance-sessions`)
  const teacherPost = useTeacherPost(`${apiBase(role)}/attendance-sessions`)
  const setup = role === "admin" ? adminSetup.data : teacherSetup.data

  return {
    classes: list(setup?.classes),
    post: role === "admin" ? adminPost : teacherPost,
    roster: role === "admin" ? adminRoster.data : teacherRoster.data,
    refreshRoster: async () => {
      const result = role === "admin" ? await adminRoster.refetch() : await teacherRoster.refetch()
      return result.data
    },
    sessions: list(setup?.sessions),
    students: list(setup?.students),
  }
}

export function AttendanceSessionsWorkflow({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const { classes, post, refreshRoster, roster, sessions, students } = useRoleAttendance(role)
  const [sessionId, setSessionId] = useState("")
  const [scan, setScan] = useState<IdentifyState | null>(null)
  const [queueItems, setQueueItems] = useState<OfflineAttendanceQueueItem[]>([])
  const [syncingQueue, setSyncingQueue] = useState(false)
  const [syncedThisRun, setSyncedThisRun] = useState(0)
  const syncQueueRunningRef = useRef(false)
  const [syncing, setSyncing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [rosterSynced, setRosterSynced] = useState(false)
  const selectedSession = useMemo(
    () => sessions.find((session) => text(session.id) === sessionId) || sessions.find((session) => text(session.status) === "OPEN") || sessions[0],
    [sessionId, sessions]
  )
  const records = list(selectedSession?.records)
  const classStudents = students.filter((student) => !selectedSession?.classId || text(student.classId) === text(selectedSession.classId))
  const present = records.filter((record) => text(record.status) === "PRESENT").length
  const late = records.filter((record) => text(record.status) === "LATE").length
  const absent = records.filter((record) => text(record.status) === "ABSENT").length
  const pendingQueue = queueItems.filter((item) => item.status === "pending" || item.status === "syncing").length
  const failedQueue = queueItems.filter((item) => item.status === "failed").length

  const refreshQueue = useCallback(async () => {
    if (typeof window === "undefined") return
    setQueueItems(await listOfflineAttendance(role))
  }, [role])

  const queueScan = useCallback(
    async ({
      action = "scan",
      capturedAt,
      clientRequestId,
      payload,
      sessionId,
    }: {
      action?: OfflineAttendanceQueueItem["action"]
      capturedAt: string
      clientRequestId: string
      payload: R
      sessionId: string
    }) => {
      await enqueueOfflineAttendance({
        action,
        capturedAt,
        clientRequestId,
        device: { bridgeUrl: "http://127.0.0.1:5050", model: "ZKTeco ZK9500" },
        payload,
        role,
        sessionId,
      })
      await refreshQueue()
    },
    [refreshQueue, role]
  )

  const syncOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined" || syncQueueRunningRef.current) return
    syncQueueRunningRef.current = true
    const items = (await listOfflineAttendance(role)).filter((item) => item.status !== "synced")
    if (!items.length) {
      setQueueItems([])
      syncQueueRunningRef.current = false
      return
    }

    setSyncingQueue(true)
    setSyncedThisRun(0)
    let synced = 0
    const bySession = new Map<string, OfflineAttendanceQueueItem[]>()
    for (const item of items) {
      const group = bySession.get(item.sessionId) || []
      group.push(item.status === "failed" ? { ...item, status: "pending" } : item)
      bySession.set(item.sessionId, group)
      await updateOfflineAttendance(item.clientRequestId, { status: "syncing" })
    }
    await refreshQueue()

    for (const [queuedSessionId, group] of bySession) {
      try {
        const response = await fetch(
          `/api${apiBase(role)}/attendance-sessions/${queuedSessionId}/scans/sync`,
          {
            body: JSON.stringify({ items: group }),
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }
        )
        const payload = await response.json()
        if (!response.ok || !payload.success) throw new Error(payload.message || "Queue sync failed")
        const results = list(obj(payload.data).results)
        for (const result of results) {
          const id = text(result.clientRequestId)
          if (!id) continue
          if (text(result.status) === "synced" || text(result.status) === "duplicate") {
            await removeOfflineAttendance(id)
            synced += 1
          } else {
            const item = group.find((entry) => entry.clientRequestId === id)
            await updateOfflineAttendance(id, {
              lastError: text(result.error, "Sync failed"),
              retryCount: (item?.retryCount || 0) + 1,
              status: "failed",
            })
          }
        }
      } catch (error) {
        for (const item of group) {
          await updateOfflineAttendance(item.clientRequestId, {
            lastError: error instanceof Error ? error.message : "Queue sync failed",
            retryCount: item.retryCount + 1,
            status: "failed",
          })
        }
      }
    }

    setSyncedThisRun(synced)
    void queryClient.invalidateQueries({ queryKey: attendanceSetupKey(role) })
    await refreshQueue()
    setSyncingQueue(false)
    syncQueueRunningRef.current = false
    if (synced) toast.success(`${synced} offline scans synced`)
  }, [queryClient, refreshQueue, role])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.setTimeout(() => void refreshQueue(), 0)
    if (navigator.onLine) window.setTimeout(() => void syncOfflineQueue(), 0)
    const onOnline = () => void syncOfflineQueue()
    const retry = window.setInterval(() => {
      if (navigator.onLine) void syncOfflineQueue()
    }, 15000)
    window.addEventListener("online", onOnline)
    return () => {
      window.clearInterval(retry)
      window.removeEventListener("online", onOnline)
    }
  }, [refreshQueue, syncOfflineQueue])

  async function syncRoster(silent = false) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (!silent) toast.warning("Offline mode is active. Template sync will run when internet returns.")
      return
    }
    setSyncing(true)
    try {
      // Refetch just before syncing so newly enrolled templates are available even
      // when this attendance page has been open for some time.
      const latestRoster = await refreshRoster()
      const rosterStudents = list(latestRoster?.students ?? roster?.students)
      await bridgeApi.syncStudents(rosterStudents as never)
      setRosterSynced(true)
      if (!silent) toast.success("Bridge roster synced")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Roster sync failed"
      if (!silent) toast.error(message)
      throw new Error(message)
    } finally {
      setSyncing(false)
    }
  }

  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.warning("Opening a new attendance session needs internet. Use an already-open session while offline.")
      return
    }
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const result = await post.mutateAsync(data)
      const session = obj(result.session)
      updateCachedSession(queryClient, role, session)
      setSessionId(text(session.id))
      toast.success("Attendance session opened")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open attendance session")
    }
  }

  async function identify() {
    if (!selectedSession?.id) {
      toast.error("Open an attendance session first")
      return
    }
    setScanning(true)
    try {
      if (!rosterSynced) {
        // The fingerprint bridge loses its cache when it is restarted. Sync it on
        // the first scan so scanning works without requiring a separate manual step.
        await syncRoster(true)
      }
      const start = await bridgeApi.startIdentify()
      setScan({
        className: null,
        finger: null,
        fpId: null,
        matched: false,
        message: start.message || "Place finger on reader",
        processedNumber: null,
        score: null,
        status: start.status || "WAITING_FOR_FINGER",
        studentId: null,
        studentName: null,
      })
      const done = await pollUntilDone(bridgeApi.identifyStatus, setScan)
      const path = `${apiBase(role)}/attendance-sessions/${text(selectedSession.id)}/scans`
      const capturedAt = new Date().toISOString()
      const clientRequestId = queueId()
      const submitPayload = !done.matched || !done.studentId
        ? {
            clientRequestId,
            matched: false,
            message: done.message,
            status: "NO_MATCH",
          }
        : {
            clientRequestId,
            finger: done.finger,
            matched: true,
            matchScore: done.score,
            score: done.score,
            studentId: done.studentId,
          }
      async function submitOrQueue() {
      if (!navigator.onLine) {
          await queueScan({
            capturedAt,
            clientRequestId,
            payload: submitPayload,
            sessionId: text(selectedSession.id),
          })
          toast.warning("Internet is offline. Scan saved to offline queue.")
          return null
        }
        try {
          return await fetch(`/api${path}`, {
            body: JSON.stringify({ ...submitPayload, capturedAt }),
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }).then(async (res) => {
            const payload = await res.json()
            if (!res.ok || !payload.success) throw new Error(payload.message || "Attendance scan failed")
            return payload.data as R
          })
        } catch (error) {
          await queueScan({
            capturedAt,
            clientRequestId,
            payload: submitPayload,
            sessionId: text(selectedSession.id),
          })
          toast.warning(error instanceof Error ? `Scan queued: ${error.message}` : "Scan saved to offline queue")
          return null
        }
      }
      if (!done.matched || !done.studentId) {
        await submitOrQueue()
        toast.error("Student not found")
        return
      }
      const result = await submitOrQueue()
      if (result) updateCachedSession(queryClient, role, result.session)
      if (result) toast.success(Boolean(result.duplicate) ? "Student was already marked" : "Attendance recorded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed")
    } finally {
      setScanning(false)
    }
  }

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedSession?.id) return
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const studentId = text(data.studentId)
    if (!studentId) return
    const clientRequestId = queueId()
    const capturedAt = new Date().toISOString()
    async function queueAdjustment(message: string) {
      await queueScan({
        action: "adjust",
        capturedAt,
        clientRequestId,
        payload: { ...data, clientRequestId, studentId },
        sessionId: text(selectedSession.id),
      })
      toast.warning(message)
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueAdjustment("Offline mode is active. Manual adjustment saved to queue.")
      return
    }
    try {
      const result = await fetch(`/api${apiBase(role)}/attendance-sessions/${text(selectedSession.id)}/records/${studentId}`, {
        body: JSON.stringify({ ...data, clientRequestId, capturedAt }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }).then(async (res) => {
        const payload = await res.json()
        if (!res.ok || !payload.success) throw new Error(payload.message || "Adjustment failed")
        return payload.data as R
      })
      updateCachedSession(queryClient, role, result.session)
      toast.success("Attendance adjusted")
    } catch (error) {
      await queueAdjustment(error instanceof Error ? `Adjustment queued: ${error.message}` : "Adjustment saved to queue")
    }
  }

  async function closeSession() {
    if (!selectedSession?.id) return
    const clientRequestId = queueId()
    const capturedAt = new Date().toISOString()
    async function queueClose(message: string) {
      await queueScan({
        action: "close",
        capturedAt,
        clientRequestId,
        payload: { clientRequestId },
        sessionId: text(selectedSession.id),
      })
      toast.warning(message)
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await queueClose("Offline mode is active. Close session saved to queue.")
      return
    }
    try {
      const result = await fetch(`/api${apiBase(role)}/attendance-sessions/${text(selectedSession.id)}/close`, {
        body: JSON.stringify({ clientRequestId, capturedAt }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }).then(async (res) => {
        const payload = await res.json()
        if (!res.ok || !payload.success) throw new Error(payload.message || "Close failed")
        return payload.data as R
      })
      updateCachedSession(queryClient, role, result.session)
      toast.success("Session closed")
    } catch (error) {
      await queueClose(error instanceof Error ? `Close queued: ${error.message}` : "Close session saved to queue")
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb={role === "admin" ? "School Admin / Attendance" : "Teacher / Attendance"}
        title="Biometric Attendance"
        description="Open a class session, scan fingerprints, adjust exceptions, and close the final register."
      />
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard tone="dark" icon="task_alt" label="Present" value={present} />
        <StatCard icon="event_busy" label="Absent" value={absent} />
        <StatCard tone="blue" icon="schedule" label="Late" value={late} />
        <StatCard icon="groups" label="Records" value={records.length} />
        <StatCard icon="cloud_upload" label="Offline Pending" value={pendingQueue} />
        <StatCard icon="sync_problem" label="Sync Failed" value={failedQueue} />
        <StatCard icon="done_all" label="Synced Now" value={syncedThisRun} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <form onSubmit={openSession} className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-primary-container">Open Attendance Session</h2>
            <div className="grid gap-4">
              <SelectField name="classId" label="Class" required>
                <option value="">Select class</option>
                {classes.map((item) => <option key={text(item.id)} value={text(item.id)}>{text(item.name)}</option>)}
              </SelectField>
              <SelectField name="sessionType" label="Session Type" defaultValue="Morning">
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Subject/Class Period</option>
              </SelectField>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Date</span>
                <input name="sessionDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-12 rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 outline-none" />
              </label>
              <Button disabled={post.isPending}>
                <MaterialSymbol icon="add_task" />
                {post.isPending ? "Opening..." : "Open Session"}
              </Button>
            </div>
          </form>
          <BridgeStatusPanel onSync={syncRoster} syncing={syncing} />
          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-primary-container">Offline Queue</h2>
                <p className="text-sm text-on-surface-variant">
                  Scans captured without internet are synced back to RecordIT when connection returns.
                </p>
              </div>
              <StatusBadge status={pendingQueue || failedQueue ? "PENDING" : "CLEAR"} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-surface-container p-3">
                <p className="text-xl font-bold">{pendingQueue}</p>
                <p className="text-on-surface-variant">Pending</p>
              </div>
              <div className="rounded-lg bg-surface-container p-3">
                <p className="text-xl font-bold">{failedQueue}</p>
                <p className="text-on-surface-variant">Failed</p>
              </div>
              <div className="rounded-lg bg-surface-container p-3">
                <p className="text-xl font-bold">{syncedThisRun}</p>
                <p className="text-on-surface-variant">Synced</p>
              </div>
            </div>
            <Button type="button" className="mt-4 w-full" variant="outline" onClick={syncOfflineQueue} disabled={syncingQueue || (!pendingQueue && !failedQueue)}>
              <MaterialSymbol icon={syncingQueue ? "progress_activity" : "sync"} className={syncingQueue ? "animate-spin" : ""} />
              {syncingQueue ? "Syncing Queue..." : "Sync Queue"}
            </Button>
            {failedQueue ? (
              <p className="mt-3 text-xs text-destructive">
                Last error: {text(queueItems.find((item) => item.status === "failed")?.lastError, "Sync failed")}
              </p>
            ) : null}
          </section>
          <form onSubmit={adjust} className="rounded-xl border border-outline-variant bg-white p-5 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-primary-container">Manual Adjustment</h2>
            <div className="grid gap-4">
              <SelectField name="studentId" label="Student" required>
                <option value="">Select student</option>
                {classStudents.map((student) => <option key={text(student.id)} value={text(student.id)}>{fullName(student)} / {text(student.studentNumber)}</option>)}
              </SelectField>
              <SelectField name="status" label="Status" defaultValue="PRESENT">
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </SelectField>
              <textarea name="remarks" placeholder="Remarks" className="min-h-24 rounded-lg border border-outline-variant bg-white p-3 outline-none" />
              <Button variant="outline" disabled={!selectedSession?.id}>Save Adjustment</Button>
            </div>
          </form>
        </div>
        <div className="space-y-6">
          <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-card">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary-container">{text(selectedSession?.title, "No open session")}</h2>
                <p className="text-on-surface-variant">
                  {selectedSession ? `${date(selectedSession.sessionDate)} / ${text(selectedSession.status)}` : "Open a session to start scanning"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={identify} disabled={scanning || !selectedSession?.id || text(selectedSession?.status) === "CLOSED"}>
                  <MaterialSymbol icon="fingerprint" />
                  {scanning ? "Scanning..." : "Scan Finger"}
                </Button>
                <Button type="button" variant="outline" onClick={closeSession} disabled={!selectedSession?.id || text(selectedSession?.status) === "CLOSED"}>
                  Close Session
                </Button>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl bg-primary-container p-6 text-white md:grid-cols-[220px_1fr]">
              <div className="grid aspect-square place-items-center rounded-xl bg-white/10">
                <MaterialSymbol icon="fingerprint" className="text-[84px]" />
              </div>
              <div className="flex flex-col justify-center">
                <StatusBadge status={scan?.matched ? "PRESENT" : scan?.status || "WAITING"} />
                <h3 className="mt-4 text-2xl font-bold">{text(scan?.studentName, scan?.matched ? "Student found" : "Waiting for student")}</h3>
                <p className="mt-2 text-white/75">{text(scan?.message, "Scan feedback will appear here.")}</p>
              </div>
            </div>
          </section>
          <TableShell title={<h2 className="text-xl font-bold">Session Summary</h2>} footer={selectedSession ? `${records.length} records / ${classStudents.length || "all"} students` : null}>
            {records.length ? (
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-primary-container text-white">
                  <tr>{["Student", "Status", "Time", "Method", "Remarks"].map((head) => <th key={head} className="p-4">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {records.map((record) => {
                    const student = obj(record.student)
                    return (
                      <tr key={text(record.id)}>
                        <td className="p-4"><p className="font-bold">{fullName(student)}</p><p className="text-sm text-on-surface-variant">{text(student.studentNumber)}</p></td>
                        <td className="p-4"><StatusBadge status={text(record.status)} /></td>
                        <td className="p-4">{time(record.markedAt)}</td>
                        <td className="p-4">{text(record.verificationMethod)}</td>
                        <td className="p-4">{text(record.remarks, "-")}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState icon="fingerprint" title="No scans yet" message="Open or select a session, sync templates, then scan the first student." />
              </div>
            )}
          </TableShell>
        </div>
      </section>
    </div>
  )
}
