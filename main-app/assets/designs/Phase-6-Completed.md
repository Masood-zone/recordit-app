# Phase 6 Prompt — Parent/Guardian Portal

Design the Parent/Guardian portal UI for RecordIT.

Parents and guardians use RecordIT to monitor their child’s attendance records. The UI must be extremely simple, friendly, and mobile-first because many parents may access it from phones.

Use the RecordIT theme:

- Deep Navy: #071B52
- Royal Blue: #005BBB
- Bright Cyan: #00AEEF
- White: #FFFFFF
- Slate Gray: #5B677A
- Soft Sky Blue: #EAF8FF

---

## Screen 1: Parent Dashboard

### Purpose

This is the parent’s home screen. It gives a quick summary of the child’s attendance.

### UI Elements

- Header: “Welcome, Parent/Guardian”
- Child/ward profile card:
  - Student photo/avatar
  - Student name
  - Class
  - School
- Attendance summary cards:
  - Present Days
  - Absent Days
  - Late Days
  - Attendance Percentage
- Simple status message:
  - “Your child’s attendance is up to date.”
  - “Your child has missed attendance recently.”
- Quick actions:
  - View Attendance Details
  - View Notifications
  - Contact School

### UX Direction

Use simple wording and avoid technical terms.

---

## Screen 2: Multiple Children View

### Purpose

This screen appears when a parent has more than one child linked to their account.

### UI Elements

- Page title: My Children
- Child cards showing:
  - Student photo/avatar
  - Name
  - Class
  - School
  - Attendance percentage
  - Latest attendance status
- Button:
  - View Attendance

### UX Direction

Make it easy for parents to switch between children.

---

## Screen 3: Child Attendance Details Page

### Purpose

This screen shows detailed attendance records for one child.

### UI Elements

- Student profile header
- Attendance percentage
- Attendance calendar view
- Color-coded attendance states:
  - Present
  - Absent
  - Late
  - Excused
- Recent attendance list

### Recent Attendance List Columns

- Date
- Status
- Time
- Teacher/Class Session

### Filters

- This Week
- This Month
- This Term
- Custom Date Range

### UX Direction

Attendance information should be understandable at a glance.

---

## Screen 4: Attendance Calendar Page

### Purpose

This screen gives parents a visual calendar view of their child’s attendance.

### UI Elements

- Monthly calendar
- Color indicators for:
  - Present
  - Absent
  - Late
  - Excused
- Legend explaining each color
- Clickable date details

### Date Detail Popup

When a parent taps a date, show:

- Date
- Attendance status
- Time marked
- Session
- Teacher
- Remarks if available

---

## Screen 5: Parent Notifications Page

### Purpose

This screen shows attendance-related alerts and messages.

### UI Elements

- Notification list
- Notification types:
  - Absence alert
  - Lateness alert
  - Weekly attendance summary
  - School announcement
- Each notification should show:
  - Title
  - Message
  - Date
  - Status: Read / Unread

### Actions

- Mark as Read
- Delete Notification
- View Related Attendance

---

## Screen 6: Notification Preferences Page

### Purpose

This screen allows parents to choose how they want to receive attendance updates.

### Notification Channels

- Email
- SMS
- WhatsApp
- In-app

### Toggle Options

- Notify me when my child is absent
- Notify me when my child is late
- Send weekly attendance summary
- Send termly attendance summary

### Buttons

- Save Preferences
- Cancel

### UX Direction

Use toggles and short descriptions. Keep the screen very simple.

---

## Screen 7: Parent Profile Page

### Purpose

This screen allows the parent to view and update their contact details.

### UI Elements

- Name
- Phone
- Email
- Relationship
- Address
- Linked children

### Actions

- Edit Contact Details
- Change Password
- View Linked Children

---

## Screen 8: Contact School Page

### Purpose

This screen allows parents to access school contact information.

### UI Elements

- School name
- School phone
- School email
- School address
- Class teacher contact if available
- Message button or contact prompt

### UX Direction

Do not make this complicated. It should simply help parents know who to contact.
