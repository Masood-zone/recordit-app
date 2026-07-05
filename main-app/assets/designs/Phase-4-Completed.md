# Phase 4 Prompt — Student Registration and Fingerprint Enrollment

Design the student registration and fingerprint enrollment UI for RecordIT.

RecordIT uses a ZKTeco ZK9500 fingerprint reader to enroll and verify students. The interface must be simple, guided, and easy for school administrators to use.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A
- Soft Sky Blue: #EAF8FF

---

## Screen 1: Students List Page

### Purpose

This screen allows admins to view, search, filter, and manage all registered students.

### UI Elements

- Page title: Students
- Button: Register Student
- Search bar: Search by name, student ID, or class
- Filters:
  - Class
  - Gender
  - Enrollment Status
  - Fingerprint Status
  - Attendance Status Today

### Student Table Columns

- Photo/avatar
- Student Name
- Student ID
- Gender
- Class
- Parent/Guardian
- Fingerprint Status
- Attendance Status Today
- Actions

### Actions

- View
- Edit
- Enroll Fingerprint
- View Attendance
- Deactivate Student

### Empty State

If there are no students:
“No students registered yet. Register your first student to begin.”

---

## Screen 2: Register Student Page

### Purpose

This screen allows the admin to register a new student through a clear multi-step process.

### Layout

Use a multi-step progress form:

1. Student Information
2. Class Assignment
3. Parent/Guardian Link
4. Fingerprint Enrollment

### Step 1: Student Information

Fields:

- First Name
- Last Name
- Other Name
- Student ID
- Gender
- Date of Birth
- Student Photo Upload

### Step 2: Class Assignment

Fields:

- Select Academic Year
- Select Class
- Select Student Status: Active / Inactive

### Step 3: Parent/Guardian Link

Options:

- Select existing parent/guardian
- Create new parent/guardian
- Mark parent as primary guardian

### Step 4: Fingerprint Enrollment

Options:

- Enroll fingerprint now
- Skip and enroll later

### Buttons

- Previous
- Next
- Save Student
- Save and Enroll Fingerprint
- Cancel

### UX Direction

Make the form feel guided. Use a progress bar and simple helper text.

---

## Screen 3: Fingerprint Enrollment Page

### Purpose

This screen allows the admin to capture and save a student’s fingerprint template.

### UI Elements

- Student profile summary:
  - Photo/avatar
  - Student name
  - Student ID
  - Class
- Large fingerprint scanner card
- Device name: ZKTeco ZK9500
- Device status:
  - Device Connected
  - Device Disconnected
  - Waiting for Finger
  - Capturing
  - Enrollment Successful
  - Enrollment Failed

### Instruction Text

Show simple guidance:

- “Place the student’s finger on the scanner.”
- “Hold still while the fingerprint is captured.”
- “Fingerprint enrolled successfully.”
- “Fingerprint quality is too low. Please try again.”

### Capture Quality Indicator

- Poor
- Good
- Excellent

### Buttons

- Start Enrollment
- Retry
- Save Fingerprint
- Cancel

### UX Direction

The fingerprint enrollment should feel like a guided process, not a technical device setup.

---

## Screen 4: Fingerprint Enrollment Success Screen

### Purpose

This screen confirms that fingerprint enrollment has been completed successfully.

### UI Elements

- Success icon
- Message: “Fingerprint enrolled successfully.”
- Student name and ID
- Fingerprint status: Enrolled
- Enrollment date and time

### Buttons

- View Student Profile
- Register Another Student
- Start Attendance

---

## Screen 5: Fingerprint Enrollment Failed Screen

### Purpose

This screen gives clear help when fingerprint enrollment fails.

### UI Elements

- Error icon
- Message: “Fingerprint enrollment failed.”
- Possible reasons:
  - Device not connected
  - Finger moved too quickly
  - Poor fingerprint quality
  - SDK/service not running
- Helpful instructions:
  - Check device connection
  - Clean scanner surface
  - Ask student to place finger properly
  - Retry enrollment

### Buttons

- Retry
- Cancel
- Go to Device Settings

---

## Screen 6: Student Profile Page

### Purpose

This screen shows complete student information and attendance summary.

### UI Elements

- Student photo and biodata
- Student ID
- Class
- Gender
- Date of Birth
- Parent/guardian contact
- Fingerprint enrollment status
- Attendance summary cards:
  - Present
  - Absent
  - Late
  - Excused
- Recent attendance table

### Actions

- Edit Student
- Enroll / Re-enroll Fingerprint
- View Full Attendance
- Link Parent/Guardian
- Deactivate Student

---

## Screen 7: Student Attendance History Page

### Purpose

This screen allows the admin to view a student’s full attendance record.

### UI Elements

- Student profile header
- Attendance percentage
- Date range filter
- Term filter
- Status filter
- Attendance calendar
- Attendance table

### Table Columns

- Date
- Session
- Class
- Status
- Time Marked
- Teacher
- Remarks

### Actions

- Export Student Report
- Print Attendance
- Contact Parent/Guardian

---

## Screen 8: Bulk Student Import Page

### Purpose

This screen allows admins to upload multiple students at once using CSV or Excel.

### UI Elements

- Upload area
- Download sample template button
- Import instructions
- Preview imported records before saving
- Error rows display

### Buttons

- Upload File
- Validate Records
- Import Students
- Cancel

### UX Direction

Make import errors easy to understand and correct.
