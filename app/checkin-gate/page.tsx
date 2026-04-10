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
          0%   { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.92) saturate(0.95); }
          25%  { transform: scale(1.008) translate(-1px, 0.5px); filter: brightness(0.97) saturate(1.02); }
          50%  { transform: scale(1.012) translate(0px, 1px); filter: brightness(1.00) saturate(1.05); }
          75%  { transform: scale(1.006) translate(1px, 0.5px); filter: brightness(0.96) saturate(1.01); }
          100% { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.92) saturate(0.95); }
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
          animation: "eerieBreath 9s ease-in-out infinite",
          willChange: "transform, filter",
        }}
      />
    </main>
  );
}
