import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components"

interface OnboardingReceivedEmailProps {
  adminName: string
  organizationEmail: string
  organizationName: string
  organizationPhone: string
  organizationType: string
  signinUrl: string
}

export function OnboardingReceivedEmail({
  adminName,
  organizationEmail,
  organizationName,
  organizationPhone,
  organizationType,
  signinUrl,
}: OnboardingReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={eyebrow}>AMANAH WELFARE</Text>
            <Heading style={heading}>
              Your onboarding application is in review
            </Heading>
            <Text style={intro}>
              Hello {adminName}, welcome to Amanah Welfare. We have received the
              onboarding application for {organizationName}.
            </Text>
          </Section>

          <Section style={statusPanel}>
            <Text style={statusLabel}>Current status</Text>
            <Text style={statusValue}>Pending verification</Text>
            <Text style={statusCopy}>
              Our team will review your organization profile, brand assets, and
              admin details. You will be notified once verification is complete.
            </Text>
          </Section>

          <Section style={details}>
            <Text style={detailTitle}>Application summary</Text>
            <Text style={detailLine}>
              <strong>Organization:</strong> {organizationName}
            </Text>
            <Text style={detailLine}>
              <strong>Type:</strong> {organizationType}
            </Text>
            <Text style={detailLine}>
              <strong>Email:</strong> {organizationEmail}
            </Text>
            <Text style={detailLine}>
              <strong>Phone:</strong> {organizationPhone}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={signinUrl}>
              Visit Amanah Welfare
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            While your application is being reviewed, keep your contact details
            available in case our verification team needs clarification.
          </Text>

          <Text style={footer}>
            Thank you,
            <br />
            The Amanah Welfare Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f7f2",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "640px",
  padding: "40px",
}

const header = {
  textAlign: "center" as const,
}

const eyebrow = {
  color: "#607044",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0 0 12px",
}

const heading = {
  color: "#1f2a1b",
  fontSize: "30px",
  lineHeight: "1.2",
  margin: "0 0 16px",
}

const intro = {
  color: "#52604a",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 auto 28px",
  maxWidth: "520px",
}

const statusPanel = {
  backgroundColor: "#eef4df",
  borderRadius: "10px",
  padding: "24px",
}

const statusLabel = {
  color: "#607044",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
}

const statusValue = {
  color: "#24301f",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0 0 8px",
}

const statusCopy = {
  color: "#52604a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: 0,
}

const details = {
  border: "1px solid #e6eadc",
  borderRadius: "10px",
  marginTop: "24px",
  padding: "22px",
}

const detailTitle = {
  color: "#1f2a1b",
  fontSize: "18px",
  fontWeight: "800",
  margin: "0 0 14px",
}

const detailLine = {
  color: "#52604a",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "8px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#607044",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "700",
  padding: "13px 22px",
  textDecoration: "none",
}

const hr = {
  borderColor: "#e6eadc",
  margin: "32px 0",
}

const paragraph = {
  color: "#52604a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 20px",
}

const footer = {
  color: "#7b8573",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
}
