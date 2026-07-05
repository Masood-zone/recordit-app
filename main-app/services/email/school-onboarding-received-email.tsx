type SchoolOnboardingReceivedEmailProps = {
  contactName: string
  schoolName: string
  signinUrl: string
}

export function SchoolOnboardingReceivedEmail({
  contactName,
  schoolName,
  signinUrl,
}: SchoolOnboardingReceivedEmailProps) {
  return (
    <div
      style={{
        background: "#f7f9ff",
        color: "#0d1d2a",
        fontFamily: "Arial, sans-serif",
        padding: "32px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #c5c6d2",
          borderRadius: "18px",
          margin: "0 auto",
          maxWidth: "640px",
          padding: "32px",
        }}
      >
        <p style={{ color: "#2552ca", fontWeight: 700, margin: 0 }}>RecordIT</p>
        <h1 style={{ color: "#00113a", fontSize: "28px", marginBottom: 12 }}>
          School application received
        </h1>
        <p style={{ lineHeight: 1.6 }}>
          Hello {contactName}, RecordIT has received the onboarding application
          for {schoolName}. Your school profile and administrator account are
          now under review.
        </p>
        <p style={{ lineHeight: 1.6 }}>
          We will notify you when the RecordIT team approves the school. Until
          then, your administrator can sign in to view the approval status.
        </p>
        <a
          href={signinUrl}
          style={{
            background: "#2552ca",
            borderRadius: "12px",
            color: "#ffffff",
            display: "inline-block",
            fontWeight: 700,
            marginTop: "18px",
            padding: "14px 20px",
            textDecoration: "none",
          }}
        >
          View approval status
        </a>
      </div>
    </div>
  )
}
