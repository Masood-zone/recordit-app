# RecordIT — Smart Biometric Attendance Management System

A secure, role-based school attendance platform built with Next.js that uses fingerprint biometrics for real-time student verification, attendance tracking, and institutional monitoring.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| State / Data | Tanstack Query, Zustand, React Hook Form |
| API | Next.js App Router API routes, Axios |
| Auth | better-auth (email/password, session-based) |
| Database | PostgreSQL via Prisma ORM |
| File Uploads | Cloudinary |
| Email | Nodemailer + React Email |
| SMS | SMS service integration |
| Biometrics | ZKTeco ZK9500 via local bridge (ZKFinger SDK) |
| Spreadsheet Import | SheetJS (xlsx) |

## Roles

- **Super Admin** — Platform-wide school management, onboarding approvals, suspension/reactivation
- **School Admin** — Full school operations: students, teachers, parents, classes, attendance, reports, settings
- **Teacher** — Class attendance sessions, live marking, manual adjustments, reports
- **Parent/Guardian** — View children's attendance, calendars, notifications, school contact

## Project Structure

```
app/
├── (auth)/              # Login, forgot/reset password
├── (super-admin)/       # Super admin dashboard, school management, school detail views
├── (admin)/             # School admin dashboard, students, teachers, parents, classes, attendance, reports, settings
├── (teacher)/           # Teacher dashboard
├── (parent)/            # Parent dashboard
├── onboarding/          # Multi-step school registration (school profile → admin setup → submission status)
├── api/                 # API routes (auth, super-admin, admin, uploads, onboarding)
├── about-us/
├── proof-of-concept/    # Fingerprint POC page
├── page.tsx             # Landing page
└── error.tsx / not-found.tsx / loading.tsx

components/
├── home/                # Landing page (hero, features, CTA, navbar, footer)
├── onboarding/          # Onboarding step components
├── super-admin/         # Super admin shell, dashboard, schools management, school detail
├── school-admin/        # School admin shell, UI, admin pages
├── dashboard/           # Shared dashboard home
├── common/              # FileUpload, MaterialSymbol
├── ui/                  # shadcn/ui components (button, card, input, sidebar, etc.)
├── providers/           # QueryClientProvider wrapper
└── app-state/           # App state screen

lib/
├── axios.ts             # Shared Axios instance with interceptors
├── api-client-error.ts  # Typed error class for API responses
├── auth.ts              # better-auth server config
├── auth-client.ts       # better-auth client config
├── prisma.ts            # Prisma client singleton
├── api-auth.ts          # Server-side auth helpers for API routes
├── dashboard-auth.ts    # Dashboard role-based auth guard
├── role-dashboard.ts    # Role-to-dashboard route mapping
├── admin-utils.ts       # Admin utility functions
├── bridge-api.ts        # Fingerprint bridge API client
├── cloudinary/          # Cloudinary upload service + utilities
└── utils.ts             # General utilities (cn, etc.)

services/
├── super-admin/         # Super admin schools, dashboard API + React Query hooks
├── admin/               # School admin API service
├── onboarding/          # School onboarding service
├── uploads/             # File upload service (Cloudinary)
├── email/               # Email service (Nodemailer + React Email templates)
├── sms/                 # SMS service
└── notifications/       # Notification services (enrollment, payments, reminders)

types/
└── index.ts             # Shared types (ApiResponse envelope, etc.)

prisma/
├── schema.prisma        # Database schema (20+ models)
└── seed.ts              # Super admin seed script

hooks/                   # Custom React hooks
assets/designs/          # UI design mockups (HTML + screenshots) per role
```

## Database Models

The Prisma schema defines the full data model:

- **School**, **AcademicYear**, **AcademicTerm**, **SchoolSetting** — School structure and config
- **User**, **Session**, **Account**, **Verification** — Auth (better-auth)
- **Teacher**, **ParentGuardian**, **Student**, **StudentGuardian** — People and relationships
- **Class**, **ClassTeacher** — Class assignments
- **BiometricDevice**, **FingerprintTemplate**, **BiometricScanLog** — Fingerprint enrollment and verification
- **AttendanceSession**, **AttendanceRecord** — Attendance tracking (fingerprint or manual)
- **Report** — Daily/weekly/monthly/termly reports (PDF, CSV, Excel)
- **Notification** — Email, SMS, WhatsApp, in-app notifications
- **AuditLog** — System audit trail

## Design Screens

UI mockups are in `assets/designs/` organized by role:

| Role | Screens |
|---|---|
| Landing Page | Home, features, CTA |
| Auth | Login |
| Onboarding | School profile, admin setup, submission status, status tracking |
| Super Admin | Dashboard, school management, school detail (overview, attendance, reports, classes, users, students) |
| School Admin | Dashboard, academic setup, class management, student registration, bulk import, fingerprint enrollment, student profile, attendance history, add teacher, add parent/guardian, school settings |
| Teacher | Dashboard, my classes, class details, live attendance, manual adjustment, verification failed, session summary, teacher reports |
| Parent | Dashboard, my children, attendance details, calendar, profile, contact school, notifications, notification preferences |
| Reports & Settings | Attendance reports, daily/weekly/monthly/termly reports, analytics, student monitoring, device management, device logs, attendance/notification/system settings, roles & permissions, data privacy |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- pnpm
- ZKTeco ZK9500 fingerprint reader (for biometric features)
- ZKFinger SDK driver (Windows only)

### Install & Run

```bash
pnpm install
cp .env.example .env    # configure DATABASE_URL, CLOUDINARY_*, SMTP_*, etc.
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

```bash
pnpm prisma migrate dev
pnpm prisma generate
pnpm seed:super-admin
```

### Build

```bash
pnpm build   # runs prisma generate → prisma migrate deploy → next build
```

### Fingerprint Bridge (Windows)

The biometric reader connects via a local bridge server:

```bash
# From the repository root
run-bridge.cmd          # builds and starts the bridge on http://localhost:5050
run-bridge.cmd -NoBuild # skip rebuild, launch existing EXE
```

To launch both bridge and frontend:

```bash
run-recordit-demo.cmd
```

## Fingerprint Testing Flow

1. Start the fingerprint bridge
2. Open the Next.js app → Proof of Concept page
3. Check Bridge Health → Connect Sensor → confirm serial number
4. Register a student (ID, name, class)
5. Select the student → Enroll Left Finger (place same finger 3x)
6. Enroll Right Finger (place same finger 3x)
7. Verify L / Verify R → place requested finger
8. Identify Any Finger → place any enrolled finger

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Prisma generate + migrate + Next.js build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm seed:super-admin` | Seed super admin user |
| `pnpm typecheck` | TypeScript type checking |
