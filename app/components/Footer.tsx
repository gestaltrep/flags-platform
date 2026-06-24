export default function Footer() {
  return (
    <footer
      style={{
        fontFamily: '"Courier New", monospace',
        fontSize: "10px",
        letterSpacing: "1px",
        color: "#ffffff",
        padding: "32px 20px 28px 20px",
        marginTop: "28px",
        borderTop: "1px solid #333",
        lineHeight: "1.8",
      }}
    >
      <div style={{ maxWidth: "720px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
          SIGNO RESEARCH GROUP
        </div>

        <div style={{ marginBottom: "10px" }}>
          SUPPORT:{" "}
          <a
            href="mailto:support.signoresearchgroup@gmail.com"
            style={{ textDecoration: "underline" }}
          >
            support.signoresearchgroup@gmail.com
          </a>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            Privacy Policy
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="/terms" style={{ textDecoration: "underline" }}>
            Terms
          </a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="/sms-opt-in" style={{ textDecoration: "underline" }}>
            SMS Terms &amp; Opt-In
          </a>
        </div>
      </div>
    </footer>
  );
}
