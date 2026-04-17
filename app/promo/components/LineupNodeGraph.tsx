"use client";

const W = 900;
const H = 560;

const HL = { x: 210, y: 30, w: 480, h: 108 };

const SUPPORTS = [
  { x: 30, y: 212, w: 240, h: 68, label: "CRAWDAD SNIPER" },
  { x: 330, y: 212, w: 240, h: 68, label: "RAFEEKI" },
  { x: 630, y: 212, w: 240, h: 68, label: "PALPA" },
];

const OPENERS = [
  { x: 30, y: 390, w: 240, h: 68, label: "OMNICHROMA", logo: "/omnichroma-trimmed.png" },
  { x: 330, y: 390, w: 240, h: 68, label: "KRIMSUN", logo: null },
  { x: 630, y: 390, w: 240, h: 68, label: "DOM", logo: null },
];

const HL_PORTS_OUT = [
  { x: 300, y: HL.y + HL.h },
  { x: 450, y: HL.y + HL.h },
  { x: 600, y: HL.y + HL.h },
];

const SUP_PORTS_IN  = SUPPORTS.map(n => ({ x: n.x + n.w / 2, y: n.y }));
const SUP_PORTS_OUT = SUPPORTS.map(n => ({ x: n.x + n.w / 2, y: n.y + n.h }));
const OPN_PORTS_IN  = OPENERS.map(n => ({ x: n.x + n.w / 2, y: n.y }));

const CABLE_COLORS = ["#777", "#aaa", "#555"];

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const d = Math.abs(y2 - y1) * 0.55;
  return `M ${x1} ${y1} C ${x1} ${y1 + d}, ${x2} ${y2 - d}, ${x2} ${y2}`;
}

function Port({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={5} fill="#000" stroke="#fff" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={2}  fill="#fff" />
    </>
  );
}

export default function LineupNodeGraph() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        background: "#000",
        fontFamily: '"Courier New", monospace',
        color: "#fff",
        border: "2px solid #fff",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Headliner node */}
      <div
        style={{
          position: "absolute",
          left: HL.x,
          top: HL.y,
          width: HL.w,
          height: HL.h,
          border: "2px solid #fff",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <img
          src="/yheti-trimmed.png"
          alt="Yheti"
          style={{ height: 52, width: "auto", maxWidth: 180, objectFit: "contain", filter: "invert(1)" }}
        />
        <span style={{ fontSize: 11, letterSpacing: 4, color: "#666", flexShrink: 0 }}>B2B</span>
        <img
          src="/toadface-trimmed.png"
          alt="Toadface"
          style={{ height: 52, width: 52, objectFit: "contain" }}
        />
      </div>

      {/* Support nodes */}
      {SUPPORTS.map((n) => (
        <div
          key={n.label}
          style={{
            position: "absolute",
            left: n.x,
            top: n.y,
            width: n.w,
            height: n.h,
            border: "1px solid #ccc",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {n.label}
        </div>
      ))}

      {/* Opener nodes */}
      {OPENERS.map((n) => (
        <div
          key={n.label}
          style={{
            position: "absolute",
            left: n.x,
            top: n.y,
            width: n.w,
            height: n.h,
            border: "1px solid #888",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 10,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {n.logo && (
            <img
              src={n.logo}
              alt={n.label}
              style={{ height: 40, width: 40, objectFit: "contain" }}
            />
          )}
          {n.label}
        </div>
      ))}

      {/* SVG patch cords + ports */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: H,
          pointerEvents: "none",
        }}
        viewBox={`0 0 ${W} ${H}`}
      >
        {/* Headliner → Support */}
        {HL_PORTS_OUT.map((p, i) => (
          <path
            key={`hl-${i}`}
            d={bezier(p.x, p.y, SUP_PORTS_IN[i].x, SUP_PORTS_IN[i].y)}
            fill="none"
            stroke={CABLE_COLORS[i]}
            strokeWidth={1.5}
          />
        ))}

        {/* Support → Opener */}
        {SUP_PORTS_OUT.map((p, i) => (
          <path
            key={`sup-${i}`}
            d={bezier(p.x, p.y, OPN_PORTS_IN[i].x, OPN_PORTS_IN[i].y)}
            fill="none"
            stroke={CABLE_COLORS[i]}
            strokeWidth={1.5}
          />
        ))}

        {/* Ports */}
        {HL_PORTS_OUT.map((p, i)  => <Port key={`phl-${i}`}  x={p.x} y={p.y} />)}
        {SUP_PORTS_IN.map((p, i)  => <Port key={`psi-${i}`}  x={p.x} y={p.y} />)}
        {SUP_PORTS_OUT.map((p, i) => <Port key={`pso-${i}`}  x={p.x} y={p.y} />)}
        {OPN_PORTS_IN.map((p, i)  => <Port key={`poi-${i}`}  x={p.x} y={p.y} />)}
      </svg>
    </div>
  );
}
