"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useFingerprintPocStore } from "@/hooks/use-recordit-store"
import type { FingerName, StudentRecord } from "@/lib/bridge-api"
import { cn } from "@/lib/utils"

function statusClass(status: string) {
  if (status === "SUCCESS")
    return "border-emerald-600 bg-emerald-50 text-emerald-800"
  if (status === "FAILED") return "border-red-600 bg-red-50 text-red-800"
  if (status === "WAITING_FOR_FINGER" || status === "CAPTURING") {
    return "border-amber-600 bg-amber-50 text-amber-900"
  }
  return "border-border bg-muted/30 text-muted-foreground"
}

function preview(value: string | null) {
  if (!value) return "-"
  return `${value.slice(0, 40)}${value.length > 40 ? "..." : ""}`
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="min-w-0 overflow-hidden border bg-background p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid min-h-8 min-w-0 grid-cols-[minmax(7rem,0.45fr)_minmax(0,1fr)] items-center gap-3 border-b py-1 text-sm last:border-b-0">
      <span className="min-w-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 overflow-hidden text-right font-medium break-words">
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full border px-2 py-1 text-xs font-medium break-all",
        statusClass(status)
      )}
    >
      {status}
    </span>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 min-w-0 border bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/40"
      />
    </label>
  )
}

function FingerStatus({
  student,
  finger,
}: {
  student: StudentRecord
  finger: FingerName
}) {
  const summary = finger === "left" ? student.leftFinger : student.rightFinger

  return (
    <div className="grid min-w-0 gap-1 text-xs">
      <StatusBadge status={summary.status} />
      <span className="text-muted-foreground">
        FPID {summary.fpId ?? "-"} · T10 {summary.template10Length}
      </span>
    </div>
  )
}

export default function Page() {
  const store = useFingerprintPocStore()
  const {
    bridgeOnline,
    lastCheckedAt,
    loading,
    error,
    health,
    device,
    students,
    selectedStudentId,
    studentForm,
    enrollment,
    capture,
    verify,
    identify,
    frontendLogs,
    bridgeLogs,
    setStudentForm,
    selectStudent,
    checkHealth,
    refreshDeviceStatus,
    loadStudents,
    registerStudent,
    connectDevice,
    disconnectDevice,
    startEnrollment,
    startCapture,
    startVerify,
    startIdentify,
    loadBridgeLogs,
    clearError,
  } = store

  const selectedStudent =
    students.find((student) => student.studentId === selectedStudentId) ??
    students[0]

  useEffect(() => {
    checkHealth()
    refreshDeviceStatus()
    loadStudents()
  }, [checkHealth, loadStudents, refreshDeviceStatus])

  return (
    <main className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="min-w-0 border-b pb-4">
          <h1 className="text-2xl font-semibold break-words md:text-4xl">
            RecordIT Student Fingerprint Registration
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Register student records in memory, enroll left and right fingers,
            then verify or identify them through the C# bridge.
          </p>
        </header>

        {error ? (
          <div className="flex min-w-0 items-center justify-between gap-3 border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span className="min-w-0 break-words">{error}</span>
            <Button size="sm" variant="ghost" onClick={clearError}>
              Clear
            </Button>
          </div>
        ) : null}

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card title="Bridge Status">
            <div className="grid min-w-0 gap-1">
              <Row label="Online" value={bridgeOnline ? "Online" : "Offline"} />
              <Row label="Last checked" value={lastCheckedAt ?? "-"} />
              <Row label="Service" value={health?.service ?? "-"} />
              <Row label="Version" value={health?.version ?? "-"} />
              <Row label="Message" value={health?.message ?? "-"} />
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              <Button onClick={checkHealth} disabled={loading}>
                Check Bridge Health
              </Button>
              <Button
                variant="outline"
                onClick={loadBridgeLogs}
                disabled={loading}
              >
                Load Logs
              </Button>
            </div>
          </Card>

          <Card title="Device Status">
            <div className="grid min-w-0 gap-1">
              <Row
                label="Connected"
                value={device.connected ? "Connected" : "Disconnected"}
              />
              <Row label="Sensor count" value={device.sensorCount} />
              <Row label="Sensor index" value={device.sensorIndex ?? "-"} />
              <Row label="Serial number" value={device.serialNumber ?? "-"} />
              <Row label="Engine version" value={device.engineVersion ?? "-"} />
              <Row
                label="Anti-fake"
                value={device.fakeFunOn ? "Enabled" : "Off"}
              />
              <Row label="Message" value={device.message ?? "-"} />
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              <Button
                onClick={connectDevice}
                disabled={loading || device.connected}
              >
                Connect Sensor
              </Button>
              <Button
                variant="outline"
                onClick={disconnectDevice}
                disabled={loading || !device.connected}
              >
                Disconnect Sensor
              </Button>
              <Button
                variant="outline"
                onClick={refreshDeviceStatus}
                disabled={loading}
              >
                Refresh Device Status
              </Button>
            </div>
          </Card>
        </div>

        <Card title="Student Registration">
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            <TextInput
              label="Student ID"
              value={studentForm.studentId}
              onChange={(studentId) => setStudentForm({ studentId })}
              placeholder="REC-STU-001"
            />
            <TextInput
              label="Name"
              value={studentForm.name}
              onChange={(name) => setStudentForm({ name })}
              placeholder="Ama Mensah"
            />
            <TextInput
              label="Class"
              value={studentForm.className}
              onChange={(className) => setStudentForm({ className })}
              placeholder="Basic 4"
            />
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            <Button onClick={registerStudent} disabled={loading}>
              Register Student
            </Button>
            <Button variant="outline" onClick={loadStudents} disabled={loading}>
              Refresh Students
            </Button>
          </div>
        </Card>

        <Card title="Student Records">
          <div className="max-w-full overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2 font-medium">Student ID</th>
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Class</th>
                  <th className="p-2 font-medium">Left finger</th>
                  <th className="p-2 font-medium">Right finger</th>
                  <th className="p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.studentId}
                    className={cn(
                      "border-b align-top",
                      selectedStudentId === student.studentId && "bg-muted/40"
                    )}
                  >
                    <td className="p-2 font-medium break-all">
                      {student.studentId}
                    </td>
                    <td className="p-2 break-words">{student.name}</td>
                    <td className="p-2 break-words">{student.className}</td>
                    <td className="p-2">
                      <FingerStatus student={student} finger="left" />
                    </td>
                    <td className="p-2">
                      <FingerStatus student={student} finger="right" />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => selectStudent(student.studentId)}
                        >
                          Select
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => startVerify(student.studentId, "left")}
                          disabled={
                            loading ||
                            !device.connected ||
                            student.leftFinger.status !== "SUCCESS"
                          }
                        >
                          Verify L
                        </Button>
                        <Button
                          size="xs"
                          onClick={() =>
                            startVerify(student.studentId, "right")
                          }
                          disabled={
                            loading ||
                            !device.connected ||
                            student.rightFinger.status !== "SUCCESS"
                          }
                        >
                          Verify R
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 ? (
                  <tr>
                    <td
                      className="p-3 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No students registered.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card title="Left / Right Enrollment">
            <div className="grid min-w-0 gap-1">
              <Row
                label="Selected"
                value={
                  selectedStudent
                    ? `${selectedStudent.studentId} · ${selectedStudent.name}`
                    : "-"
                }
              />
              <Row
                label="Enrollment"
                value={<StatusBadge status={enrollment.status} />}
              />
              <Row label="Finger" value={enrollment.finger} />
              <Row label="Enroll index" value={enrollment.enrollIndex} />
              <Row label="Last quality" value={enrollment.lastQuality ?? "-"} />
              <Row label="FPID" value={enrollment.fpId || "-"} />
              <Row
                label="Template 10 length"
                value={enrollment.template10Length}
              />
              <Row
                label="Template preview"
                value={preview(enrollment.template10)}
              />
              <Row label="Instruction" value={enrollment.message ?? "-"} />
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              <Button
                onClick={() => startEnrollment("left")}
                disabled={loading || !device.connected || !selectedStudent}
              >
                Enroll Left Finger
              </Button>
              <Button
                onClick={() => startEnrollment("right")}
                disabled={loading || !device.connected || !selectedStudent}
              >
                Enroll Right Finger
              </Button>
            </div>
          </Card>

          <Card title="Capture / Identify">
            <div className="grid min-w-0 gap-1">
              <Row
                label="Capture"
                value={<StatusBadge status={capture.status} />}
              />
              <Row label="Capture quality" value={capture.lastQuality ?? "-"} />
              <Row label="Capture length" value={capture.templateLength} />
              <Row label="Capture preview" value={preview(capture.template)} />
              <Row
                label="Identify"
                value={<StatusBadge status={identify.status} />}
              />
              <Row
                label="Matched"
                value={identify.matched ? "Matched" : "Not matched"}
              />
              <Row label="Student" value={identify.studentId ?? "-"} />
              <Row label="Finger" value={identify.finger ?? "-"} />
              <Row label="Score" value={identify.score ?? "-"} />
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={startCapture}
                disabled={loading || !device.connected}
              >
                Start Capture
              </Button>
              <Button
                onClick={startIdentify}
                disabled={loading || !device.connected}
              >
                Identify Any Finger
              </Button>
            </div>
          </Card>

          <Card title="Verification Result">
            <div className="grid min-w-0 gap-1">
              <Row
                label="Status"
                value={<StatusBadge status={verify.status} />}
              />
              <Row
                label="Matched"
                value={verify.matched ? "Matched" : "Not matched"}
              />
              <Row label="Student ID" value={verify.studentId ?? "-"} />
              <Row label="Student name" value={verify.studentName ?? "-"} />
              <Row label="Class" value={verify.className ?? "-"} />
              <Row label="Finger" value={verify.finger ?? "-"} />
              <Row label="Message" value={verify.message ?? "-"} />
            </div>
          </Card>

          <Card title="Identification Result">
            <div className="grid min-w-0 gap-1">
              <Row
                label="Status"
                value={<StatusBadge status={identify.status} />}
              />
              <Row
                label="Matched"
                value={identify.matched ? "Matched" : "Not matched"}
              />
              <Row label="FPID" value={identify.fpId ?? "-"} />
              <Row label="Student ID" value={identify.studentId ?? "-"} />
              <Row label="Student name" value={identify.studentName ?? "-"} />
              <Row label="Class" value={identify.className ?? "-"} />
              <Row label="Finger" value={identify.finger ?? "-"} />
              <Row label="Processed" value={identify.processedNumber ?? "-"} />
              <Row label="Message" value={identify.message ?? "-"} />
            </div>
          </Card>
        </div>

        <Card title="Logs">
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                Frontend logs
              </h3>
              <div className="max-h-56 max-w-full overflow-auto border p-2 font-mono text-xs break-all">
                {frontendLogs.length === 0
                  ? "No frontend logs."
                  : frontendLogs.map((log) => <div key={log}>{log}</div>)}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                Bridge logs
              </h3>
              <div className="max-h-56 max-w-full overflow-auto border p-2 font-mono text-xs break-all">
                {bridgeLogs.length === 0
                  ? "No bridge logs loaded."
                  : bridgeLogs.map((log) => <div key={log}>{log}</div>)}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Debug Zustand State">
          <pre className="max-h-96 max-w-full overflow-auto border bg-muted/30 p-3 text-xs break-all">
            {JSON.stringify(store, null, 2)}
          </pre>
        </Card>
      </div>
    </main>
  )
}
