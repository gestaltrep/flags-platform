"use client";

import { useEffect, useState } from "react";

const POST_WIDTH = 2160;
const POST_HEIGHT = 2160; // 1:1 Instagram square ratio

export default function InstagramSquarePage() {
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const paddingX = 180;
      const paddingY = 120;
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;
      setScale(
        Math.min(1, availableWidth / POST_WIDTH, availableHeight / POST_HEIGHT)
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleExport = async (scaleFactor: number = 4) => {
    if (exporting) return;
    setExporting(true);

    try {
      const post = document.getElementById("promo-square-export");
      if (!post) return;

      const wrapper = post.parentElement as HTMLElement;
      const savedTransform = wrapper.style.transform;

      wrapper.style.transform = "none";
      await new Promise((r) => setTimeout(r, 400));

      const w = POST_WIDTH * scaleFactor;
      const h = POST_HEIGHT * scaleFactor;

      const domtoimage = (await import("dom-to-image-more")).default;

      const dataUrl = await domtoimage.toPng(post, {
        width: w,
        height: h,
        style: {
          transform: `scale(${scaleFactor})`,
          transformOrigin: "top left",
          width: `${POST_WIDTH}px`,
          height: `${POST_HEIGHT}px`,
        },
        quality: 1.0,
      });

      const link = document.createElement("a");
      link.download = `RAVE_Initiation_square_${w}x${h}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      wrapper.style.transform = savedTransform;
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "#1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 90px",
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={() => handleExport(4)}
        disabled={exporting}
        style={{
          position: "fixed",
          top: 18,
          right: 24,
          zIndex: 9999,
          padding: "10px 22px",
          background: exporting ? "#444" : "#fff",
          color: "#000",
          border: "none",
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1.5,
          cursor: exporting ? "wait" : "pointer",
          textTransform: "uppercase",
        }}
      >
        {exporting ? "Rendering\u2026" : "Export PNG (4\u00d7)"}
      </button>

      {/* Preview wrapper */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Square at design resolution */}
        <div
          id="promo-square-export"
          style={{
            width: POST_WIDTH,
            height: POST_HEIGHT,
            background: "#000",
            color: "#fff",
            overflow: "hidden",
            position: "relative",
            fontFamily: '"Courier New", Courier, monospace',
            boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Equilateral triangle — 5 tiers, centered on canvas */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 84,
            }}
          >
            {/* Tier 1: Logo capstone */}
            <img
              src="/logo-trimmed.png"
              alt="Signo Research Group"
              style={{
                width: 566,
                height: 566,
                objectFit: "contain",
              }}
            />

            {/* Tier 2: May 30 */}
            <div
              style={{
                fontSize: 198,
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "0.02em",
                textAlign: "center",
              }}
            >
              May  30
            </div>

            {/* Tier 3: Time */}
            <div
              style={{
                fontSize: 120,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "0.01em",
                textAlign: "center",
              }}
            >
              4:30 PM - 12 AM
            </div>

            {/* Tier 4: Place */}
            <div
              style={{
                fontSize: 134,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "0.01em",
                textAlign: "center",
              }}
            >
              Port Charlotte, FL
            </div>

            {/* Tier 5: Button base */}
            <div
              style={{
                border: "6px solid #fff",
                padding: "44px 0",
                fontSize: 76,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 48,
                width: 1600,
              }}
            >
              <img
                src="/logo-trimmed.png"
                alt="Signo"
                style={{
                  height: 104,
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                  marginLeft: -60,
                }}
              />
              <span>SIGNORESEARCHGROUP.COM</span>
              <img
                src="/bass-tab-trimmed.png"
                alt="Bass Tabernacle"
                style={{
                  height: 104,
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                  marginRight: -60,
                }}
              />
            </div>
          </div>

          {/* Event name overlay */}
          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 20,
              fontSize: 62,
              fontWeight: 700,
              letterSpacing: "0.01em",
              textShadow: "0 2px 8px rgba(0,0,0,0.75)",
            }}
          >
            RAVE_Initiation.html
          </div>
        </div>
      </div>
    </main>
  );
}
