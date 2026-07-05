# Phase 1 Prompt — Landing Page, Login, and School Onboarding

Design the landing page, authentication screens, and first-time school onboarding flow for RecordIT.

RecordIT is a biometric-based multi-school attendance monitoring and reporting system. The UI should follow the logo theme: deep navy, royal blue, bright cyan, white, and slate gray. The design should feel secure, academic, trustworthy, and easy to use.

This phase should focus on introducing the platform, allowing users to log in, allowing schools to submit their school profile for approval, and guiding approved schools through setup.

---

## Screen 1: Landing Page

### Purpose

This screen introduces RecordIT to schools, administrators, teachers, and parents. It should explain what the system does and encourage schools to begin registration.

### UI Elements

- RecordIT logo area
- Hero title: “RecordIT”
- Tagline: “Smart Attendance. Trusted Education.”
- Short description:
  “A biometric-based school attendance platform designed to help schools record, monitor, and report student attendance accurately.”
- Primary button: “Get Started”
- Secondary button: “Login”
- Hero illustration or visual using:
  - Fingerprint icon
  - Shield/security icon
  - School/education icon
  - Attendance checkmark icon

### Feature Cards

Create four clean feature cards:

1. Biometric Attendance
   - Explains fingerprint-based student verification.

2. Multi-School Management
   - Explains that RecordIT can support multiple schools.

3. Parent Monitoring
   - Explains that parents/guardians can view attendance records.

4. Attendance Reports
   - Explains daily, weekly, monthly, and termly reports.

### Additional Sections

- How RecordIT Works:
  1. School applies
  2. RecordIT approves school
  3. School adds users and students
  4. Fingerprints are enrolled
  5. Attendance begins
- User roles section:
  - Admins
  - Teachers
  - Parents/Guardians
- Footer:
  - RecordIT name
  - Tagline
  - Support email placeholder
  - Copyright text

### UX Direction

The landing page should be clean, convincing, and not overcrowded. Use strong spacing, blue gradients, rounded cards, and simple icons.

---

## Screen 2: Login Page

### Purpose

This screen allows approved users to securely access the RecordIT platform.

### UI Elements

- Centered login card
- RecordIT logo at the top
- Page title: “Login to RecordIT”
- Email input
- Password input
- Login button
- Forgot password link
- Helper text:
  “Access your dashboard as an administrator, teacher, or parent/guardian.”
- Optional small role indicators:
  - Admin
  - Teacher
  - Parent

### Login States

Design visual states for:

- Default login form
- Loading state after clicking login
- Invalid email/password error
- Suspended account error
- School pending approval message

### UX Direction

The login page should be simple and calm. Avoid unnecessary fields. Make the login button clearly visible using royal blue.

---

## Screen 3: Forgot Password Page

### Purpose

This screen allows users to request password reset instructions.

### UI Elements

- RecordIT logo
- Title: “Reset Password”
- Short instruction:
  “Enter your email address and we will send instructions to reset your password.”
- Email input
- Button: “Send Reset Link”
- Back to Login link

### UX Direction

Use simple language. Keep the page minimal.

---

## Screen 4: Password Reset Confirmation Page

### Purpose

This screen confirms that password reset instructions have been sent.

### UI Elements

- Success icon
- Message:
  “Password reset instructions have been sent to your email.”
- Button: “Back to Login”

### UX Direction

Make the message clear and reassuring.

---

## Screen 5: Get Started / Account Type Selection Page

### Purpose

This screen appears after a user clicks “Get Started.” It helps users choose what they want to do.

### UI Elements

- Page title: “Get Started with RecordIT”
- Short description:
  “Choose how you want to continue.”
- Selection cards:
  1. Register a School
     - For schools that want to use RecordIT.
  2. Login as Existing User
     - For admins, teachers, and parents who already have accounts.
  3. Contact RecordIT Support
     - For help and enquiries.

### UX Direction

Use large clickable cards with icons. Make the “Register a School” card the primary option.

---

## Screen 6: School Application / School Registration Page

### Purpose

This screen allows a new school to submit its school profile for approval by the RecordIT team.

### Important Rule

Schools should not immediately register students or enroll fingerprints after this step. They must first submit their profile and wait for approval.

### Form Sections

#### School Information

- School Name
- School Code / Short Name
- School Email
- School Phone Number
- School Address
- City
- Region
- Country

#### Contact Person Information

- Contact Person Name
- Contact Person Role
- Contact Person Phone
- Contact Person Email

#### Account Setup

- Admin First Name
- Admin Last Name
- Admin Email
- Admin Phone
- Password
- Confirm Password

### Buttons

- Submit for Approval
- Cancel

### UX Direction

Split the form into clean sections. Use helper text to explain that approval is required before full access is granted.

---

## Screen 7: School Application Submitted Page

### Purpose

This screen confirms that the school has submitted its profile successfully.

### UI Elements

- Success icon
- Message:
  “Your school profile has been submitted successfully.”
- Sub-message:
  “Your application is now awaiting approval from the RecordIT team.”
- Status card:
  - Application Submitted
  - Under Review
  - Approval Pending
- Button:
  - Go to Approval Status
  - Logout

### UX Direction

Make the school feel guided and informed. Do not show student registration, fingerprint enrollment, or attendance options yet.

---

## Screen 8: Approval Pending Dashboard

### Purpose

This is the limited dashboard shown to school admins while their school is waiting for approval.

### UI Elements

- Header:
  “Approval Pending”
- Message:
  “Your school profile is currently under review. Once approved, you will be able to add users, register students, enroll fingerprints, and start attendance sessions.”
- School profile summary card:
  - School Name
  - School Email
  - Phone
  - Region
  - Application Status
- Approval timeline:
  1. Application Submitted
  2. Under Review
  3. Approval Pending
  4. Approved

### Limited Sidebar Items

Before approval, show only:

- School Profile
- Approval Status
- Contact Support
- Logout

### Disabled Features

Show these features as locked or disabled:

- Users
- Students
- Fingerprint Enrollment
- Attendance
- Reports
- Settings

### UX Direction

Clearly communicate that the school must be approved before continuing. Locked features should be visible but not accessible, helping users understand what will come next.

---

## Screen 9: School Profile Preview Page

### Purpose

This screen allows the pending school admin to review submitted school information.

### UI Elements

- School profile details
- Contact person details
- Application status badge
- Submitted date
- Last updated date

### Actions

- Edit Application
- Contact Support
- Logout

### UX Direction

Keep this page simple. Allow editing only while the application has not been approved or rejected.

---

## Screen 10: Contact Support Page

### Purpose

This screen allows pending schools to contact RecordIT support.

### UI Elements

- Support information card
- Contact form:
  - Name
  - Email
  - Subject
  - Message
- Button: “Send Message”

### UX Direction

This page should feel helpful and professional.

---

## Screen 11: School Approved Welcome Screen

### Purpose

This screen appears after the RecordIT Super Admin approves the school.

### UI Elements

- Success icon
- Header:
  “Your school has been approved.”
- Message:
  “You can now complete your school setup and begin using RecordIT.”
- Button:
  “Continue Setup”

### UX Direction

Make this feel like a major milestone. Use bright cyan and royal blue highlights.

---

## Screen 12: Approved School Setup Progress Page

### Purpose

This screen guides an approved school through the remaining setup steps.

### Progress Steps

- School Approved
- Add Users
- Register Students
- Enroll Fingerprints
- Start Attendance

### UI Elements

- Setup progress bar
- Step cards with icons
- Each card should show:
  - Step title
  - Short description
  - Completion status
  - Action button

### Step Cards

#### School Approved

- Shows that approval is complete.
- Status: Completed

#### Add Users

- Allows the admin to add teachers, parents/guardians, and other school users.
- Button: “Add Users”

#### Register Students

- Allows the admin to add students to the system.
- Button: “Register Students”

#### Enroll Fingerprints

- Allows the admin to capture student fingerprints using the ZKTeco ZK9500.
- Button: “Start Enrollment”

#### Start Attendance

- Allows the school to begin attendance sessions after students and fingerprints are ready.
- Button: “Start Attendance”

### UX Direction

Use friendly cards, progress indicators, and clear wording. The setup process should feel guided, not technical.

---

## Screen 13: Approved School Dashboard Shell

### Purpose

This is the main dashboard layout that appears once the school is approved.

### Sidebar Items

After approval, show:

- Dashboard
- Users
- Students
- Teachers
- Parents/Guardians
- Classes
- Fingerprint Enrollment
- Attendance
- Reports
- Device Settings
- Notifications
- Settings
- Logout

### UI Elements

- Top bar with school name
- User profile dropdown
- Notification icon
- Sidebar navigation
- Main content area

### UX Direction

Use a clean sidebar, rounded cards, soft shadows, and large readable text. The layout must be responsive for desktop, tablet, and mobile.

---

## Phase 1 UX Requirements

- Schools must apply first before accessing full features.
- Student registration and fingerprint enrollment must only be available after approval.
- Pending schools should have a limited dashboard.
- Approved schools should see the full setup progress flow.
- The interface must be clear enough for non-technical school staff.
- Use friendly success, warning, and pending states.
- Maintain consistent RecordIT branding across all screens.
