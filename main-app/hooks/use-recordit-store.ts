"use client"

import { create } from "zustand"

import {
  BRIDGE_URL,
  bridgeApi,
  type CaptureState,
  type DeviceStatus,
  type EnrollmentState,
  type FingerName,
  type HealthResponse,
  type IdentifyState,
  type RegisterStudentInput,
  type StudentRecord,
  type VerifyState,
} from "@/lib/bridge-api"

type StudentForm = {
  studentId: string
  name: string
  className: string
}

type FingerprintPocStore = {
  bridgeUrl: string
  bridgeOnline: boolean
  lastCheckedAt: string | null
  loading: boolean
  error: string | null
  health: HealthResponse | null
  device: DeviceStatus
  students: StudentRecord[]
  selectedStudentId: string
  studentForm: StudentForm
  enrollment: EnrollmentState
  capture: CaptureState
  verify: VerifyState
  identify: IdentifyState
  frontendLogs: string[]
  bridgeLogs: string[]
  setStudentForm: (form: Partial<StudentForm>) => void
  selectStudent: (studentId: string) => void
  checkHealth: () => Promise<void>
  refreshDeviceStatus: () => Promise<void>
  loadStudents: () => Promise<void>
  registerStudent: () => Promise<void>
  connectDevice: () => Promise<void>
  disconnectDevice: () => Promise<void>
  startEnrollment: (finger: FingerName) => Promise<void>
  pollEnrollmentStatus: () => Promise<void>
  startCapture: () => Promise<void>
  pollCaptureStatus: () => Promise<void>
  startVerify: (studentId: string, finger: FingerName) => Promise<void>
  pollVerifyStatus: () => Promise<void>
  startIdentify: () => Promise<void>
  pollIdentifyStatus: () => Promise<void>
  loadBridgeLogs: () => Promise<void>
  addFrontendLog: (message: string) => void
  clearError: () => void
  resetPocState: () => void
}

const emptyDevice: DeviceStatus = {
  connected: false,
  sensorCount: 0,
  sensorIndex: null,
  serialNumber: null,
  engineVersion: "10",
  fakeFunOn: true,
  message: "Sensor not connected",
}

const emptyEnrollment: EnrollmentState = {
  studentId: "",
  finger: "left",
  status: "IDLE",
  enrollIndex: 0,
  scanCount: 0,
  scansRequired: 3,
  scansRemaining: 3,
  lastQuality: null,
  fpId: 0,
  template9Length: 0,
  template10Length: 0,
  template9: null,
  template10: null,
  message: null,
}

const emptyCapture: CaptureState = {
  status: "IDLE",
  lastQuality: null,
  templateLength: 0,
  template: null,
  message: null,
}

const emptyVerify: VerifyState = {
  status: "IDLE",
  matched: false,
  studentId: null,
  studentName: null,
  className: null,
  finger: null,
  message: null,
}

const emptyIdentify: IdentifyState = {
  status: "IDLE",
  matched: false,
  fpId: null,
  studentId: null,
  studentName: null,
  className: null,
  finger: null,
  score: null,
  processedNumber: null,
  message: null,
}

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function terminal(status: string) {
  return status === "SUCCESS" || status === "FAILED"
}

const FINGERPRINT_OPERATION_TIMEOUT_MS = 60_000
const FINGERPRINT_ENROLLMENT_TIMEOUT_MS = 120_000

async function pollUntilDone<T extends { status: string }>(
  load: () => Promise<T>,
  apply: (value: T) => void,
  timeoutMs = FINGERPRINT_OPERATION_TIMEOUT_MS,
  operationName = "Operation"
) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
    const next = await load()
    apply(next)
    if (terminal(next.status)) return
  }

  throw new Error(`${operationName} timed out after ${timeoutMs / 1000} seconds.`)
}

function baseState() {
  return {
    bridgeUrl: BRIDGE_URL,
    bridgeOnline: false,
    lastCheckedAt: null,
    loading: false,
    error: null,
    health: null,
    device: emptyDevice,
    students: [],
    selectedStudentId: "",
    studentForm: {
      studentId: "",
      name: "",
      className: "",
    },
    enrollment: emptyEnrollment,
    capture: emptyCapture,
    verify: emptyVerify,
    identify: emptyIdentify,
    frontendLogs: [],
    bridgeLogs: [],
  }
}

export const useFingerprintPocStore = create<FingerprintPocStore>(
  (set, get) => ({
    ...baseState(),
    setStudentForm: (form) =>
      set((state) => ({ studentForm: { ...state.studentForm, ...form } })),
    selectStudent: (studentId) => set({ selectedStudentId: studentId }),
    checkHealth: async () => {
      set({ loading: true, error: null })
      try {
        const health = await bridgeApi.health()
        set({
          health,
          bridgeOnline: true,
          lastCheckedAt: new Date().toLocaleString(),
        })
        get().addFrontendLog("Bridge health checked")
      } catch (error) {
        set({
          bridgeOnline: false,
          error: error instanceof Error ? error.message : "Bridge unavailable",
        })
        get().addFrontendLog("Bridge health check failed")
      } finally {
        set({ loading: false })
      }
    },
    refreshDeviceStatus: async () => {
      set({ loading: true, error: null })
      try {
        const device = await bridgeApi.deviceStatus()
        set({ device, bridgeOnline: true })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Could not load device status",
        })
      } finally {
        set({ loading: false })
      }
    },
    loadStudents: async () => {
      try {
        const response = await bridgeApi.students()
        set((state) => ({
          students: response.students,
          selectedStudentId:
            state.selectedStudentId || response.students[0]?.studentId || "",
        }))
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Could not load students",
        })
      }
    },
    registerStudent: async () => {
      const form = get().studentForm
      const payload: RegisterStudentInput = {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        className: form.className.trim(),
      }

      set({ loading: true, error: null })
      try {
        const response = await bridgeApi.registerStudent(payload)
        set({
          selectedStudentId: response.student.studentId,
          studentForm: { studentId: "", name: "", className: "" },
        })
        get().addFrontendLog(
          `Student registered: ${response.student.studentId}`
        )
        await get().loadStudents()
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Could not register student",
        })
      } finally {
        set({ loading: false })
      }
    },
    connectDevice: async () => {
      set({ loading: true, error: null })
      try {
        const device = await bridgeApi.connectDevice()
        set({ device, bridgeOnline: true })
        get().addFrontendLog("Sensor connected")
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Could not connect sensor",
        })
        get().addFrontendLog("Sensor connection failed")
      } finally {
        set({ loading: false })
      }
    },
    disconnectDevice: async () => {
      set({ loading: true, error: null })
      try {
        await bridgeApi.disconnectDevice()
        set({
          device: { ...emptyDevice, message: "Sensor disconnected" },
          enrollment: emptyEnrollment,
          capture: emptyCapture,
          verify: emptyVerify,
          identify: emptyIdentify,
        })
        get().addFrontendLog("Sensor disconnected")
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Could not disconnect sensor",
        })
      } finally {
        set({ loading: false })
      }
    },
    startEnrollment: async (finger) => {
      const studentId = get().selectedStudentId
      if (!studentId) {
        set({ error: "Select or register a student first." })
        return
      }

      set({ loading: true, error: null })
      try {
        const start = await bridgeApi.startEnrollment({ studentId, finger })
        set({
          enrollment: {
            ...emptyEnrollment,
            studentId,
            finger,
            status: start.status ?? "WAITING_FOR_FINGER",
            message:
              start.message ??
              `Place the same ${finger} finger on the reader 3 times.`,
          },
        })
        get().addFrontendLog(`Enrollment started: ${studentId} ${finger}`)
        await get().pollEnrollmentStatus()
        await get().loadStudents()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Enrollment failed",
        })
      } finally {
        set({ loading: false })
      }
    },
    pollEnrollmentStatus: async () => {
      await pollUntilDone(
        bridgeApi.enrollmentStatus,
        (enrollment) => {
          set({ enrollment })
        },
        FINGERPRINT_ENROLLMENT_TIMEOUT_MS,
        "Fingerprint enrollment"
      )
      get().addFrontendLog(`Enrollment ${get().enrollment.status}`)
    },
    startCapture: async () => {
      set({ loading: true, error: null })
      try {
        const start = await bridgeApi.startCapture()
        set({
          capture: {
            ...emptyCapture,
            status: start.status ?? "WAITING_FOR_FINGER",
            message: start.message ?? "Place finger on reader to capture",
          },
        })
        get().addFrontendLog("Capture started")
        await get().pollCaptureStatus()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Capture failed",
        })
      } finally {
        set({ loading: false })
      }
    },
    pollCaptureStatus: async () => {
      await pollUntilDone(bridgeApi.captureStatus, (capture) => {
        set({ capture })
      })
      get().addFrontendLog(`Capture ${get().capture.status}`)
    },
    startVerify: async (studentId, finger) => {
      set({ loading: true, error: null })
      try {
        const start = await bridgeApi.startVerify({ studentId, finger })
        set({
          verify: {
            ...emptyVerify,
            status: start.status ?? "WAITING_FOR_FINGER",
            studentId,
            finger,
            message:
              start.message ??
              `Place ${finger} finger on reader to verify student`,
          },
        })
        get().addFrontendLog(`Verify started: ${studentId} ${finger}`)
        await get().pollVerifyStatus()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Verify failed",
        })
      } finally {
        set({ loading: false })
      }
    },
    pollVerifyStatus: async () => {
      await pollUntilDone(bridgeApi.verifyStatus, (verify) => {
        set({ verify })
      })
      get().addFrontendLog(`Verify ${get().verify.status}`)
    },
    startIdentify: async () => {
      set({ loading: true, error: null })
      try {
        const start = await bridgeApi.startIdentify()
        set({
          identify: {
            ...emptyIdentify,
            status: start.status ?? "WAITING_FOR_FINGER",
            message:
              start.message ?? "Place finger on reader to identify student",
          },
        })
        get().addFrontendLog("Identify started")
        await get().pollIdentifyStatus()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Identify failed",
        })
      } finally {
        set({ loading: false })
      }
    },
    pollIdentifyStatus: async () => {
      await pollUntilDone(bridgeApi.identifyStatus, (identify) => {
        set({ identify })
      })
      get().addFrontendLog(`Identify ${get().identify.status}`)
    },
    loadBridgeLogs: async () => {
      set({ loading: true, error: null })
      try {
        const response = await bridgeApi.logs()
        set({ bridgeLogs: response.logs, bridgeOnline: true })
        get().addFrontendLog("Bridge logs loaded")
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Could not load bridge logs",
        })
      } finally {
        set({ loading: false })
      }
    },
    addFrontendLog: (message) =>
      set((state) => ({
        frontendLogs: [
          `${timestamp()} ${message}`,
          ...state.frontendLogs,
        ].slice(0, 50),
      })),
    clearError: () => set({ error: null }),
    resetPocState: () => set(baseState()),
  })
)
