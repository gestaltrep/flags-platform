"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 780;

/* ─── Rounded Box ─── */
const BOX_WIDTH = 944;
const BOX_HEIGHT = 263;

function RoundedBox() {
  return (
    <div
      style={{
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        border: "none",
        borderRadius: 24,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 160,
          top: 10,
          textAlign: "center",
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: "0.02em",
          color: "#222",
          whiteSpace: "nowrap",
          zIndex: 3,
        }}
      >
        PARTICIPANT INITIATION REQUEST
      </div>

      {/* Diagonal hatch */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 58,
          width: 755,
          height: 145,
          background:
            "repeating-linear-gradient(45deg, #333 0 12px, #fff 12px 25px)",
        }}
      />

      {/* White cutout behind RAVE */}
      <div
        style={{
          position: "absolute",
          left: 226,
          top: 80,
          width: 342,
          height: 100,
          background: "#fff",
          zIndex: 1,
        }}
      />

      {/* RAVE */}
      <div
        style={{
          position: "absolute",
          left: 233,
          top: 72,
          fontSize: 108,
          fontWeight: 900,
          color: "#222",
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        <span style={{ WebkitTextStroke: "3px #222", color: "#fff", fontWeight: 700, marginRight: 8 }}>R</span>
        <span style={{ WebkitTextStroke: "3px #222", color: "#fff", fontWeight: 700, marginRight: -2 }}>A</span>
        <span style={{ marginRight: 3 }}>V</span>
        <span>E</span>
      </div>

      {/* White panel behind QR */}
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 58,
          width: 140,
          height: 145,
          background: "#fff",
          zIndex: 1,
        }}
      />

      {/* QR code */}
      <div
        style={{
          position: "absolute",
          right: 36,
          top: 58,
          zIndex: 2,
        }}
      >
        <QRCodeSVG
          value="https://signoresearchgroup.com"
          size={145}
          bgColor="#ffffff"
          fgColor="#000000"
          marginSize={0}
          style={{ display: "block" }}
        />
      </div>

      {/* Red compliance text */}
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 180,
          bottom: 24,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#c12d2d",
          lineHeight: 1,
          whiteSpace: "nowrap",
          zIndex: 3,
        }}
      >
        REQUEST PARTICIPATION AND BUY ENTRY TOKENS
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function CertificateMailerPage() {
  const [scale, setScale] = useState(1);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, "2333 El Jobean Road, Port Charlotte, Florida 33948", {
        format: "CODE128",
        width: 3,
        height: 90,
        displayValue: false,
        fontSize: 14,
        font: "Courier New",
        textMargin: 6,
        lineColor: "#222",
        background: "transparent",
        margin: 0,
      });
    }
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const paddingX = 180;
      const paddingY = 120;
      const availableWidth = window.innerWidth - paddingX;
      const availableHeight = window.innerHeight - paddingY;
      setScale(
        Math.min(1, availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT)
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        background: "#dcdcdc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 90px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          id="promo-mailer-export"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            position: "relative",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* ════════════ TOP CARD ════════════ */}
          <div
            style={{
              position: "absolute",
              left: 80,
              top: 22,
              width: 1300,
              height: 660,
              background: "#fff",
              border: "1px solid #d7d7d7",
              boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 28,
                display: "flex",
                alignItems: "center",
                gap: 20,
                color: "#222",
              }}
            >
              <img
                src="/logo.png"
                alt="Signo logo"
                style={{
                  width: 130,
                  height: 130,
                  filter: "invert(1)",
                  objectFit: "contain",
                  position: "relative",
                  top: 12,
                }}
              />
              <div
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 42,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#222",
                }}
              >
                SIGNO RESEARCH GROUP
              </div>
            </div>

            {/* Postage indicia */}
            <div
              style={{
                position: "absolute",
                right: 30,
                top: 18,
                width: 176,
                height: 126,
                border: "3px solid #444",
                boxSizing: "border-box",
                textAlign: "center",
                color: "#333",
                fontSize: 22,
                lineHeight: 1.14,
                paddingTop: 55,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div style={{ position: "absolute", top: 26, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 0, height: 45, overflow: "visible" }}>
                <img
                  src="/logo-trimmed.png"
                  alt="Signo"
                  style={{
                    height: 50,
                    width: "auto",
                    objectFit: "contain",
                    filter: "invert(1)",
                    position: "relative",
                    top: -20,
                  }}
                />
                <img
                  src="/bass-tab-trimmed.png"
                  alt="Bass Tabernacle"
                  style={{
                    height: 50,
                    width: "auto",
                    objectFit: "contain",
                    filter: "invert(1)",
                    marginLeft: 8,
                    position: "relative",
                    top: -20,
                  }}
                />
              </div>
              <div>THE WORLD</div>
              <div>IS YOURS</div>
            </div>

            {/* Black line under header */}
            <div
              style={{
                position: "absolute",
                left: 184,
                top: 124,
                width: 690,
                height: 4,
                background: "#222",
              }}
            />

            {/* ── MAIN ROUNDED BOX ── */}
            <div style={{ position: "absolute", left: 54, top: 176 }}>
              <RoundedBox />
              {/* Visible border — fully independent */}
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  bottom: 10,
                  left: 0,
                  right: 12,
                  border: "4px solid #222",
                  borderRadius: 24,
                  boxSizing: "border-box",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              />
            </div>

            {/* ── BARCODE ── */}
            <div
              style={{
                position: "absolute",
                left: 106,
                top: 435,
                width: 614,
                textAlign: "center",
              }}
            >
              <svg ref={barcodeRef} />
              <div style={{
                position: "relative",
                top: -24,
                fontSize: 17,
                fontWeight: 700,
                color: "#333",
                letterSpacing: "0.02em",
                textAlign: "center",
                fontFamily: '"Courier New", monospace',
              }}>
                296-407-395-401-86-203-913
              </div>
            </div>

            {/* ── ADDRESS BLOCK ── */}
            <div
              style={{
                position: "absolute",
                left: 56,
                bottom: 34,
                fontSize: 28,
                lineHeight: 1.02,
                color: "#222",
                letterSpacing: "0.02em",
              }}
            >
              RAVE_Initiation.html
              <br />
              Port Charlotte, FL
              <br />
              May 30: 4:30 PM - 12 AM
            </div>

            {/* ── DATE BLOCK ── */}
            <div
              style={{
                position: "absolute",
                right: 52,
                bottom: 34,
                fontSize: 27,
                lineHeight: 1.08,
                textAlign: "right",
                color: "#222",
              }}
            >
              T02610
              <br />
              04/07/2026
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}