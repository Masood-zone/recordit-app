-- Composite indexes for the filters and sort orders used by dashboard,
-- attendance, fingerprint, notification, and audit-log request paths.
CREATE INDEX IF NOT EXISTS "AcademicYear_schoolId_isActive_idx"
  ON "AcademicYear"("schoolId", "isActive");

CREATE INDEX IF NOT EXISTS "AcademicTerm_schoolId_isActive_idx"
  ON "AcademicTerm"("schoolId", "isActive");

CREATE INDEX IF NOT EXISTS "Student_schoolId_classId_isActive_idx"
  ON "Student"("schoolId", "classId", "isActive");

CREATE INDEX IF NOT EXISTS "Student_schoolId_lastName_firstName_idx"
  ON "Student"("schoolId", "lastName", "firstName");

CREATE INDEX IF NOT EXISTS "BiometricDevice_schoolId_bridgeUrl_idx"
  ON "BiometricDevice"("schoolId", "bridgeUrl");

CREATE INDEX IF NOT EXISTS "FingerprintTemplate_schoolId_status_idx"
  ON "FingerprintTemplate"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "BiometricScanLog_schoolId_scannedAt_idx"
  ON "BiometricScanLog"("schoolId", "scannedAt");

CREATE INDEX IF NOT EXISTS "AttendanceSession_schoolId_sessionDate_createdAt_idx"
  ON "AttendanceSession"("schoolId", "sessionDate", "createdAt");

CREATE INDEX IF NOT EXISTS "AttendanceSession_schoolId_status_idx"
  ON "AttendanceSession"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "AttendanceSession_classId_sessionDate_idx"
  ON "AttendanceSession"("classId", "sessionDate");

CREATE INDEX IF NOT EXISTS "AttendanceSession_teacherId_sessionDate_idx"
  ON "AttendanceSession"("teacherId", "sessionDate");

CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_markedAt_idx"
  ON "AttendanceRecord"("schoolId", "markedAt");

CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_status_markedAt_idx"
  ON "AttendanceRecord"("schoolId", "status", "markedAt");

CREATE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_markedAt_idx"
  ON "AttendanceRecord"("sessionId", "markedAt");

CREATE INDEX IF NOT EXISTS "AttendanceRecord_studentId_markedAt_idx"
  ON "AttendanceRecord"("studentId", "markedAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx"
  ON "Notification"("userId", "readAt");

CREATE INDEX IF NOT EXISTS "Notification_schoolId_createdAt_idx"
  ON "Notification"("schoolId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_schoolId_readAt_idx"
  ON "Notification"("schoolId", "readAt");

CREATE INDEX IF NOT EXISTS "AuditLog_schoolId_createdAt_idx"
  ON "AuditLog"("schoolId", "createdAt");
