export default function CheckinGatePage() {
  return (
    <main style={{
      position: "fixed",
      inset: 0,
      background: "black",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes eerieBreath {
          0%   { transform: scale(1.00); filter: brightness(0.85) saturate(1.0); }
          50%  { transform: scale(1.06); filter: brightness(1.08) saturate(1.4); }
          100% { transform: scale(1.00); filter: brightness(0.85) saturate(1.0); }
        }
      `}</style>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          animation: "eerieBreath 6s ease-in-out infinite",
          willChange: "transform, filter",
        }}
      >
        <source src="/thislong.mp4" type="video/mp4" />
      </video>
    </main>
  );
}
