Design the student registration and fingerprint enrollment UI for RecordIT.

RecordIT is a biometric-based school attendance system using a ZKTeco ZK9500 fingerprint reader. The UI must be simple, clear, and easy for school administrators to use.

Use the RecordIT logo theme:

- Deep navy
- Royal blue
- Bright cyan
- White
- Slate gray
- Soft light-blue backgrounds

Create the following screens:

1. Students List Page

- Page title: Students
- Search bar: Search by name, student ID, class
- Filters:
  - Class
  - Gender
  - Enrollment Status
  - Fingerprint Status
- Student table:
  - Photo/avatar
  - Student Name
  - Student ID
  - Class
  - Parent/Guardian
  - Fingerprint Status
  - Attendance Status Today
  - Actions
- Action buttons:
  - View
  - Edit
  - Enroll Fingerprint
  - View Attendance

2. Register Student Page

- Multi-step form:
  Step 1: Student Information
  Step 2: Class Assignment
  Step 3: Parent/Guardian Link
  Step 4: Fingerprint Enrollment
- Student fields:
  - First Name
  - Last Name
  - Other Name
  - Student ID
  - Gender
  - Date of Birth
  - Photo Upload
  - Class
- Parent link section:
  - Select existing parent
  - Or create new parent
- Clear Previous and Next buttons

3. Fingerprint Enrollment Page

- Large fingerprint scanner card
- Show device status:
  - Device Connected
  - Waiting for Finger
  - Capturing
  - Enrollment Successful
  - Enrollment Failed
- Use visual states with icons and progress indicators
- Include instruction text:
  “Place the student’s finger on the scanner”
  “Hold still while the fingerprint is captured”
  “Fingerprint enrolled successfully”
- Capture quality indicator:
  - Poor
  - Good
  - Excellent
- Buttons:
  - Start Enrollment
  - Retry
  - Save Fingerprint
  - Cancel

4. Student Profile Page

- Student photo and biodata
- Class information
- Parent/guardian contact
- Fingerprint enrollment status
- Attendance summary cards:
  - Present
  - Absent
  - Late
  - Excused
- Recent attendance table

UX Requirements:

- Make fingerprint enrollment feel guided and not technical
- Use step-by-step instructions
- Avoid clutter
- Use friendly success and error messages
- Make the interface suitable for school staff who may not be technical
