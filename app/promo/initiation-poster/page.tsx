"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1540;

export default function InitiationPosterPage() {
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      const paddingX = 180;
      const paddingY = 120;
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;
      setScale(
        Math.min(
          1,
          availableWidth / POSTER_WIDTH,
          availableHeight / POSTER_HEIGHT
        )
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  /* ── export handler ── */
  const handleExport = async (scaleFactor: number = 4) => {
    if (exporting) return;
    setExporting(true);

    try {
      const poster = document.getElementById("promo-poster-export");
      if (!poster) return;

      const wrapper = poster.parentElement as HTMLElement;
      const savedTransform = wrapper.style.transform;

      // Strip preview scale — poster must be at true 1080x1770
      wrapper.style.transform = "none";
      await new Promise((r) => setTimeout(r, 400));

      const w = POSTER_WIDTH * scaleFactor;
      const h = POSTER_HEIGHT * scaleFactor;

      const domtoimage = (await import("dom-to-image-more")).default;
      const dataUrl = await domtoimage.toPng(poster, {
        width: w,
        height: h,
        style: {
          transform: `scale(${scaleFactor})`,
          transformOrigin: "top left",
          width: `${POSTER_WIDTH}px`,
          height: `${POSTER_HEIGHT}px`,
        },
        quality: 1.0,
      });

      // Trigger download
      const link = document.createElement("a");
      link.download = `RAVE_Initiation_poster_${w}x${h}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Restore preview
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
      {/* ── Export button ── */}
      <button
        data-export-ignore="true"
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

      {/* ── Preview wrapper ── */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* ── Poster at design resolution ── */}
        <div
          ref={posterRef}
          id="promo-poster-export"
          style={{
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            background: "#000",
            color: "#fff",
            overflow: "hidden",
            position: "relative",
            fontFamily: '"Courier New", Courier, monospace',
            boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            border: "2px solid #fff",
            boxSizing: "border-box",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              height: 340,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
            <img
              src="/header-text-only.png"
              alt="Signo Research Group"
              width={900}
              height={252}
              style={{
                width: 900,
                height: "auto",
                objectFit: "contain",
                display: "block",
                marginTop: 87,
              }}
            />
            <img
              src="/logo-trimmed.png"
              alt=""
              style={{
                position: "absolute",
                top: 54,
                left: "50%",
                transform: "translateX(-50%)",
                width: 130,
                height: "auto",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* ── Hero image ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 840,
              overflow: "hidden",
              background: "#000",
              borderTop: "2px solid #fff",
            }}
          >
            <img
              src="/initiation-main-cropped.png"
              alt="Rave Initiation poster image"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
              }}
            />

            {/* event name overlay */}
            <div
              style={{
                position: "absolute",
                right: 12,
                bottom: 10,
                color: "#fff",
                fontSize: 31,
                fontWeight: 700,
                letterSpacing: "0.01em",
                textShadow: "0 2px 8px rgba(0,0,0,0.75)",
              }}
            >
              RAVE_Initiation.html
            </div>

            {/* Signo + Bass Tabernacle logos */}
            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: -10,
                display: "flex",
                alignItems: "flex-end",
                gap: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="Signo"
                style={{
                  width: 110,
                  height: 110,
                  objectFit: "contain",
                  position: "relative",
                  top: 10,
                }}
              />
              <img
                src="/BASS TABERNACLE.png"
                alt="Bass Tabernacle"
                style={{
                  width: 122,
                  height: 122,
                  objectFit: "contain",
                  marginLeft: -35,
                  position: "relative",
                  top: 2,
                }}
              />
            </div>
          </div>

          {/* ── Info block — outlined grid ── */}
          <div
            style={{
              position: "relative",
              height: 360,
              boxSizing: "border-box",
              borderTop: "2px solid #fff",
              display: "flex",
            }}
          >
            {/* Left half — date / time / place */}
            <div
              style={{
                flex: 1,
                borderRight: "2px solid #fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 400,
                letterSpacing: "0.004em",
              }}
            >
              <div
                style={{
                  fontSize: 76,
                  lineHeight: 1,
                  marginBottom: 18,
                  textAlign: "center",
                  letterSpacing: "0.004em",
                }}
              >
                May 30
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 560,
                  lineHeight: 1.08,
                  marginBottom: 14,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  letterSpacing: "0.004em",
                }}
              >
                4:30 PM - 12 AM
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 560,
                  lineHeight: 1.08,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  letterSpacing: "0.004em",
                }}
              >
                Port Charlotte, FL
              </div>
            </div>

            {/* Right half — CTA + QR stacked */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Upper: CTA text */}
              <div
                style={{
                  flex: 1,
                  borderBottom: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#fff",
                  fontWeight: 560,
                  letterSpacing: "0.004em",
                }}
              >
                <div style={{ fontSize: 32, lineHeight: 1.18, textAlign: "center" }}>
                  <div style={{ letterSpacing: "0.06em" }}>To participate in</div>
                  <div style={{ letterSpacing: "0.04em" }}>Signo research</div>
                  <div style={{ letterSpacing: "0.08em" }}>and purchase</div>
                  <div style={{ letterSpacing: "0.04em" }}>Entry Tokens</div>
                </div>
              </div>

              {/* Lower: QR code */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src="/7.png"
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center center",
                    opacity: 0.15,
                    zIndex: 0,
                    transform: "rotate(180deg)",
                  }}
                />
                <div style={{ position: "relative", zIndex: 2 }}>
                  {/* QR code */}
                  <div style={{
                    background: "#fff",
                    padding: 8,
                    lineHeight: 0,
                  }}>
                    <QRCodeSVG
                      value="https://signoresearchgroup.com"
                      size={118}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      marginSize={0}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
