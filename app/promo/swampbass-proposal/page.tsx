"use client";

export default function SwampBassProposalPage() {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 8.5in 14in;
            margin: 0;
          }
          body {
            background: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div style={{ background: "#000", minHeight: "100vh", padding: "40px 0" }}>
        <div
          style={{
            width: "8.5in",
            minHeight: "14in",
            margin: "0 auto",
            backgroundColor: "#000",
            color: "#fff",
            border: "3px solid #fff",
            padding: "60px",
            fontFamily: '"Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.7,
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="/logo.png" alt="Signo logo" style={{ width: 50, height: 50 }} />
            <img src="/group-name.png" alt="Signo Research Group" style={{ height: 34, width: "auto" }} />
          </div>
          <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.3)", marginTop: 24, marginBottom: 40 }} />

          {/* Date */}
          <div style={{ marginBottom: 28 }}>April 15, 2026</div>

          {/* Recipient */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>SwampBass</div>
            <div style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Via Electronic Delivery
            </div>
          </div>

          {/* Subject */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 2, textTransform: "uppercase" }}>
            RE: Proposal for Bar Services &amp; Equipment Partnership
          </div>
          <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.3)", marginTop: 16, marginBottom: 36 }} />

          {/* Salutation */}
          <div style={{ marginBottom: 24 }}>Dear SwampBass,</div>

          {/* Intro */}
          <div style={{ marginBottom: 24 }}>
            Signo Research Group is pleased to present this proposal for a collaborative partnership in connection with our upcoming event production. We believe this arrangement will be mutually beneficial and look forward to discussing the terms outlined herein.
          </div>

          {/* Section I */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 36, marginBottom: 20, textTransform: "uppercase" }}>
            I. Scope of Services
          </div>
          <div style={{ marginBottom: 16 }}>
            SwampBass shall provide and operate a full-service bar at the event, including but not limited to the following:
          </div>
          <div style={{ paddingLeft: 32, marginBottom: 24 }}>
            {[
              "All alcoholic and non-alcoholic beverage products",
              "A valid liquor license permitting the sale of alcoholic beverages at the event venue",
              "Liquor liability insurance covering the duration of the event",
              "All necessary bar equipment, supplies, staffing, and operational infrastructure",
              "One (1) video wall, to be provided and operated by SwampBass",
              "One (1) DJ table, to be provided by SwampBass",
            ].map((item, i) => (
              <div key={i}>&mdash; {item}</div>
            ))}
          </div>

          {/* Section II */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 36, marginBottom: 20, textTransform: "uppercase" }}>
            II. Equipment Provided by Signo Research Group
          </div>
          <div style={{ marginBottom: 16 }}>
            As part of this partnership, Signo Research Group shall rent and provide the following DJ equipment at its own expense:
          </div>
          <div style={{ paddingLeft: 32, marginBottom: 16 }}>
            {[
              "Four (4) Pioneer CDJ-2000NXS2 multi-players",
              "One (1) Pioneer DJM-900NXS2 mixer",
            ].map((item, i) => (
              <div key={i}>&mdash; {item}</div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            This equipment will be rented by Signo Research Group and made available for the duration of the event at no cost to SwampBass.
          </div>

          {/* Section III */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 36, marginBottom: 20, textTransform: "uppercase" }}>
            III. Revenue Sharing
          </div>
          <div style={{ marginBottom: 16 }}>
            In consideration of the event venue, production, audience, and DJ equipment provided by Signo Research Group, SwampBass agrees to the following revenue arrangement:
          </div>
          <div style={{ paddingLeft: 32, marginBottom: 16 }}>
            <div>&mdash; Fifteen percent (15%) of gross revenue generated from bar sales shall be remitted to <strong>Azazel_ver1.0.0 LLC</strong></div>
            <div>&mdash; SwampBass shall retain the remaining eighty-five percent (85%) of gross bar revenue</div>
          </div>
          <div style={{ marginBottom: 24 }}>
            Payment of the 15% share shall be settled no later than seven (7) business days following the conclusion of the event.
          </div>

          {/* Section IV */}
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 3, marginTop: 36, marginBottom: 20, textTransform: "uppercase" }}>
            IV. General Terms
          </div>
          <div style={{ marginBottom: 24 }}>
            This proposal is intended as a summary of the principal terms of the proposed arrangement. Upon mutual agreement, a formal contract incorporating these and other customary terms will be prepared and executed by both parties.
          </div>

          {/* Closing Divider */}
          <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.3)", marginTop: 40, marginBottom: 32 }} />

          {/* Closing Note */}
          <div style={{ marginBottom: 24 }}>
            Thank you very much for the opportunity to work with you, and we look forward to conducting research together in the near future.
          </div>

          {/* Signature Block */}
          <div style={{ marginTop: 48 }}>
            <div>Respectfully,</div>
            <div style={{ marginTop: 60, width: 240, borderBottom: "2px solid rgba(255,255,255,0.5)" }} />
            <div style={{ marginTop: 12, fontWeight: "bold" }}>Signo Research Group</div>
            <div style={{ fontStyle: "italic", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              on behalf of Azazel_ver1.0.0 LLC
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
