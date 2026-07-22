export const BRIDGE_URL = "http://127.0.0.1:5050"

export type FingerName =
  | "LEFT_THUMB"
  | "LEFT_INDEX"
  | "LEFT_MIDDLE"
  | "LEFT_RING"
  | "LEFT_LITTLE"
  | "RIGHT_THUMB"
  | "RIGHT_INDEX"
  | "RIGHT_MIDDLE"
  | "RIGHT_RING"
  | "RIGHT_LITTLE"
  | "left"
  | "right"
export type PocStatus =
  | "IDLE"
  | "WAITING_FOR_FINGER"
  | "ENROLLING"
  | "CAPTURING"
  | "SUCCESS"
  | "FAILED"

export type HealthResponse = {
  ok: boolean
  service: string
  version: string
  timestamp: string
  message?: string
}

export type DeviceStatus = {
  connected: boolean
  sensorCount: number
  sensorIndex: number | null
  serialNumber: string | null
  engineVersion: string | null
  fakeFunOn: boolean
  message: string | null
  success?: boolean
  errorCode?: number
}

export type FingerSummary = {
  fpId: number | null
  status: PocStatus
  template9Length: number
  template10Length: number
  finger?: string
}

export type StudentRecord = {
  studentId: string
  name: string
  className: string
  leftFinger: FingerSummary
  rightFinger: FingerSummary
  fullyEnrolled: boolean
}

export type StudentsResponse = {
  students: StudentRecord[]
}

export type RegisterStudentResponse = {
  success: boolean
  student: StudentRecord
  message: string
}

export type EnrollmentState = {
  studentId: string
  finger: FingerName
  status: PocStatus
  enrollIndex: number
  scanCount: number
  scansRequired: number
  scansRemaining: number
  lastQuality: number | null
  fpId: number
  template9Length: number
  template10Length: number
  template9?: string | null
  template10: string | null
  message: string | null
}

export type CaptureState = {
  status: PocStatus
  lastQuality: number | null
  templateLength: number
  template: string | null
  message: string | null
}

export type VerifyState = {
  status: PocStatus
  matched: boolean
  studentId: string | null
  studentName: string | null
  className: string | null
  finger: FingerName | null
  message: string | null
}

export type IdentifyState = {
  status: PocStatus
  matched: boolean
  fpId: number | null
  studentId: string | null
  studentName: string | null
  className: string | null
  finger: FingerName | null
  score: number | null
  processedNumber: number | null
  message: string | null
}

export type BridgeLogsResponse = {
  logs: string[]
}

export type StartResponse = {
  started?: boolean
  success?: boolean
  status?: PocStatus
  studentId?: string
  finger?: FingerName
  message?: string
  connected?: boolean
}

export type RegisterStudentInput = {
  studentId: string
  name: string
  className: string
}

type FingerPayload = {
  studentId: string
  finger: FingerName
}

export type SyncFingerprint = {
  finger: string
  fpId?: number
  template9: string
  template10: string
}

export type SyncStudent = {
  studentId: string
  name: string
  className: string
  fingers: SyncFingerprint[]
}

export type SyncStudentsResponse = {
  success: boolean
  students: number
  templates: number
  message: string
}

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  const data = (await response.json()) as T & {
    success?: boolean
    ok?: boolean
    message?: string
  }

  if (!response.ok || data.success === false || data.ok === false) {
    throw new Error(data.message ?? `Bridge request failed: ${response.status}`)
  }

  return data as T
}

function post<T>(path: string, body?: unknown) {
  return bridgeFetch<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : "{}",
  })
}

export const bridgeApi = {
  health: () => bridgeFetch<HealthResponse>("/health"),
  deviceStatus: () => bridgeFetch<DeviceStatus>("/device/status"),
  connectDevice: () => post<DeviceStatus>("/device/connect"),
  disconnectDevice: () => post<DeviceStatus>("/device/disconnect"),
  students: () => bridgeFetch<StudentsResponse>("/students"),
  registerStudent: (student: RegisterStudentInput) =>
    post<RegisterStudentResponse>("/students/register", student),
  syncStudents: (students: SyncStudent[], version?: string) =>
    post<SyncStudentsResponse>("/students/fingerprint/sync", { students, version }),
  startEnrollment: (payload: FingerPayload) =>
    post<StartResponse>("/students/fingerprint/enroll/start", payload),
  enrollmentStatus: () =>
    bridgeFetch<EnrollmentState>("/students/fingerprint/enroll/status"),
  startCapture: () => post<StartResponse>("/fingerprint/capture/start"),
  captureStatus: () => bridgeFetch<CaptureState>("/fingerprint/capture/status"),
  startVerify: (payload: FingerPayload) =>
    post<StartResponse>("/students/fingerprint/verify/start", payload),
  verifyStatus: () =>
    bridgeFetch<VerifyState>("/students/fingerprint/verify/status"),
  startIdentify: () =>
    post<StartResponse>("/students/fingerprint/identify/start"),
  identifyStatus: () =>
    bridgeFetch<IdentifyState>("/students/fingerprint/identify/status"),
  logs: () => bridgeFetch<BridgeLogsResponse>("/logs"),
}
