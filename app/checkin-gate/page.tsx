export default function CheckinGatePage() {
  return (
    <main style={{
      position: "fixed",
      inset: 0,
      background: "black",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes eerieBreath {
          0%   { transform: scale(1.00); filter: brightness(0.85) saturate(1.0); }
          50%  { transform: scale(1.04); filter: brightness(1.05) saturate(1.3); }
          100% { transform: scale(1.00); filter: brightness(0.85) saturate(1.0); }
        }
      `}</style>
      <img
        src="/thislong.png"
        alt=""
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
      />
    </main>
  );
}
