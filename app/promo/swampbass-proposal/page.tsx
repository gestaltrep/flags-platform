"use client";

import { useRef } from "react";

export default function SwampBassProposalPage() {
  const exportRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    const html2canvas = (await import("html2canvas")).default;
    const el = exportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const link = document.createElement("a");
    link.download = "swampbass-proposal.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
            height: "14in",
            overflow: "hidden",
            position: "relative",
            margin: "0 auto",
            backgroundColor: "#fff",
            color: "#000",
            border: "3px solid #000",
            padding: "40px",
            fontFamily: '"Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="/logo.png" alt="Signo logo" style={{ width: 64, height: 64, filter: "invert(1)" }} />
            <img src="/group-name.png" alt="Signo Research Group" style={{ height: 44, width: "auto", filter: "invert(1)" }} />
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
          <div style={{ paddingLeft: 32, marginBottom: 6 }}>
            {[
              "Four (4) Pioneer CDJ-2000NXS2 multi-players",
              "One (1) Pioneer DJM-900NXS2 mixer",
              "One (1) DJ table",
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>&mdash; {item}</div>
            ))}
          </div>

          {/* Section II */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 20, marginBottom: 12, textTransform: "uppercase" }}>
            II. What We Ask of SwampBass
          </div>
          <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
            The Organizer is proposing that SwampBass provides and operates their own full-service bar at the event, including the following:
          </div>
          <div style={{ paddingLeft: 32, marginBottom: 6 }}>
            {[
              "All alcoholic and non-alcoholic beverage products, purchased from a licensed distributor",
              "A valid liquor license permitting the sale of alcoholic beverages at the event venue",
              "Liquor liability insurance covering the duration of the event",
              "All necessary bar equipment, supplies, and staffing",
              "One (1) video wall for use during the event",
              "Promotion of the event through SwampBass channels",
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>&mdash; {item}</div>
            ))}
          </div>

          {/* Section III */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 20, marginBottom: 12, textTransform: "uppercase" }}>
            III. Revenue Arrangement
          </div>
          <div style={{ paddingLeft: 32, marginBottom: 6 }}>
            <div style={{ marginBottom: 4, lineHeight: 1.4 }}>&mdash; Fifteen percent (15%) of gross revenue generated from bar sales shall be remitted to <strong>Azazel_ver1.0.0 LLC</strong>. Payment of the 15% share shall be settled no later than seven (7) business days following the conclusion of the event.</div>
            <div style={{ marginBottom: 4, lineHeight: 1.4 }}>&mdash; SwampBass retains the remaining eighty-five percent (85%) of gross bar revenue</div>
          </div>

          {/* Closing Divider */}
          <div style={{ height: 3, backgroundColor: "#000", marginTop: 24, marginBottom: 20 }} />

          {/* Closing Note */}
          <div style={{ marginBottom: 8, lineHeight: 1.4 }}>
            Thank you very much for the opportunity to work with you, and we look forward to conducting research together in the near future.
          </div>

          {/* Signature Block */}
          <div style={{ marginTop: 24, fontWeight: "bold" }}>
            Signo Research Group
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
