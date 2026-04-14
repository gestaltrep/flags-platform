"use client";

import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1770;

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

      // Save original styles
      const savedWrapperTransform = wrapper.style.transform;
      const savedWrapperPosition = wrapper.style.position;
      const savedWrapperLeft = wrapper.style.left;
      const savedWrapperTop = wrapper.style.top;
      const savedWrapperZIndex = wrapper.style.zIndex;
      const savedBodyOverflow = document.body.style.overflow;

      // Pull the wrapper out of flex flow so the poster
      // renders at true 1080×1770 even if viewport is narrower
      wrapper.style.transform = "none";
      wrapper.style.position = "fixed";
      wrapper.style.left = "0px";
      wrapper.style.top = "0px";
      wrapper.style.zIndex = "-1";
      document.body.style.overflow = "hidden";

      // Wait for reflow
      await new Promise((r) => setTimeout(r, 400));

      const canvas = await html2canvas(poster, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#000000",
        width: 1080,
        height: 1770,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        logging: false,
      });

      // Trigger download
      const link = document.createElement("a");
      link.download = `RAVE_Initiation_poster_${canvas.width}x${canvas.height}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Restore everything
      wrapper.style.transform = savedWrapperTransform;
      wrapper.style.position = savedWrapperPosition;
      wrapper.style.left = savedWrapperLeft;
      wrapper.style.top = savedWrapperTop;
      wrapper.style.zIndex = savedWrapperZIndex;
      document.body.style.overflow = savedBodyOverflow;
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
        {exporting ? "Rendering…" : "Export PNG (4×)"}
      </button>

      {/* ── Preview wrapper (scale for viewport) ── */}
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
            {/* plain <img> so html2canvas renders it correctly */}
            <img
              src="/header.png"
              alt="Signo Research Group"
              width={1065}
              height={252}
              style={{
                width: 1065,
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
              height: 1010,
              overflow: "hidden",
              background: "#000",
            }}
          >
            {/* plain <img> — Next Image's srcset/wrapper breaks html2canvas */}
            <img
              src="/initiation-main.png"
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
                  width: 110,
                  height: 110,
                  objectFit: "contain",
                  marginLeft: -35,
                }}
              />
            </div>
          </div>

          {/* ── Info block ── */}
          <div
            style={{
              position: "relative",
              height: 460,
              boxSizing: "border-box",
            }}
          >
            {/* Left: date / time / location */}
            <div
              style={{
                position: "absolute",
                left: 92,
                top: 72,
                width: 460,
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
                  width: 430,
                  fontSize: 88,
                  lineHeight: 1,
                  marginBottom: 28,
                  textAlign: "center",
                }}
              >
                May 30
              </div>

              <div
                style={{
                  width: 430,
                  fontSize: 48,
                  fontWeight: 560,
                  lineHeight: 1.08,
                  marginBottom: 24,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                4:30 PM - 12 AM
              </div>

              <div
                style={{
                  width: 500,
                  fontSize: 48,
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
                right: 54,
                top: 66,
                width: 380,
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
                  fontSize: 35,
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
