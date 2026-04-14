"use client";

import { useEffect, useState } from "react";

const POST_WIDTH = 1080;
const POST_HEIGHT = 1350; // 4:5 Instagram ratio

export default function InstagramPostPage() {
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
      const post = document.getElementById("promo-ig-export");
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
      link.download = `RAVE_Initiation_IG_${w}x${h}.png`;
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
        {/* Post at design resolution */}
        <div
          id="promo-ig-export"
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
          }}
        >
          {/* Top section — pushes down to center the logo */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 10,
          }}>
            <div style={{
              fontSize: 160,
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "0.02em",
              textAlign: "center",
            }}>
              May  30
            </div>
          </div>

          {/* Logo — centered */}
          <img
            src="/logo.png"
            alt="Signo Research Group"
            style={{
              width: 520,
              height: 520,
              objectFit: "contain",
            }}
          />

          {/* Bottom section — mirrors top to keep logo centered */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 0,
          }}>
            <div style={{
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              textAlign: "center",
            }}>
              4:30 PM - 12 AM
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              textAlign: "center",
              marginBottom: 14,
            }}>
              Port Charlotte, FL
            </div>
            <div
              style={{
                border: "3px solid #fff",
                padding: "22px 30px",
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                minWidth: 820,
              }}
            >
              <img
                src="/logo.png"
                alt="Signo"
                style={{
                  height: 96,
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              <span>signoresearchgroup.com</span>
              <img
                src="/BASS TABERNACLE.png"
                alt="Bass Tabernacle"
                style={{
                  height: 96,
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
