interface SendSMSOptions {
  message: string
  to: string
}

class SMSService {
  private apiKey = process.env.UELLOSEND_API_KEY || ""
  private senderId = process.env.UELLOSEND_SENDER_ID || "AMANAH"
  private baseUrl =
    process.env.UELLOSEND_API_URL ||
    process.env.UELLOSEND_BASE_URL ||
    "https://uellosend.com/quicksend/"

  async sendSMS(options: SendSMSOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error("UelloSend API key is missing from environment")
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        sender_id: this.senderId,
        recipient: this.formatPhoneNumber(options.to),
        message: options.message,
      }),
    })

    if (!response.ok) {
      throw new Error(`SMS provider returned ${response.status}`)
    }
  }

  async sendOnboardingReceivedSMS(args: {
    organizationName: string
    phoneNumber: string
  }): Promise<void> {
    const message = `Amanah Welfare has received ${args.organizationName}'s onboarding application. Your organization will be reviewed and verified soon.`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  async sendOrganizationApplicationDecisionSMS(args: {
    decision: "approved" | "rejected"
    organizationName: string
    phoneNumber: string
    reason?: string
  }): Promise<void> {
    const message =
      args.decision === "approved"
        ? `Amanah Welfare has approved ${args.organizationName}. You can now access your organization dashboard.`
        : `Amanah Welfare has rejected ${args.organizationName}'s application. Reason: ${args.reason || "Please contact support for details."}`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  async sendMemberInvitationSMS(args: {
    memberName: string
    organizationName: string
    password: string
    phoneNumber: string
  }): Promise<void> {
    const signinUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.BETTER_AUTH_URL ||
      ""
    const message = `Hello ${args.memberName}, ${args.organizationName} added you to Amanah Welfare. Sign in at ${signinUrl}. Temporary password: ${args.password}`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  async sendWelfareProgramEnrollmentSMS(args: {
    amount: number
    enrollmentKind: "mandatory" | "optional"
    frequency: string
    memberName: string
    organizationName: string
    phoneNumber: string
    programTitle: string
  }): Promise<void> {
    const message =
      args.enrollmentKind === "mandatory"
        ? `Hello ${args.memberName}, ${args.organizationName} enrolled you in mandatory welfare program ${args.programTitle}. Amount: GHS ${args.amount.toFixed(2)}, ${args.frequency}.`
        : `Hello ${args.memberName}, your enrollment in ${args.programTitle} is confirmed. Amount: GHS ${args.amount.toFixed(2)}, ${args.frequency}.`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  async sendWelfareProgramDueReminderSMS(args: {
    amount: number
    dueDate: string
    frequency: string
    memberName: string
    organizationName: string
    phoneNumber: string
    programTitle: string
  }): Promise<void> {
    const message = `Hello ${args.memberName}, reminder from ${args.organizationName}: ${args.programTitle} is due ${args.dueDate}. Amount: GHS ${args.amount.toFixed(2)}, ${args.frequency}.`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  async sendPaymentSuccessSMS(args: {
    amount: number
    memberName: string
    organizationName: string
    paidAt: string
    phoneNumber: string
    programTitle: string
    reference: string
  }): Promise<void> {
    const message = `Hello ${args.memberName}, ${args.organizationName} confirms your payment of GHS ${args.amount.toFixed(2)} for ${args.programTitle}. Ref: ${args.reference}. Paid: ${args.paidAt}.`

    await this.sendSMS({
      to: args.phoneNumber,
      message,
    })
  }

  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "")

    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return `233${cleaned.substring(1)}`
    }

    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return `233${cleaned.substring(1)}`
    }

    return cleaned
  }
}

export const smsService = new SMSService()
