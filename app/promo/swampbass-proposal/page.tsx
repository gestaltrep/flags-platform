"use client";

import { toPng } from "html-to-image";
import { logoBase64, groupNameBase64 } from "./imageData";

export default function SwampBassProposalPage() {

  const exportPages = async () => {
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`proposal-page-${i}`);
      if (!el) continue;
      const originalStyle = el.style.cssText;
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: el.scrollWidth,
        height: el.scrollHeight,
      });
      el.style.cssText = originalStyle;
      const link = document.createElement("a");
      link.download = `SwampBass_Proposal_Page_${i}.png`;
      link.href = dataUrl;
      link.click();
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  const pageStyle: React.CSSProperties = {
    width: "8.5in",
    height: "14in",
    backgroundColor: "#fff",
    color: "#000",
    fontFamily: '"Courier New", monospace',
    fontSize: 14,
    lineHeight: 1.5,
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "24px",
  };

  const innerBorderStyle: React.CSSProperties = {
    border: "3px solid #000",
    padding: "40px",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  const sectionHeading: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 3,
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
  };

  const bodyPara: React.CSSProperties = {
    marginBottom: 8,
    lineHeight: 1.4,
  };

  function Bullet({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", paddingLeft: 32, marginBottom: 4, lineHeight: 1.4 }}>
        <span style={{ flexShrink: 0, marginRight: 8 }}>&mdash;</span>
        <span>{children}</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: 8.5in 14in; margin: 0; }
          body { background: #fff !important; }
        }
      `}</style>

      <div style={{ background: "#1a1a1a", minHeight: "100vh", padding: "40px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* ── PAGE 1 ── */}
          <div id="proposal-page-1" style={{ ...pageStyle, breakAfter: "page", marginBottom: "40px" }}>
            <div style={innerBorderStyle}>

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
              <div style={sectionHeading}>I. Rentals from SwampBass</div>
              <div style={bodyPara}>
                The Organizer proposes to rent the following equipment from SwampBass for the duration of the event, per the headliner&apos;s tech rider:
              </div>
              <div style={{ marginBottom: 6 }}>
                <Bullet>One (1) Pioneer DJM-900NXS2 mixer (Pioneer DJM-A9 acceptable with Organizer approval)</Bullet>
                <Bullet>Four (4) Pioneer CDJ-2000NXS2 or CDJ-3000 decks with latest firmware updates</Bullet>
                <Bullet>All players must be numbered and linked through a networking hub with six (6) or more working ethernet ports, including ethernet cables</Bullet>
                <Bullet>One (1) microphone</Bullet>
                <Bullet>One (1) HDMI cable (male-end) run to the DJ booth, connecting to the house video processing hub for visuals</Bullet>
                <Bullet>One (1) sturdy DJ table with risers, minimum eight (8) feet in length</Bullet>
                <Bullet>All cables, connectors, adapters, and power distribution necessary to fully install and operate the equipment listed above in working condition</Bullet>
                <Bullet>Reasonable quantities of spare cables for critical signal paths (RCA, ethernet, HDMI)</Bullet>
              </div>
              <div style={{ ...bodyPara, marginBottom: 12 }}>
                The Organizer shall exercise reasonable care in the use of rented equipment. SwampBass shall maintain its own property insurance covering the rented equipment. Responsibility for any damage or loss shall be determined by the cause of damage, with the at-fault party bearing repair or replacement costs.
              </div>

            </div>
          </div>

          {/* ── PAGE 2 ── */}
          <div id="proposal-page-2" style={{ ...pageStyle, breakAfter: "page", marginBottom: "40px" }}>
            <div style={innerBorderStyle}>

              {/* Section II */}
              <div style={{ ...sectionHeading, marginTop: 0 }}>II. What We Ask of SwampBass</div>
              <div style={bodyPara}>
                The Organizer is proposing that SwampBass provides and operates their own full-service bar at the event, including the following:
              </div>
              <div style={{ marginBottom: 6 }}>
                <Bullet>All alcoholic and non-alcoholic beverage products for SwampBass&apos;s own individual bar, purchased from a licensed distributor</Bullet>
                <Bullet>All necessary state and local permits and licenses required to sell alcoholic beverages at the Premises on the event date, including any required one-day or special event permit</Bullet>
                <Bullet>Liquor liability insurance in SwampBass&apos;s name, with minimum limits of $1,000,000 combined single limit per occurrence and $1,000,000 annual aggregate, covering SwampBass&apos;s bar operations at the event. The policy shall name Azazel_ver1.0.0 LLC, Charlotte County Fair Association, its Board of Directors, agents and employees as additional insureds. A Certificate of Insurance (COI) reflecting this coverage shall be delivered to the Organizer no later than seven (7) days prior to the event. The Organizer agrees to reimburse SwampBass for fifty percent (50%) of the cost of this policy, payable within seven (7) business days of receipt of the COI and a copy of the invoice.</Bullet>
                <Bullet>All necessary equipment, supplies, and staffing for SwampBass&apos;s own individual bar</Bullet>
                <Bullet>Promotion of the event through SwampBass channels, including at minimum one (1) collaboration post and two (2) Instagram stories per week leading up to the event, with timing and content coordinated with the Organizer</Bullet>
              </div>

              {/* Section III */}
              <div style={sectionHeading}>III. Revenue Arrangement</div>
              <div style={{ marginBottom: 6 }}>
                <Bullet>Fifteen percent (15%) of gross bar revenue shall be remitted to <strong>Azazel_ver1.0.0 LLC</strong>. Payment of the 15% share shall be settled no later than seven (7) business days following the conclusion of the event.</Bullet>
                <Bullet>SwampBass retains the remaining eighty-five percent (85%) of gross bar revenue</Bullet>
                <Bullet>SwampBass shall provide the Organizer with a point-of-sale sales report showing total gross bar revenue for the event, delivered alongside the 15% payment</Bullet>
              </div>
              <div style={{ ...bodyPara, marginBottom: 12 }}>
                For purposes of this agreement, &ldquo;gross bar revenue&rdquo; means gross receipts from alcoholic and non-alcoholic beverage sales at SwampBass&apos;s bar, exclusive of sales tax and gratuities, with no deduction for credit card processing fees.
              </div>

            </div>
          </div>

          {/* ── PAGE 3 ── */}
          <div id="proposal-page-3" style={{ ...pageStyle, breakBefore: "page" }}>
            <div style={innerBorderStyle}>

              {/* Section IV */}
              <div style={{ ...sectionHeading, marginTop: 0 }}>IV. Additional Interests</div>
              <div style={bodyPara}>
                Beyond the deliverables above, the Organizer is interested in exploring the following with SwampBass. These items are not required and are open to discussion:
              </div>
              <div style={{ marginBottom: 6 }}>
                <Bullet><strong>Video wall lending.</strong> The Organizer is interested in SwampBass lending their video wall, or smaller portions thereof, for use during the event.</Bullet>
                <Bullet><strong>VIP seating equipment rental.</strong> The Organizer is interested in renting SwampBass&apos;s VIP seating equipment in order to set up VIP tables at the event.</Bullet>
              </div>

              {/* Sponsorship note */}
              <div style={{ ...bodyPara, marginBottom: 20 }}>
                The Organizer would like to inform SwampBass that American Made, a distillery, has expressed interest in sponsoring this event. The Organizer is open to exploring how this sponsorship could integrate with SwampBass&apos;s bar operations, and welcomes SwampBass&apos;s input on the arrangement.
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

              {/* Signo */}
              <div style={{ marginTop: 24, fontWeight: "bold" }}>
                Signo Research Group
              </div>

              {/* Signature blocks */}
              <div style={{ marginTop: 48, fontFamily: '"Courier New", monospace', fontSize: 14, lineHeight: 1.8 }}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontWeight: "bold", marginBottom: 8 }}>Azazel_ver1.0.0 LLC</div>
                  <div>By: <span style={{ display: "inline-block", width: 240, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                  <div>Name:</div>
                  <div>Title:</div>
                  <div>Date: <span style={{ display: "inline-block", width: 240, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: 8 }}>SwampBass</div>
                  <div>By: <span style={{ display: "inline-block", width: 240, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                  <div>Name: <span style={{ display: "inline-block", width: 220, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                  <div>Title: <span style={{ display: "inline-block", width: 228, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                  <div>Date: <span style={{ display: "inline-block", width: 240, borderBottom: "1px solid #000", marginLeft: 8 }} /></div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Export button */}
        <button
          onClick={exportPages}
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
