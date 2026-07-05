# Phase 5 Prompt — Teacher Dashboard and Attendance Taking

Design the Teacher dashboard and attendance-taking interface for RecordIT.

Teachers need a very simple, fast, and reliable interface to take attendance using the fingerprint reader. The design should require very few clicks.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A

---

## Screen 1: Teacher Dashboard

### Purpose

This is the teacher’s home screen. It shows assigned classes, today’s sessions, and quick actions.

### UI Elements

- Header: “Welcome, Teacher”
- Teacher name
- Assigned school
- Today’s date
- Summary cards:
  - My Classes
  - Students Assigned
  - Attendance Sessions Today
  - Pending Attendance
- Today’s schedule/list of classes
- Quick actions:
  - Start Attendance
  - View Class Attendance
  - View Reports

### UX Direction

Teachers should immediately see what they need to do today.

---

## Screen 2: My Classes Page

### Purpose

This screen shows all classes assigned to the teacher.

### UI Elements

- Page title: My Classes
- Class cards showing:
  - Class name
  - Class code
  - Number of students
  - Attendance status today
  - Last attendance session
- Buttons:
  - Start Attendance
  - View Records
  - View Students

### UX Direction

Use simple class cards instead of complicated tables.

---

## Screen 3: Class Details Page

### Purpose

This screen allows teachers to view class information and students.

### UI Elements

- Class name and details
- Assigned teacher
- Number of students
- Attendance summary
- Student list
- Attendance history for the class

### Actions

- Start Attendance
- View Attendance Records
- Export Class Report

---

## Screen 4: Start Attendance Session Page

### Purpose

This screen allows the teacher to open an attendance session for a selected class.

### Form Fields

- Select Class
- Select Date
- Select Session Type:
  - Morning
  - Afternoon
  - Subject/Class Period
- Optional remarks

### Buttons

- Open Attendance Session
- Cancel

### Helper Text

“Open a session when you are ready to begin fingerprint attendance verification.”

---

## Screen 5: Live Biometric Attendance Page

### Purpose

This is the main attendance-taking screen. It should be fast, calm, and clear.

### UI Elements

- Big central fingerprint scan area
- Device status indicator:
  - Connected
  - Waiting for Student
  - Verifying
  - Student Found
  - Not Found
  - Device Disconnected
- Current session information:
  - Class
  - Date
  - Teacher
  - Session type
- Attendance counters:
  - Present
  - Absent
  - Late
  - Total Students
- Recent scans list on the side

### When Student is Verified

Show:

- Student photo/avatar
- Student name
- Student ID
- Class
- Attendance status: Present
- Time recorded

### Action Buttons

- Mark Late
- Mark Excused
- Retry Scan
- Close Session
- View Summary

### UX Direction

Scan feedback must be very visible. Use large status messages and icons.

---

## Screen 6: Student Not Found / Verification Failed State

### Purpose

This state appears when a fingerprint scan does not match any student.

### UI Elements

- Warning message: “Student not found.”
- Possible reasons:
  - Student not enrolled
  - Poor fingerprint scan
  - Wrong finger used
- Actions:
  - Retry Scan
  - Search Student Manually
  - Contact Admin

### UX Direction

Avoid making the teacher feel stuck. Provide clear next actions.

---

## Screen 7: Manual Attendance Adjustment Page

### Purpose

This screen allows the teacher to mark exceptions such as late or excused students.

### UI Elements

- Student search
- Student list
- Attendance status selector:
  - Present
  - Absent
  - Late
  - Excused
- Remarks field

### Buttons

- Save Adjustment
- Cancel

### UX Direction

Use this only as a support feature, not the main attendance method.

---

## Screen 8: Attendance Session Summary Page

### Purpose

This screen summarizes the attendance session before the teacher closes it.

### UI Elements

- Class name
- Date
- Teacher
- Session type
- Total students
- Present count
- Absent count
- Late count
- Excused count
- Student attendance table

### Table Columns

- Student Name
- Student ID
- Status
- Time Marked
- Verification Method
- Remarks

### Buttons

- Submit / Close Attendance
- Continue Scanning
- Export Summary

---

## Screen 9: Teacher Reports Page

### Purpose

This screen allows teachers to view attendance reports for their assigned classes.

### UI Elements

- Report filters:
  - Class
  - Date Range
  - Term
  - Status
- Report cards:
  - Daily Attendance
  - Weekly Attendance
  - Monthly Attendance
- Table of attendance records

### Buttons

- Generate Report
- Export PDF
- Export Excel
