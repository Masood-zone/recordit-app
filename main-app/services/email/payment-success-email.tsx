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

interface PaymentSuccessEmailProps {
  amount: number
  memberName: string
  organizationName: string
  paidAt: string
  portalUrl: string
  programTitle: string
  reference: string
}

export function PaymentSuccessEmail({
  amount,
  memberName,
  organizationName,
  paidAt,
  portalUrl,
  programTitle,
  reference,
}: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment confirmed for {programTitle}</Preview>
      <Body
        style={{ backgroundColor: "#faf8ff", fontFamily: "Arial, sans-serif" }}
      >
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
          <Heading
            style={{ color: "#003527", fontSize: "24px", margin: "0 0 12px" }}
          >
            Payment confirmed
          </Heading>
          <Text
            style={{ color: "#404944", fontSize: "15px", lineHeight: "24px" }}
          >
            Hello {memberName}, your welfare contribution to {organizationName}
            has been received successfully.
          </Text>
          <Section
            style={{
              backgroundColor: "#f2f3ff",
              borderRadius: "8px",
              margin: "20px 0",
              padding: "18px",
            }}
          >
            <Text
              style={{ color: "#131b2e", fontSize: "14px", margin: "0 0 8px" }}
            >
              Program: <strong>{programTitle}</strong>
            </Text>
            <Text
              style={{ color: "#131b2e", fontSize: "14px", margin: "0 0 8px" }}
            >
              Amount: <strong>GHS {amount.toFixed(2)}</strong>
            </Text>
            <Text
              style={{ color: "#131b2e", fontSize: "14px", margin: "0 0 8px" }}
            >
              Reference: <strong>{reference}</strong>
            </Text>
            <Text style={{ color: "#131b2e", fontSize: "14px", margin: 0 }}>
              Paid at: <strong>{paidAt}</strong>
            </Text>
          </Section>
          <Text
            style={{ color: "#404944", fontSize: "14px", lineHeight: "22px" }}
          >
            Visit {portalUrl || "your Amanah Welfare portal"} to review your
            contribution history.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
