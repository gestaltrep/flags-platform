export default function CheckinGatePage() {
  return (
    <main style={{
      position: "fixed",
      inset: 0,
      background: "black",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <img
        src="/checkin-gate.png"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 0.9,
        }}
      />
      <div style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        fontFamily: '"Courier New", monospace',
        color: "#8b0000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
      }}>
        <div style={{
          fontSize: "clamp(11px, 2vw, 14px)",
          letterSpacing: 4,
          textTransform: "uppercase",
          lineHeight: 2,
          textShadow: "0 0 12px #8b0000",
        }}>
          <div>{">"} SIGNO RESEARCH GROUP</div>
          <div>{">"} RESTRICTED ACCESS TERMINAL</div>
          <div>{">"} AUTHORIZATION REQUIRED</div>
          <div style={{ marginTop: 8, color: "#555", fontSize: "clamp(9px, 1.5vw, 11px)", letterSpacing: 3 }}>
            ENTRY PROTOCOL INACTIVE
          </div>
        </div>
      </div>
    </main>
  );
}
