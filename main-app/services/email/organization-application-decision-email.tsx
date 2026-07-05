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

interface OrganizationApplicationDecisionEmailProps {
  adminName: string
  decision: "approved" | "rejected"
  dashboardUrl: string
  organizationName: string
  reason?: string
}

export function OrganizationApplicationDecisionEmail({
  adminName,
  dashboardUrl,
  decision,
  organizationName,
  reason,
}: OrganizationApplicationDecisionEmailProps) {
  const approved = decision === "approved"

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={eyebrow}>AMANAH WELFARE</Text>
            <Heading style={heading}>
              {approved
                ? "Your organization has been approved"
                : "Your organization application needs attention"}
            </Heading>
            <Text style={intro}>
              Hello {adminName}, we have completed the review for{" "}
              {organizationName}.
            </Text>
          </Section>

          <Section style={approved ? approvedPanel : rejectedPanel}>
            <Text style={statusLabel}>Application status</Text>
            <Text style={statusValue}>{approved ? "Approved" : "Rejected"}</Text>
            <Text style={statusCopy}>
              {approved
                ? "Your organization can now access Amanah Welfare and begin setting up welfare programs for your members."
                : "Your submitted application did not meet our current verification requirements. Review the reason below and prepare the needed corrections before resubmitting."}
            </Text>
          </Section>

          {!approved && reason ? (
            <Section style={reasonBox}>
              <Text style={detailTitle}>Reason for rejection</Text>
              <Text style={detailLine}>{reason}</Text>
            </Section>
          ) : null}

          <Section style={details}>
            <Text style={detailTitle}>Organization</Text>
            <Text style={detailLine}>{organizationName}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              {approved ? "Open Dashboard" : "Visit Amanah Welfare"}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={paragraph}>
            {approved
              ? "Please keep your organization profile and contact details up to date so members can identify your programs confidently."
              : "If you believe this decision was made in error, contact Amanah Welfare support with your organization details."}
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

const approvedPanel = {
  backgroundColor: "#eaf7ef",
  borderRadius: "10px",
  padding: "24px",
}

const rejectedPanel = {
  backgroundColor: "#fff0ec",
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

const reasonBox = {
  backgroundColor: "#fff8f5",
  border: "1px solid #f0cfc5",
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
  backgroundColor: "#003527",
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
