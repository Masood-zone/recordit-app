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

interface WelfareProgramEnrollmentEmailProps {
  amount: number
  enrollmentKind: "mandatory" | "optional"
  frequency: string
  memberName: string
  organizationName: string
  portalUrl: string
  programTitle: string
}

export function WelfareProgramEnrollmentEmail({
  amount,
  enrollmentKind,
  frequency,
  memberName,
  organizationName,
  portalUrl,
  programTitle,
}: WelfareProgramEnrollmentEmailProps) {
  const mandatory = enrollmentKind === "mandatory"

  return (
    <Html>
      <Head />
      <Preview>
        {mandatory ? "Mandatory enrollment" : "Enrollment confirmed"}:{" "}
        {programTitle}
      </Preview>
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
            Welfare program enrollment
          </Heading>
          <Text style={{ color: "#404944", fontSize: "15px", lineHeight: "24px" }}>
            Hello {memberName}, {mandatory ? organizationName : "you"}{" "}
            {mandatory
              ? "has enrolled you in a mandatory welfare program."
              : "have successfully enrolled in this welfare program."}
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
              Program: <strong>{programTitle}</strong>
            </Text>
            <Text style={{ color: "#131b2e", fontSize: "14px", margin: "0 0 8px" }}>
              Contribution: <strong>GHS {amount.toFixed(2)}</strong>
            </Text>
            <Text style={{ color: "#131b2e", fontSize: "14px", margin: 0 }}>
              Frequency: <strong>{frequency}</strong>
            </Text>
          </Section>
          <Text style={{ color: "#404944", fontSize: "14px", lineHeight: "22px" }}>
            Visit {portalUrl || "your Amanah Welfare portal"} to review your
            welfare program details.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
