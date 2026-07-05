import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface MemberInvitationEmailProps {
  memberName: string
  organizationName: string
  password: string
  signinUrl: string
}

export function MemberInvitationEmail({
  memberName,
  organizationName,
  password,
  signinUrl,
}: MemberInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been added to {organizationName} on Amanah Welfare.</Preview>
      <Body style={{ backgroundColor: "#faf8ff", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe2dd",
            borderRadius: "8px",
            margin: "32px auto",
            padding: "28px",
            width: "520px",
          }}
        >
          <Heading style={{ color: "#003527", fontSize: "24px", margin: "0 0 12px" }}>
            Welcome to Amanah Welfare
          </Heading>
          <Text style={{ color: "#404944", fontSize: "15px", lineHeight: "24px" }}>
            Hello {memberName}, {organizationName} has added you as a member on
            Amanah Welfare.
          </Text>
          <Section
            style={{
              backgroundColor: "#f2f3ff",
              borderRadius: "8px",
              margin: "20px 0",
              padding: "18px",
            }}
          >
            <Text style={{ color: "#131b2e", fontSize: "14px", margin: "0 0 8px" }}>
              Sign in URL: {signinUrl || "Your Amanah Welfare login page"}
            </Text>
            <Text style={{ color: "#131b2e", fontSize: "14px", margin: 0 }}>
              Temporary password: <strong>{password}</strong>
            </Text>
          </Section>
          <Text style={{ color: "#404944", fontSize: "14px", lineHeight: "22px" }}>
            Please sign in and update your password from your account settings.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
