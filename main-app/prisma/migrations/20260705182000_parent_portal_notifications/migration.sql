CREATE TYPE "NotificationType" AS ENUM (
  'ABSENCE_ALERT',
  'LATENESS_ALERT',
  'WEEKLY_SUMMARY',
  'TERMLY_SUMMARY',
  'SCHOOL_ANNOUNCEMENT',
  'ACCOUNT_UPDATE'
);

ALTER TABLE "Notification"
  ADD COLUMN "studentId" TEXT,
  ADD COLUMN "attendanceRecordId" TEXT,
  ADD COLUMN "type" "NotificationType" NOT NULL DEFAULT 'ACCOUNT_UPDATE',
  ADD COLUMN "readAt" TIMESTAMP(3);

CREATE TABLE "ParentNotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "guardianId" TEXT NOT NULL,
  "schoolId" TEXT,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "absentAlerts" BOOLEAN NOT NULL DEFAULT true,
  "lateAlerts" BOOLEAN NOT NULL DEFAULT true,
  "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
  "termlySummary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ParentNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentNotificationPreference_userId_key" ON "ParentNotificationPreference"("userId");
CREATE UNIQUE INDEX "ParentNotificationPreference_guardianId_key" ON "ParentNotificationPreference"("guardianId");
CREATE INDEX "ParentNotificationPreference_schoolId_idx" ON "ParentNotificationPreference"("schoolId");
CREATE INDEX "Notification_studentId_idx" ON "Notification"("studentId");
CREATE INDEX "Notification_attendanceRecordId_idx" ON "Notification"("attendanceRecordId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_attendanceRecordId_fkey"
  FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParentNotificationPreference" ADD CONSTRAINT "ParentNotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentNotificationPreference" ADD CONSTRAINT "ParentNotificationPreference_guardianId_fkey"
  FOREIGN KEY ("guardianId") REFERENCES "ParentGuardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentNotificationPreference" ADD CONSTRAINT "ParentNotificationPreference_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
