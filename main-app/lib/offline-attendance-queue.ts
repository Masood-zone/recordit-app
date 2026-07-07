"use client"

export type OfflineAttendanceQueueItem = {
  action: "scan" | "adjust" | "close"
  capturedAt: string
  clientRequestId: string
  device?: Record<string, unknown>
  lastError?: string
  payload: Record<string, unknown>
  retryCount: number
  role: "admin" | "teacher"
  sessionId: string
  status: "pending" | "syncing" | "synced" | "failed"
  updatedAt: string
}

const DB_NAME = "recordit-offline-attendance"
const DB_VERSION = 1
const STORE = "scans"

function openQueue() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "clientRequestId" })
        store.createIndex("status", "status")
        store.createIndex("roleSession", ["role", "sessionId"])
      }
    }
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openQueue()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export function queueId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function enqueueOfflineAttendance(
  item: Omit<OfflineAttendanceQueueItem, "retryCount" | "status" | "updatedAt">
) {
  const now = new Date().toISOString()
  await withStore("readwrite", (store) =>
    store.put({ ...item, retryCount: 0, status: "pending", updatedAt: now })
  )
}

export async function listOfflineAttendance(role?: "admin" | "teacher") {
  const items = await withStore<OfflineAttendanceQueueItem[]>("readonly", (store) => store.getAll())
  return role ? items.filter((item) => item.role === role) : items
}

export async function updateOfflineAttendance(
  clientRequestId: string,
  patch: Partial<OfflineAttendanceQueueItem>
) {
  const current = await withStore<OfflineAttendanceQueueItem | undefined>("readonly", (store) =>
    store.get(clientRequestId)
  )
  if (!current) return
  await withStore("readwrite", (store) =>
    store.put({ ...current, ...patch, updatedAt: new Date().toISOString() })
  )
}

export async function removeOfflineAttendance(clientRequestId: string) {
  await withStore("readwrite", (store) => store.delete(clientRequestId))
}
