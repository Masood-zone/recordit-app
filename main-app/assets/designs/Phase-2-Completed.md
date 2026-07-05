# Phase 2 Prompt — Super Admin and Multi-School Management

Design the Super Admin dashboard and multi-school management screens for RecordIT.

The Super Admin is the RecordIT platform administrator. This user manages school applications, approves or rejects schools, monitors registered schools, manages platform activity, and oversees the multi-school attendance service.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A
- Light Background: #F5F7FA
- Soft Sky Blue: #EAF8FF

The design should feel professional, secure, organized, and easy to manage.

---

## Super Admin Sidebar Navigation

Create a sidebar with the following items:

- Dashboard
- School Applications
- Schools
- Users
- Attendance Overview
- Reports
- Device Activity
- Notifications
- Support Messages
- Audit Logs
- Settings
- Logout

The active page should be highlighted using royal blue or bright cyan.

---

## Screen 1: Super Admin Dashboard

### Purpose

This is the main RecordIT platform overview screen. It gives the Super Admin a quick summary of schools, users, attendance activity, and pending actions.

### UI Elements

- Header:
  “Welcome back, Super Admin”
- Date and platform status
- Summary cards:
  - Total Schools
  - Active Schools
  - Pending School Applications
  - Total Students
  - Total Teachers
  - Total Parents/Guardians
  - Attendance Sessions Today
  - Schools Needing Attention

### Charts

- Attendance activity across schools
- Schools by status
- Monthly school registration trend
- Attendance session trend

### Quick Actions

- Review Applications
- Add School Manually
- View Schools
- Generate Platform Report
- View Audit Logs

### Recent Activity

- School application submitted
- School approved
- School suspended
- New school admin added
- Report generated

### Alerts

- Pending school approvals
- Schools with inactive attendance
- Device connection issues
- Support messages awaiting response

### UX Direction

The Super Admin should immediately see what needs attention. Use clean cards, clear icons, and strong visual hierarchy.

---

## Screen 2: School Applications Page

### Purpose

This screen allows the Super Admin to view and manage schools that have submitted applications and are waiting for approval.

### UI Elements

- Page title: “School Applications”
- Search bar:
  - Search by school name, email, region, or contact person
- Filters:
  - Status
  - Region
  - Date Submitted
- Application status tabs:
  - Pending
  - Under Review
  - Approved
  - Rejected

### Application Table Columns

- School Name
- Region
- Contact Person
- Contact Email
- Contact Phone
- Status
- Date Submitted
- Actions

### Actions

- View Application
- Approve
- Reject
- Mark as Under Review

### UX Direction

Use clear status badges:

- Pending
- Under Review
- Approved
- Rejected

---

## Screen 3: School Application Details Page

### Purpose

This screen shows full details of a school application so the Super Admin can decide whether to approve or reject it.

### UI Sections

#### School Information

- School Name
- School Code / Short Name
- School Email
- School Phone
- Address
- City
- Region
- Country

#### Contact Person Information

- Contact Person Name
- Contact Person Role
- Contact Person Phone
- Contact Person Email

#### Admin Account Information

- Admin Name
- Admin Email
- Admin Phone

#### Application Status

- Current Status
- Submitted Date
- Last Updated

### Action Buttons

- Approve School
- Reject Application
- Mark as Under Review
- Send Message
- Back to Applications

### Approval Confirmation Modal

When approving:

- Show confirmation message:
  “Are you sure you want to approve this school?”
- Buttons:
  - Confirm Approval
  - Cancel

### Rejection Modal

When rejecting:

- Show reason field:
  - Rejection Reason
- Buttons:
  - Reject Application
  - Cancel

### UX Direction

Approval and rejection actions should be clear and protected with confirmation modals.

---

## Screen 4: School Approval Success Page / State

### Purpose

This screen confirms that a school has been approved.

### UI Elements

- Success icon
- Message:
  “School approved successfully.”
- Sub-message:
  “The school administrator can now complete setup, add users, register students, enroll fingerprints, and start attendance.”
- Buttons:
  - View School
  - Back to Applications

### UX Direction

Use a clean success state with bright cyan and blue highlights.

---

## Screen 5: Rejected Application State

### Purpose

This state shows that a school application has been rejected.

### UI Elements

- Rejected status badge
- Rejection reason
- Date rejected
- Action:
  - Reopen Application
  - Send Message
  - Delete Application

### UX Direction

Keep the design professional. Avoid harsh wording.

---

## Screen 6: Schools Management Page

### Purpose

This screen allows the Super Admin to manage all schools registered on RecordIT.

### UI Elements

- Page title: “Schools”
- Button: “Add School”
- Search bar:
  - Search by school name, code, region, or email
- Filters:
  - Status
  - Region
  - Date Added
- School table or cards

### Table Columns

- School Name
- School Code
- Location
- Admin Contact
- Total Students
- Total Teachers
- Status
- Date Added
- Actions

### Actions

- View School
- Edit School
- Activate
- Suspend
- View Reports
- View Users

### UX Direction

Use table view for many schools and card view for smaller screens.

---

## Screen 7: Add School Manually Page

### Purpose

This screen allows the Super Admin to create a school directly without waiting for public application.

### Form Sections

#### School Information

- School Name
- School Code
- Email
- Phone
- Address
- City
- Region
- Country

#### School Admin Information

- Admin First Name
- Admin Last Name
- Admin Email
- Admin Phone
- Temporary Password

### Buttons

- Create School
- Cancel

### UX Direction

After creating the school, show a success message and direct the Super Admin to the school details page.

---

## Screen 8: Edit School Page

### Purpose

This screen allows the Super Admin to update school profile information.

### Form Fields

- School Name
- School Code
- Email
- Phone
- Address
- City
- Region
- Country
- Status

### Buttons

- Save Changes
- Cancel

### UX Direction

Make changes easy, but show a confirmation for critical status changes such as suspension.

---

## Screen 9: School Details Page

### Purpose

This screen gives the Super Admin a full overview of a selected school.

### UI Elements

- School profile card
- Status badge
- Admin contact details
- School statistics:
  - Students
  - Teachers
  - Parents/Guardians
  - Classes
  - Attendance Sessions
- Tabs:
  - Overview
  - Users
  - Students
  - Classes
  - Attendance
  - Reports
  - Devices
  - Settings

### Actions

- Edit School
- Suspend School
- Activate School
- Message School Admin
- Generate School Report

### UX Direction

This screen should make it easy to inspect one school without switching between too many pages.

---

## Screen 10: Platform Users Page

### Purpose

This screen allows the Super Admin to view and manage platform-level users across all schools.

### UI Elements

- Page title: “Users”
- Search bar:
  - Search by name, email, phone, or school
- Filters:
  - Role
  - School
  - Status
- User table

### Table Columns

- Name
- Email
- Phone
- Role
- School
- Status
- Last Login
- Actions

### Actions

- View User
- Edit User
- Reset Password
- Suspend User
- Activate User

### UX Direction

Use role badges:

- Super Admin
- School Admin
- Teacher
- Parent/Guardian

---

## Screen 11: User Details Page

### Purpose

This screen shows complete information about a selected user.

### UI Elements

- User profile card
- Contact information
- Role
- School association
- Status
- Last login
- Recent activity

### Actions

- Edit User
- Reset Password
- Suspend Account
- Activate Account

---

## Screen 12: Attendance Overview Page

### Purpose

This screen allows the Super Admin to monitor attendance activity across all schools.

### UI Elements

- Summary cards:
  - Attendance Sessions Today
  - Total Present Today
  - Total Absent Today
  - Total Late Today
  - Schools Active Today
- Filters:
  - School
  - Region
  - Date
  - Attendance Status
- Chart:
  - Attendance activity by school
- Table:
  - School Name
  - Sessions Today
  - Present
  - Absent
  - Late
  - Last Session Time

### UX Direction

This page is for monitoring, not detailed attendance editing.

---

## Screen 13: Platform Reports Page

### Purpose

This screen allows the Super Admin to generate high-level reports across schools.

### Report Types

- Schools Report
- Attendance Activity Report
- User Growth Report
- Device Activity Report
- School Performance Report

### UI Elements

- Report filters:
  - School
  - Region
  - Date Range
  - Report Type
- Buttons:
  - Generate Report
  - Export PDF
  - Export Excel
  - Export CSV

---

## Screen 14: Device Activity Page

### Purpose

This screen allows the Super Admin to monitor biometric device usage across schools.

### UI Elements

- Device activity summary cards:
  - Connected Devices
  - Disconnected Devices
  - Failed Scans
  - Successful Verifications
- Table columns:
  - School
  - Device Name
  - Device Model
  - Status
  - Last Connected
  - Last Activity
  - Actions

### Actions

- View Logs
- Message School Admin

### UX Direction

This page should help identify schools having device connection problems.

---

## Screen 15: Support Messages Page

### Purpose

This screen allows the Super Admin to view messages from schools, especially pending schools or schools needing help.

### UI Elements

- Message inbox layout
- Filters:
  - New
  - Open
  - Resolved
- Message list:
  - Sender Name
  - School
  - Subject
  - Date
  - Status
- Message detail panel

### Actions

- Reply
- Mark as Resolved
- Archive

---

## Screen 16: Audit Logs Page

### Purpose

This screen allows the Super Admin to review important system actions for accountability and security.

### UI Elements

- Log table:
  - Date/Time
  - User
  - Role
  - School
  - Action
  - Entity
  - IP Address
- Filters:
  - User
  - School
  - Action
  - Date Range

### Actions

- Export Logs
- View Details

### UX Direction

This screen should feel secure and professional.

---

## Screen 17: Super Admin Settings Page

### Purpose

This screen allows the Super Admin to manage platform-level preferences.

### Sections

- Platform Profile
- Approval Settings
- User Role Settings
- Notification Settings
- Security Settings
- Data Privacy Settings

### UI Elements

Use grouped setting cards or tabs.

### UX Direction

Keep settings organized. Avoid overcrowding the screen.

---

## Phase 2 UX Requirements

- Super Admin must clearly see pending school applications.
- Approval and rejection workflows must be simple and protected by confirmation modals.
- School management should support search, filters, statuses, and detailed views.
- The dashboard should show platform-wide activity at a glance.
- Use consistent RecordIT branding.
- Use clear status badges, friendly empty states, and responsive layouts.
- The interface should feel ready for Next.js implementation.
