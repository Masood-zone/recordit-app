# Phase 3 Prompt — School Admin Dashboard and Setup Screens

Design the School Admin dashboard and setup screens for RecordIT.

RecordIT is a biometric-based multi-school attendance monitoring and reporting system. The School Admin is responsible for managing the school’s academic setup, users, students, classes, attendance settings, and reports.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A
- Light Background: #F5F7FA

The design should be clean, academic, secure, and very easy for school administrators to use.

## Sidebar Navigation

Create a school admin sidebar with the following menu items:

- Dashboard
- Academic Setup
- Students
- Teachers
- Parents/Guardians
- Classes
- Attendance
- Reports
- Device Settings
- Notifications
- Settings
- Logout

The active menu item should be highlighted using royal blue or bright cyan.

---

## Screen 1: School Admin Dashboard

### Purpose

This is the main home screen for the school administrator. It should give a quick summary of the school’s attendance activity, users, students, and important actions.

### UI Elements

- Header: “Good morning, Administrator”
- Display the school name clearly below or beside the header
- Date and current academic term
- Summary cards:
  - Total Students
  - Total Teachers
  - Total Parents/Guardians
  - Total Classes
  - Attendance Today
  - Absentees Today
  - Late Students Today
- Weekly attendance trend chart
- Quick action buttons:
  - Register Student
  - Add Teacher
  - Add Parent/Guardian
  - Create Class
  - Start Attendance Session
  - Generate Report
- Recent activity section:
  - New student registered
  - Attendance session opened
  - Fingerprint enrolled
  - Report generated
- Alerts section:
  - Students without fingerprint enrollment
  - Classes without assigned teachers
  - Attendance sessions not closed

### UX Direction

The most important actions must be visible immediately. Use large cards, clear labels, and simple icons.

---

## Screen 2: Academic Setup Page

### Purpose

This screen allows the school administrator to set up academic years, terms, and classes.

### UI Elements

Use tabs or separate cards for:

1. Academic Years
2. Academic Terms
3. Classes

### Academic Years Section

- List of academic years
- Fields:
  - Academic Year Name
  - Start Date
  - End Date
  - Status: Active / Archived
- Actions:
  - Add Academic Year
  - Edit
  - View
  - Archive

### Academic Terms Section

- List of terms under selected academic year
- Fields:
  - Term Name
  - Start Date
  - End Date
  - Status
- Actions:
  - Add Term
  - Edit
  - View
  - Archive

### Classes Section

- List of classes
- Fields:
  - Class Name
  - Class Code
  - Level
  - Assigned Teacher
  - Number of Students
- Actions:
  - Create Class
  - Edit Class
  - View Class
  - Archive Class

### UX Direction

Use friendly empty states such as:
“No academic year has been created yet.”
“No classes created yet. Create your first class to begin student registration.”

---

## Screen 3: Class Management Page

### Purpose

This screen allows the admin to create, view, and manage school classes.

### UI Elements

- Page title: Classes
- Search bar: Search by class name or class code
- Filter by:
  - Academic Year
  - Level
  - Assigned Teacher
- Class cards or table showing:
  - Class Name
  - Class Code
  - Level
  - Number of Students
  - Assigned Teacher
  - Attendance Status Today
  - Actions

### Actions

- View Class
- Edit Class
- Assign Teacher
- View Students
- View Attendance
- Archive Class

### UX Direction

Use cards for a modern look, but allow a table-style layout for schools with many classes.

---

## Screen 4: Create/Edit Class Page

### Purpose

This screen allows admins to create a new class or update class details.

### Form Fields

- Class Name
- Class Code
- Level
- Academic Year
- Assigned Teacher
- Description

### Buttons

- Save Class
- Cancel

### UX Direction

Keep the form simple and short. Show helper text explaining each field where necessary.

---

## Screen 5: User Management Page

### Purpose

This page allows the school admin to manage all users in the school.

### UI Elements

Use tabs:

- Administrators
- Teachers
- Parents/Guardians

### Table Columns

- Name
- Email
- Phone
- Role
- Status
- Date Added
- Actions

### Filters

- Search by name or email
- Filter by role
- Filter by status

### Actions

- Add User
- View Profile
- Edit
- Activate
- Suspend
- Reset Password

### UX Direction

Use clear status badges:

- Active
- Inactive
- Suspended

---

## Screen 6: Add Teacher Page

### Purpose

This screen allows the admin to register a teacher and optionally assign them to a class.

### Form Fields

- First Name
- Last Name
- Other Name
- Email
- Phone
- Staff Number
- Department
- Title
- Assigned Class
- Account Status

### Buttons

- Save Teacher
- Save and Add Another
- Cancel

### UX Direction

After saving, show a success message:
“Teacher added successfully.”

---

## Screen 7: Teacher Profile Page

### Purpose

This screen shows full teacher details and their assigned classes.

### UI Elements

- Teacher profile card
- Contact details
- Staff number
- Department
- Assigned classes
- Attendance sessions handled
- Recent activity

### Actions

- Edit Teacher
- Assign Class
- Reset Password
- Suspend Account

---

## Screen 8: Add Parent/Guardian Page

### Purpose

This screen allows the admin to register a parent or guardian and link them to one or more students.

### Form Fields

- First Name
- Last Name
- Email
- Phone
- Relationship
- Occupation
- Address
- Linked Student

### Linking Section

The student linking section should be very clear:

- Search student by name or student ID
- Select student
- Choose relationship
- Mark as primary guardian if needed

### Buttons

- Save Parent/Guardian
- Link Another Student
- Cancel

### UX Direction

Use simple wording such as:
“Link this parent to a student so they can view attendance records.”

---

## Screen 9: Parent/Guardian Profile Page

### Purpose

This screen shows parent details and all linked students.

### UI Elements

- Parent profile card
- Phone and email
- Relationship type
- Linked children list
- Notification preference preview
- Recent parent login/activity

### Actions

- Edit Parent
- Link Student
- Remove Student Link
- Reset Password
- Suspend Account

---

## Screen 10: School Settings Page

### Purpose

This screen allows the admin to manage basic school profile information and preferences.

### Sections

- School Profile
- Contact Information
- Academic Preferences
- Attendance Preferences
- Notification Preferences
- Data and Privacy Settings

### UX Direction

Group settings clearly using cards. Avoid putting too many controls on one screen.
