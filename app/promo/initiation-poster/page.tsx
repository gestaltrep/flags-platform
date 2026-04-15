"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1600;

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
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            <img
              src="/header.png"
              alt="Signo Research Group"
              width={1900}
              height={252}
              style={{
                width: 1900,
                height: "auto",
                objectFit: "contain",
                display: "block",
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

          {/* ── Info block ── */}
          <div
            style={{
              position: "relative",
              height: 400,
              boxSizing: "border-box",
            }}
          >
            {/* Left: date / time / location */}
            <div
              style={{
                position: "absolute",
                left: 60,
                top: 55,
                width: 480,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                color: "#fff",
                fontWeight: 400,
                letterSpacing: "0.004em",
              }}
            >
              <div
                style={{
                  width: 480,
                  fontSize: 96,
                  lineHeight: 1,
                  marginBottom: 28,
                  textAlign: "center",
                }}
              >
                May 30
              </div>

              <div
                style={{
                  width: 480,
                  fontSize: 54,
                  fontWeight: 560,
                  lineHeight: 1.08,
                  marginBottom: 18,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                4:30 PM - 12 AM
              </div>

              <div
                style={{
                  width: 480,
                  fontSize: 54,
                  fontWeight: 560,
                  lineHeight: 1.08,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                Port Charlotte, FL
              </div>
            </div>

            {/* Right: CTA + QR */}
            <div
              style={{
                position: "absolute",
                right: 60,
                top: 55,
                width: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                color: "#fff",
                fontWeight: 560,
                letterSpacing: "0.004em",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  lineHeight: 1.18,
                  marginBottom: 16,
                }}
              >
                To participate in
                <br />
                Signo research
                <br />
                and purchase
                <br />
                Entry Tokens:
              </div>

              <div
                style={{
                  background: "#fff",
                  padding: 8,
                  lineHeight: 0,
                }}
              >
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
    </main>
  );
}
