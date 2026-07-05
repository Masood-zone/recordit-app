# Phase 7 Prompt — Reports, Analytics, Settings, and Final Polish

Design the Reports, Analytics, Settings, Device Management, and final polished UI screens for RecordIT.

RecordIT should feel complete, professional, academic, secure, and user-friendly. The final design should look ready for development in Next.js.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A
- Light Background: #F5F7FA

---

## Screen 1: Reports Dashboard

### Purpose

This screen allows admins to generate attendance reports.

### UI Elements

- Page title: Attendance Reports
- Report filters:
  - School
  - Class
  - Student
  - Date Range
  - Academic Term
  - Attendance Status
- Report type cards:
  - Daily Report
  - Weekly Report
  - Monthly Report
  - Termly Report
  - Custom Report

### Buttons

- Generate Report
- Export PDF
- Export Excel
- Export CSV

### UX Direction

Reports should be simple enough for administrators to understand quickly.

---

## Screen 2: Daily Report Page

### Purpose

This screen shows attendance records for a selected day.

### UI Elements

- Date selector
- Class filter
- Summary cards:
  - Total Students
  - Present
  - Absent
  - Late
  - Excused
- Attendance table

### Table Columns

- Student Name
- Student ID
- Class
- Status
- Time Marked
- Verification Method

### Actions

- Export PDF
- Export Excel
- Print

---

## Screen 3: Weekly Report Page

### Purpose

This screen shows attendance trends for a selected week.

### UI Elements

- Week selector
- Class filter
- Weekly trend chart
- Summary cards:
  - Average Attendance
  - Total Absences
  - Total Late Arrivals
- Table grouped by class or student

### Actions

- Export Weekly Report
- View Details

---

## Screen 4: Monthly Report Page

### Purpose

This screen shows monthly attendance summaries.

### UI Elements

- Month selector
- Class filter
- Attendance trend chart
- Student ranking table
- Absenteeism summary

### Actions

- Export PDF
- Export Excel
- Print Report

---

## Screen 5: Termly Report Page

### Purpose

This screen shows complete attendance performance for an academic term.

### UI Elements

- Academic year selector
- Term selector
- Class selector
- Summary cards:
  - Term Attendance Average
  - Total School Days
  - Best Attendance Class
  - Students Needing Attention
- Detailed student attendance table

### Actions

- Export Term Report
- Print Report
- View Student Monitoring

---

## Screen 6: Attendance Analytics Page

### Purpose

This screen gives visual insights into attendance patterns.

### UI Elements

- Summary cards:
  - Average Attendance Rate
  - Total Absences
  - Total Late Arrivals
  - Best Attendance Class
  - Students Needing Attention
- Charts:
  - Attendance trend over time
  - Present vs Absent comparison
  - Class attendance ranking
  - Lateness trend

### Tables

- Students with repeated absenteeism
- Students with repeated lateness
- Classes with low attendance

### UX Direction

Analytics should look useful but not too complicated.

---

## Screen 7: Student Monitoring Page

### Purpose

This screen helps administrators identify students who need attention.

### UI Elements

- Search student
- Filter by:
  - Class
  - Attendance percentage
  - Absence frequency
  - Lateness frequency
- Student monitoring table

### Student Monitoring Table Columns

- Student Name
- Student ID
- Class
- Attendance Percentage
- Absences
- Late Days
- Parent/Guardian Contact
- Action Needed

### Suggested Action Section

- Contact Parent
- View Report
- Add Note
- Flag Student for Follow-up

---

## Screen 8: Student Monitoring Detail Page

### Purpose

This screen shows a deeper view of one student’s attendance concerns.

### UI Elements

- Student profile header
- Attendance percentage
- Absence history
- Lateness history
- Parent/guardian contact
- Notes section
- Follow-up history

### Actions

- Contact Parent
- Add Note
- Export Student Report
- Mark as Followed Up

---

## Screen 9: System Settings Page

### Purpose

This screen contains general school/system settings.

### Sections

- School Profile Settings
- User Roles and Permissions
- Attendance Session Settings
- Fingerprint Device Settings
- Notification Settings
- Data Privacy Settings

### UX Direction

Settings should be grouped clearly in cards or tabs.

---

## Screen 10: User Roles and Permissions Page

### Purpose

This screen allows admins to control what each user role can access.

### UI Elements

- Role list:
  - School Admin
  - Teacher
  - Parent/Guardian
- Permission categories:
  - Students
  - Attendance
  - Reports
  - Users
  - Settings
- Toggle permissions

### Buttons

- Save Permissions
- Reset to Default

---

## Screen 11: Attendance Session Settings Page

### Purpose

This screen allows admins to configure how attendance sessions work.

### Settings

- Default session types:
  - Morning
  - Afternoon
  - Subject/Class Period
- Late time threshold
- Allow manual correction
- Require fingerprint verification
- Auto-close session option

### Buttons

- Save Settings
- Reset

---

## Screen 12: Device Settings Page

### Purpose

This screen helps admins manage the fingerprint reader.

### UI Elements

- Device name: ZKTeco ZK9500
- Device status:
  - Connected
  - Disconnected
  - Testing
- SDK/local bridge service status
- Last connected time
- Device logs preview

### Buttons

- Test Device
- Reconnect
- View Device Logs
- Go to Fingerprint Enrollment

### Helpful Text

“Make sure the fingerprint reader is connected to the computer and the local device service is running.”

---

## Screen 13: Device Logs Page

### Purpose

This screen shows device-related activity and errors.

### UI Elements

- Log table:
  - Date/Time
  - Device Status
  - Action
  - Message
  - User
- Filters:
  - Status
  - Date
  - Action Type

### Actions

- Refresh Logs
- Export Logs
- Clear Logs

---

## Screen 14: Notification Settings Page

### Purpose

This screen allows admins to manage notification options for parents.

### Settings

- Enable email notifications
- Enable SMS notifications
- Enable WhatsApp notifications
- Enable in-app notifications
- Notify parent when student is absent
- Notify parent when student is late
- Send weekly attendance summary

### Buttons

- Save Notification Settings
- Send Test Notification

---

## Screen 15: Data Privacy Settings Page

### Purpose

This screen manages privacy and data protection options.

### UI Elements

- Biometric data notice
- Consent requirement settings
- Data retention settings
- Access control reminder
- Export student data option
- Delete/deactivate student data option

### UX Direction

Use simple wording. Avoid legal complexity, but make the screen feel secure and responsible.

---

## Screen 16: Final UI Polish Requirements

### Purpose

Apply consistent design improvements across the full RecordIT app.

### Requirements

- Add consistent top navigation and sidebar
- Add breadcrumbs on dashboard pages
- Add loading states
- Add empty states
- Add confirmation modals
- Add success toast notifications
- Add error toast notifications
- Add mobile responsive layouts
- Add tablet responsive layouts
- Add clean icons matching education, security, attendance, and biometrics
- Use consistent button styles
- Use consistent card spacing
- Use consistent table styles
- Use accessible text contrast
- Use clear page titles and descriptions

### Final UX Direction

The final design should feel ready for Next.js development, with every screen easy to understand and visually connected to the RecordIT logo and brand identity.
