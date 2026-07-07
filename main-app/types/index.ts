import type * as React from "react"

export type ID = string
export type ISODateString = string
export type DateLike = Date | ISODateString
export type Nullable<T> = T | null
export type Maybe<T> = T | null | undefined

export type SortDirection = "asc" | "desc"

export type ApiFieldErrors = Record<string, string[]>

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR"
  | (string & {})

export type ApiMeta = {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

export type ApiResponse<TData = unknown> = {
  success: boolean
  message?: string
  data?: TData
  code?: ApiErrorCode
  errors?: ApiFieldErrors
  meta?: ApiMeta
}

export type PaginatedResult<TItem> = {
  items: TItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginationParams = {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDirection?: SortDirection
}

export type SelectOption<TValue extends string = string> = {
  label: string
  value: TValue
  description?: string
  disabled?: boolean
}

export type UserRole =
  "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT_GUARDIAN"

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"
export type SchoolStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED"
export type Gender = "MALE" | "FEMALE" | "OTHER"
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"

export type AttendanceSessionStatus =
  "SCHEDULED" | "OPEN" | "CLOSED" | "CANCELLED"

export type AttendanceVerificationMethod = "FINGERPRINT" | "MANUAL"

export type FingerLabel =
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

export type FingerprintTemplateStatus = "ACTIVE" | "REVOKED" | "REPLACED"

export type BiometricDeviceStatus =
  "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED"

export type BiometricScanPurpose =
  "ENROLLMENT" | "ATTENDANCE_VERIFICATION" | "IDENTIFICATION"

export type BiometricScanStatus =
  "SUCCESS" | "FAILED" | "LOW_QUALITY" | "NO_MATCH"

export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP"

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED"

export type NotificationType =
  | "ABSENCE_ALERT"
  | "LATENESS_ALERT"
  | "WEEKLY_SUMMARY"
  | "TERMLY_SUMMARY"
  | "SCHOOL_ANNOUNCEMENT"
  | "ACCOUNT_UPDATE"

export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "TERMLY" | "CUSTOM"
export type ExportFormat = "PDF" | "CSV" | "EXCEL"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "ENROLL_FINGERPRINT"
  | "VERIFY_ATTENDANCE"
  | "GENERATE_REPORT"
  | "EXPORT_REPORT"

export interface Timestamped {
  createdAt: DateLike
  updatedAt: DateLike
}

export interface School extends Timestamped {
  id: ID
  name: string
  code: string
  email?: Nullable<string>
  phone?: Nullable<string>
  address?: Nullable<string>
  city?: Nullable<string>
  region?: Nullable<string>
  country: string
  status: SchoolStatus
}

export interface AcademicYear extends Timestamped {
  id: ID
  schoolId: ID
  name: string
  startsAt: DateLike
  endsAt: DateLike
  isActive: boolean
}

export interface AcademicTerm extends Timestamped {
  id: ID
  schoolId: ID
  academicYearId: ID
  name: string
  startsAt: DateLike
  endsAt: DateLike
  isActive: boolean
}

export interface AppUser extends Timestamped {
  id: ID
  name: string
  email: string
  emailVerified: boolean
  image?: Nullable<string>
  schoolId?: Nullable<ID>
  role: UserRole
  status: UserStatus
  firstName?: Nullable<string>
  lastName?: Nullable<string>
  phone?: Nullable<string>
  lastLoginAt?: Nullable<DateLike>
}

export type User = AppUser

export interface Teacher extends Timestamped {
  id: ID
  userId: ID
  schoolId: ID
  staffNumber?: Nullable<string>
  department?: Nullable<string>
  title?: Nullable<string>
  user?: AppUser
}

export interface ParentGuardian extends Timestamped {
  id: ID
  userId: ID
  schoolId?: Nullable<ID>
  occupation?: Nullable<string>
  address?: Nullable<string>
  relationship?: Nullable<string>
  user?: AppUser
}

export interface Student extends Timestamped {
  id: ID
  schoolId: ID
  classId?: Nullable<ID>
  studentNumber: string
  firstName: string
  lastName: string
  otherName?: Nullable<string>
  gender: Gender
  dateOfBirth?: Nullable<DateLike>
  photoUrl?: Nullable<string>
  isActive: boolean
  class?: Nullable<Class>
  guardians?: StudentGuardian[]
}

export interface StudentGuardian extends Timestamped {
  id: ID
  studentId: ID
  guardianId: ID
  relationship: string
  isPrimary: boolean
  student?: Student
  guardian?: ParentGuardian
}

export interface Class extends Timestamped {
  id: ID
  schoolId: ID
  academicYearId?: Nullable<ID>
  name: string
  code?: Nullable<string>
  level?: Nullable<string>
  description?: Nullable<string>
  students?: Student[]
}

export interface ClassTeacher extends Timestamped {
  id: ID
  classId: ID
  teacherId: ID
  isLead: boolean
  class?: Class
  teacher?: Teacher
}

export interface BiometricDevice extends Timestamped {
  id: ID
  schoolId: ID
  name: string
  model: string
  serialNumber?: Nullable<string>
  bridgeUrl?: Nullable<string>
  sdkName?: Nullable<string>
  status: BiometricDeviceStatus
  lastSeenAt?: Nullable<DateLike>
}

export interface FingerprintTemplate extends Timestamped {
  id: ID
  schoolId: ID
  studentId: ID
  deviceId?: Nullable<ID>
  finger: FingerLabel
  templateHash?: Nullable<string>
  templateData?: Nullable<ArrayBuffer | Uint8Array | string>
  sdkFormat?: Nullable<string>
  qualityScore?: Nullable<number>
  status: FingerprintTemplateStatus
  enrolledByUserId?: Nullable<ID>
  enrolledAt: DateLike
}

export interface BiometricScanLog {
  id: ID
  schoolId: ID
  studentId?: Nullable<ID>
  deviceId?: Nullable<ID>
  templateId?: Nullable<ID>
  performedById?: Nullable<ID>
  attendanceRecordId?: Nullable<ID>
  clientRequestId?: Nullable<string>
  purpose: BiometricScanPurpose
  status: BiometricScanStatus
  matchScore?: Nullable<number>
  message?: Nullable<string>
  scannedAt: DateLike
}

export interface AttendanceSession extends Timestamped {
  id: ID
  schoolId: ID
  classId?: Nullable<ID>
  teacherId?: Nullable<ID>
  academicYearId?: Nullable<ID>
  academicTermId?: Nullable<ID>
  title: string
  sessionDate: DateLike
  startsAt?: Nullable<DateLike>
  endsAt?: Nullable<DateLike>
  status: AttendanceSessionStatus
  createdByUserId?: Nullable<ID>
  class?: Nullable<Class>
  teacher?: Nullable<Teacher>
  records?: AttendanceRecord[]
}

export interface AttendanceRecord extends Timestamped {
  id: ID
  schoolId: ID
  sessionId: ID
  studentId: ID
  deviceId?: Nullable<ID>
  templateId?: Nullable<ID>
  clientRequestId?: Nullable<string>
  status: AttendanceStatus
  markedAt: DateLike
  markedByUserId?: Nullable<ID>
  verificationMethod: AttendanceVerificationMethod
  fingerprintMatched: boolean
  fingerprintScore?: Nullable<number>
  remarks?: Nullable<string>
  capturedOffline: boolean
  syncedAt?: Nullable<DateLike>
  student?: Student
  session?: AttendanceSession
}

export interface Report extends Timestamped {
  id: ID
  schoolId: ID
  classId?: Nullable<ID>
  studentId?: Nullable<ID>
  academicYearId?: Nullable<ID>
  academicTermId?: Nullable<ID>
  generatedById?: Nullable<ID>
  type: ReportType
  title: string
  description?: Nullable<string>
  startDate: DateLike
  endDate: DateLike
  fileUrl?: Nullable<string>
  exportFormat?: Nullable<ExportFormat>
}

export interface AppNotification extends Timestamped {
  id: ID
  userId?: Nullable<ID>
  schoolId?: Nullable<ID>
  studentId?: Nullable<ID>
  attendanceRecordId?: Nullable<ID>
  channel: NotificationChannel
  status: NotificationStatus
  type: NotificationType
  title: string
  message: string
  read?: boolean
  readAt?: Nullable<DateLike>
  sentAt?: Nullable<DateLike>
  failedAt?: Nullable<DateLike>
  failureReason?: Nullable<string>
}

export type Notification = AppNotification

export interface ParentNotificationPreference extends Timestamped {
  id: ID
  userId: ID
  guardianId: ID
  schoolId?: Nullable<ID>
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
  inAppEnabled: boolean
  absentAlerts: boolean
  lateAlerts: boolean
  weeklySummary: boolean
  termlySummary: boolean
}

export interface AuditLog {
  id: ID
  schoolId?: Nullable<ID>
  userId?: Nullable<ID>
  action: AuditAction
  entity: string
  entityId?: Nullable<string>
  description?: Nullable<string>
  ipAddress?: Nullable<string>
  userAgent?: Nullable<string>
  createdAt: DateLike
}

export type AttendanceSummary = {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendanceRate: number
}

export type DashboardMetric = {
  label: string
  value: string | number
  helperText?: string
  trend?: "up" | "down" | "flat"
  icon?: MaterialSymbolName
}

export type UploadPurpose =
  | "schoolLogo"
  | "schoolBanner"
  | "studentPhoto"
  | "userAvatar"
  | "guardianPhoto"
  | "attendanceAttachment"
  | "reportExport"
  | "biometricEvidence"
  | "organizationLogo"
  | "organizationBanner"
  | "userProfile"
  | "welfareProgramCover"

export interface UploadedFile {
  bytes?: number
  format?: string
  height?: number
  originalName?: string
  previewUrl: string
  public_id: string
  secure_url: string
  url: string
  width?: number
}

export type UploadedCloudinaryFile = UploadedFile

export interface UploadFileInput {
  file: File
  purpose: UploadPurpose
}

export interface ExtendedUploadFile extends File {
  preview?: string
  upload?: UploadedFile
}

export type FileUploadMode = "single" | "multi"
export type FileUploadLayout = "vertical" | "horizontal"

export type FileUploadValue = ExtendedUploadFile | ExtendedUploadFile[] | null

export interface SendEmailOptions {
  html: string
  subject: string
  text?: string
  to: string
}

export interface SendSMSOptions {
  message: string
  to: string
}

export type CommunicationRecipient = {
  email?: Nullable<string>
  name: string
  phone?: Nullable<string>
  userId?: Nullable<ID>
}

export type AttendanceNotificationPayload = {
  channel: NotificationChannel
  guardian: CommunicationRecipient
  schoolName: string
  studentName: string
  className?: string
  status: AttendanceStatus
  markedAt: DateLike
}

export type MaterialSymbolName =
  | "analytics"
  | "badge"
  | "calendar_month"
  | "check_circle"
  | "close"
  | "cloud_upload"
  | "dashboard"
  | "delete"
  | "download"
  | "error"
  | "fingerprint"
  | "groups"
  | "history"
  | "home"
  | "login"
  | "logout"
  | "mail"
  | "menu"
  | "notifications"
  | "person"
  | "person_add"
  | "phone_iphone"
  | "print"
  | "school"
  | "search"
  | "settings"
  | "sms"
  | "upload_file"
  | "verified"
  | (string & {})

export type MaterialSymbolProps = React.HTMLAttributes<HTMLSpanElement> & {
  icon: MaterialSymbolName
  filled?: boolean
}

export type NavItem = {
  label: string
  href: string
  icon: MaterialSymbolName
  roles?: UserRole[]
  badge?: string | number
}

export type DataTableColumn<TItem> = {
  key: keyof TItem | string
  header: string
  align?: "left" | "center" | "right"
  className?: string
  render?: (item: TItem) => React.ReactNode
}

export type FormMode = "create" | "edit" | "view"

export type EntityStatusFilter<TStatus extends string> = TStatus | "ALL"
