import { render } from "@react-email/render"
import nodemailer from "nodemailer"

import { OrganizationApplicationDecisionEmail } from "@/services/email/organization-application-decision-email"
import { MemberInvitationEmail } from "@/services/email/member-invitation-email"
import { OnboardingReceivedEmail } from "@/services/email/onboarding-received-email"
import { PaymentSuccessEmail } from "@/services/email/payment-success-email"
import { WelfareProgramDueReminderEmail } from "@/services/email/welfare-program-due-reminder-email"
import { WelfareProgramEnrollmentEmail } from "@/services/email/welfare-program-enrollment-email"

interface SendEmailOptions {
  html: string
  subject: string
  text?: string
  to: string
}

interface OnboardingReceivedEmailData {
  adminEmail: string
  adminName: string
  organizationEmail: string
  organizationName: string
  organizationPhone: string
  organizationType: string
}

interface OrganizationApplicationDecisionEmailData {
  adminEmail: string
  adminName: string
  decision: "approved" | "rejected"
  organizationName: string
  reason?: string
}

interface MemberInvitationEmailData {
  memberEmail: string
  memberName: string
  organizationName: string
  password: string
}

interface WelfareProgramEnrollmentEmailData {
  amount: number
  enrollmentKind: "mandatory" | "optional"
  frequency: string
  memberEmail: string
  memberName: string
  organizationName: string
  programTitle: string
}

interface WelfareProgramDueReminderEmailData {
  amount: number
  dueDate: string
  frequency: string
  memberEmail: string
  memberName: string
  organizationName: string
  programTitle: string
}

interface PaymentSuccessEmailData {
  amount: number
  memberEmail: string
  memberName: string
  organizationName: string
  paidAt: string
  programTitle: string
  reference: string
}

class EmailService {
  private transporter = nodemailer.createTransport(
    (process.env.SMTP_HOST || "smtp.gmail.com") === "gmail"
      ? {
          service: "gmail",
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
          },
        }
      : {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
          },
        }
  )

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials are missing from environment")
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  }

  async sendOnboardingReceivedEmail(
    data: OnboardingReceivedEmailData
  ): Promise<void> {
    const signinUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BETTER_AUTH_URL || ""
    const html = await render(
      OnboardingReceivedEmail({
        adminName: data.adminName,
        organizationEmail: data.organizationEmail,
        organizationName: data.organizationName,
        organizationPhone: data.organizationPhone,
        organizationType: data.organizationType,
        signinUrl,
      })
    )

    await this.sendEmail({
      to: data.adminEmail,
      subject: `Amanah Welfare received ${data.organizationName}'s onboarding application`,
      html,
      text: `Hello ${data.adminName}, Amanah Welfare has received ${data.organizationName}'s onboarding application. Status: pending verification. We will notify you once verification is complete.`,
    })
  }

  async sendOrganizationApplicationDecisionEmail(
    data: OrganizationApplicationDecisionEmailData
  ): Promise<void> {
    const dashboardUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BETTER_AUTH_URL || ""
    const html = await render(
      OrganizationApplicationDecisionEmail({
        adminName: data.adminName,
        dashboardUrl,
        decision: data.decision,
        organizationName: data.organizationName,
        reason: data.reason,
      })
    )

    await this.sendEmail({
      to: data.adminEmail,
      subject:
        data.decision === "approved"
          ? `Amanah Welfare approved ${data.organizationName}`
          : `Amanah Welfare reviewed ${data.organizationName}`,
      html,
      text:
        data.decision === "approved"
          ? `Hello ${data.adminName}, ${data.organizationName} has been approved on Amanah Welfare.`
          : `Hello ${data.adminName}, ${data.organizationName}'s application was rejected. Reason: ${data.reason || "Please contact support for details."}`,
    })
  }

  async sendMemberInvitationEmail(
    data: MemberInvitationEmailData
  ): Promise<void> {
    const signinUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      ""
    const html = await render(
      MemberInvitationEmail({
        memberName: data.memberName,
        organizationName: data.organizationName,
        password: data.password,
        signinUrl,
      })
    )

    await this.sendEmail({
      to: data.memberEmail,
      subject: `${data.organizationName} added you to Amanah Welfare`,
      html,
      text: `Hello ${data.memberName}, ${data.organizationName} has added you to Amanah Welfare. Sign in at ${signinUrl}. Temporary password: ${data.password}`,
    })
  }

  async sendWelfareProgramEnrollmentEmail(
    data: WelfareProgramEnrollmentEmailData
  ): Promise<void> {
    const portalUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      ""
    const html = await render(
      WelfareProgramEnrollmentEmail({
        amount: data.amount,
        enrollmentKind: data.enrollmentKind,
        frequency: data.frequency,
        memberName: data.memberName,
        organizationName: data.organizationName,
        portalUrl,
        programTitle: data.programTitle,
      })
    )

    await this.sendEmail({
      to: data.memberEmail,
      subject:
        data.enrollmentKind === "mandatory"
          ? `${data.organizationName} enrolled you in ${data.programTitle}`
          : `Enrollment confirmed: ${data.programTitle}`,
      html,
      text:
        data.enrollmentKind === "mandatory"
          ? `Hello ${data.memberName}, ${data.organizationName} enrolled you in the mandatory welfare program ${data.programTitle}. Amount: GHS ${data.amount.toFixed(2)}. Frequency: ${data.frequency}.`
          : `Hello ${data.memberName}, your enrollment in ${data.programTitle} is confirmed. Amount: GHS ${data.amount.toFixed(2)}. Frequency: ${data.frequency}.`,
    })
  }

  async sendWelfareProgramDueReminderEmail(
    data: WelfareProgramDueReminderEmailData
  ): Promise<void> {
    const portalUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      ""
    const html = await render(
      WelfareProgramDueReminderEmail({
        amount: data.amount,
        dueDate: data.dueDate,
        frequency: data.frequency,
        memberName: data.memberName,
        organizationName: data.organizationName,
        portalUrl,
        programTitle: data.programTitle,
      })
    )

    await this.sendEmail({
      to: data.memberEmail,
      subject: `Reminder: ${data.programTitle} is due tomorrow`,
      html,
      text: `Hello ${data.memberName}, ${data.organizationName} reminds you that ${data.programTitle} is due on ${data.dueDate}. Amount: GHS ${data.amount.toFixed(2)}. Frequency: ${data.frequency}.`,
    })
  }

  async sendPaymentSuccessEmail(data: PaymentSuccessEmailData): Promise<void> {
    const portalUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      ""
    const html = await render(
      PaymentSuccessEmail({
        amount: data.amount,
        memberName: data.memberName,
        organizationName: data.organizationName,
        paidAt: data.paidAt,
        portalUrl,
        programTitle: data.programTitle,
        reference: data.reference,
      })
    )

    await this.sendEmail({
      to: data.memberEmail,
      subject: `Payment confirmed: ${data.programTitle}`,
      html,
      text: `Hello ${data.memberName}, your payment of GHS ${data.amount.toFixed(2)} for ${data.programTitle} was confirmed. Reference: ${data.reference}. Paid at: ${data.paidAt}.`,
    })
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error("Email service connection failed:", error)
      return false
    }
  }
}

export const emailService = new EmailService()
