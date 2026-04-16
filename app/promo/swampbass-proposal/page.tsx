"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import { logoBase64, groupNameBase64 } from "./imageData";

export default function SwampBassProposalPage() {
  const exportRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    const el = document.getElementById("proposal-export");
    if (!el) return;
    try {
      // Force the element to render at its full size regardless of viewport
      const originalStyle = el.style.cssText;
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";

      // Wait for layout to settle
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
      });

      // Restore original positioning
      el.style.cssText = originalStyle;

      const link = document.createElement("a");
      link.download = "SwampBass_Proposal.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      // Restore if error
      const el2 = document.getElementById("proposal-export");
      if (el2) el2.style.cssText = "";
    }
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 8.5in 14in;
            margin: 0;
          }
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div style={{ background: "#1a1a1a", minHeight: "100vh", padding: "40px 0" }}>
        <div
          ref={exportRef}
          id="proposal-export"
          style={{
            width: "8.5in",
            height: "12in",
            overflow: "hidden",
            position: "relative",
            margin: "0 auto",
            backgroundColor: "#fff",
            color: "#000",
            padding: "24px",
            fontFamily: '"Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        >
          <div style={{ border: "3px solid #000", padding: "40px", height: "100%", boxSizing: "border-box" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={logoBase64} alt="Signo logo" style={{ width: 64, height: 64, filter: "invert(1)" }} />
            <img src={groupNameBase64} alt="Signo Research Group" style={{ height: 44, width: "auto", filter: "invert(1)" }} />
          </div>
          <div style={{ height: 3, backgroundColor: "#000", marginTop: 16, marginBottom: 24 }} />

          {/* Title */}
          <div style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 3, marginBottom: 20, lineHeight: 1.5, textTransform: "uppercase" }}>
            SwampBass Involvement in RAVE_Initiation.html
          </div>

          {/* Organizer note */}
          <div style={{ fontStyle: "italic", fontSize: 12, marginBottom: 24, lineHeight: 1.4 }}>
            Azazel_ver1.0.0 LLC (hereinafter referred to as <strong>&ldquo;the Organizer&rdquo;</strong>) is the organizing entity of this event and shall be referred to as such throughout this proposal.
          </div>

          {/* Section I */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 20, marginBottom: 12, textTransform: "uppercase" }}>
            I. Rentals from SwampBass
          </div>
          <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
            The Organizer proposes to rent the following equipment from SwampBass for the duration of the event:
          </div>
          <div style={{ marginBottom: 6 }}>
            {[
              "Four (4) Pioneer CDJ-2000NXS2 multi-players",
              "One (1) Pioneer DJM-900NXS2 mixer",
              "One (1) DJ table",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", paddingLeft: 32, marginBottom: 4, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0, marginRight: 8 }}>&mdash;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Section II */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 20, marginBottom: 12, textTransform: "uppercase" }}>
            II. What We Ask of SwampBass
          </div>
          <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
            The Organizer is proposing that SwampBass provides and operates their own full-service bar at the event, including the following:
          </div>
          <div style={{ marginBottom: 6 }}>
            {[
              "All alcoholic and non-alcoholic beverage products for SwampBass's own individual bar, purchased from a licensed distributor",
              "A valid liquor license for SwampBass's own individual bar, permitting the sale of alcoholic beverages at the event venue",
              "Liquor liability insurance covering both bars at the event for the duration of the event. The cost of the liquor liability insurance shall be split evenly between SwampBass and the Organizer.",
              "All necessary equipment, supplies, and staffing for SwampBass's own individual bar",
              "One (1) video wall for use during the event",
              "Promotion of the event through SwampBass channels",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", paddingLeft: 32, marginBottom: 4, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0, marginRight: 8 }}>&mdash;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Section III */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 20, marginBottom: 12, textTransform: "uppercase" }}>
            III. Revenue Arrangement
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", paddingLeft: 32, marginBottom: 4, lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0, marginRight: 8 }}>&mdash;</span>
              <span>Fifteen percent (15%) of gross revenue generated from bar sales shall be remitted to <strong>Azazel_ver1.0.0 LLC</strong>. Payment of the 15% share shall be settled no later than seven (7) business days following the conclusion of the event.</span>
            </div>
            <div style={{ display: "flex", paddingLeft: 32, marginBottom: 4, lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0, marginRight: 8 }}>&mdash;</span>
              <span>SwampBass retains the remaining eighty-five percent (85%) of gross bar revenue</span>
            </div>
          </div>

          {/* Closing Divider */}
          <div style={{ height: 3, backgroundColor: "#000", marginTop: 24, marginBottom: 20 }} />

          {/* Closing Note */}
          <div style={{ marginBottom: 12, lineHeight: 1.4 }}>
            We are open to negotiating this structure further.
          </div>
          <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
            Thank you very much for the opportunity to work with you, and we look forward to conducting research together in the near future.
          </div>

          {/* Signature Block */}
          <div style={{ marginTop: 24, fontWeight: "bold" }}>
            Signo Research Group
          </div>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            fontFamily: '"Courier New", monospace',
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            background: "#fff",
            color: "#000",
            border: "2px solid #fff",
            padding: "10px 20px",
            cursor: "pointer",
            zIndex: 9999,
          }}
        >
          EXPORT PNG
        </button>
      </div>
    </>
  );
}
