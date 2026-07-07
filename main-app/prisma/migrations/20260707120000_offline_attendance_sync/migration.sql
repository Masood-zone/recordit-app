-- Add idempotency and offline-sync metadata for browser-queued attendance scans.
ALTER TABLE "AttendanceRecord"
ADD COLUMN "clientRequestId" TEXT,
ADD COLUMN "capturedOffline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "syncedAt" TIMESTAMP(3);

ALTER TABLE "BiometricScanLog"
ADD COLUMN "clientRequestId" TEXT;

CREATE UNIQUE INDEX "AttendanceRecord_clientRequestId_key" ON "AttendanceRecord"("clientRequestId");
CREATE UNIQUE INDEX "BiometricScanLog_clientRequestId_key" ON "BiometricScanLog"("clientRequestId");
