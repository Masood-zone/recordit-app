type PasswordResetEmailProps = {
  resetUrl: string
  userName: string
}

export function PasswordResetEmail({
  resetUrl,
  userName,
}: PasswordResetEmailProps) {
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
        <p style={{ color: "#2552ca", fontWeight: 700, margin: 0 }}>
          RecordIT
        </p>
        <h1 style={{ color: "#00113a", fontSize: "28px", marginBottom: 12 }}>
          Reset your password
        </h1>
        <p style={{ lineHeight: 1.6 }}>
          Hello {userName}, we received a request to reset the password for your
          RecordIT account.
        </p>
        <p style={{ lineHeight: 1.6 }}>
          Use the secure link below to choose a new password. If you did not
          request this, you can safely ignore this message.
        </p>
        <a
          href={resetUrl}
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
          Reset password
        </a>
        <p style={{ color: "#444650", fontSize: "13px", lineHeight: 1.6 }}>
          For your security, this link expires automatically.
        </p>
      </div>
    </div>
  )
}
