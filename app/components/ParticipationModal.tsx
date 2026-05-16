"use client";

import { useState, useEffect } from "react";
import Countdown from "./Countdown";
import { tierPriceCents, type Tier } from "@/lib/tier";

type ParticipationStep = "chooser" | "ga" | "vip" | "table";

interface Props {
  step: ParticipationStep;
  onClose: () => void;
  onStepChange: (step: ParticipationStep) => void;
}

export default function ParticipationModal({ step, onClose, onStepChange }: Props) {
  const [gaQuantity, setGaQuantity] = useState(1);
  const [vipQuantity, setVipQuantity] = useState(1);
  // tableQuantity tracked for Phase 2 (table has no quantity selector)
  const [tableQuantity, setTableQuantity] = useState(1);

  const [gaPromo, setGaPromo] = useState("");
  const [vipPromo, setVipPromo] = useState("");
  const [tablePromo, setTablePromo] = useState("");

  const [generateStub, setGenerateStub] = useState(false);

  const [tier, setTier] = useState(1);
  const [sold, setSold] = useState(0);
  const [vipSold, setVipSold] = useState(0);
  const [tierStartedAtSold, setTierStartedAtSold] = useState(0);
  const [tableSold, setTableSold] = useState(0);

  const [viewportWidth, setViewportWidth] = useState(1400);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 900;

  // Reset stub when navigating between tier states
  useEffect(() => {
    setGenerateStub(false);
  }, [step]);

  // Fetch tier/table data once on mount (parent unmounts this component when modal closes)
  useEffect(() => {
    fetch("/api/tier-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setTier(d.tier ?? 1);
        setSold(d.sold ?? 0);
        setVipSold(d.vipSold ?? 0);
        setTierStartedAtSold(d.tierStartedAtSold ?? 0);
      })
      .catch(() => {});
    fetch("/api/table-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTableSold(d.sold ?? 0))
      .catch(() => {});
  }, []);

  function tier1Fill() {
    if (tier > 1) return 1;
    return Math.max(0, Math.min(1, sold / 50));
  }
  function tier2Fill() {
    if (tier > 2) return 1;
    if (tier < 2) return 0;
    const d = 125 - tierStartedAtSold;
    if (d <= 0) return 1;
    return Math.max(0, Math.min(1, (sold - tierStartedAtSold) / d));
  }
  function tier3Fill() {
    if (tier < 3) return 0;
    return Math.max(0, Math.min(1, (sold - 125) / 875));
  }
  function tierColor(t: number) {
    return tier === t ? "#ffffff" : "#555555";
  }

  function loadTier() {
    fetch("/api/tier-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setTier(d.tier ?? 1);
        setSold(d.sold ?? 0);
        setVipSold(d.vipSold ?? 0);
        setTierStartedAtSold(d.tierStartedAtSold ?? 0);
      })
      .catch(() => {});
  }

  const arrowBtnStyle: React.CSSProperties = {
    width: isMobile ? 40 : 28,
    height: isMobile ? 40 : 28,
    minHeight: isMobile ? 40 : 28,
    padding: 0,
    fontSize: isMobile ? 14 : 10,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid white",
    background: "black",
    color: "white",
    cursor: "pointer",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 700,
    borderRadius: 0,
    flexShrink: 0,
  };

  const qtyBoxStyle: React.CSSProperties = {
    width: isMobile ? 86 : 72,
    height: isMobile ? 40 : 28,
    borderTop: "1px solid white",
    borderBottom: "1px solid white",
    borderLeft: "none",
    borderRight: "none",
    background: "black",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? 16 : 13,
    letterSpacing: 2,
    flexShrink: 0,
  };

  const promoInputStyle: React.CSSProperties = {
    width: "100%",
    background: "black",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "white",
    padding: "12px 14px",
    fontFamily: '"Courier New", monospace',
    fontSize: isMobile ? 13 : 12,
    letterSpacing: 2,
    outline: "none",
    borderRadius: 0,
  };

  const generateBtnStyle: React.CSSProperties = {
    width: isMobile ? "100%" : 300,
    maxWidth: "100%",
    minHeight: 54,
    lineHeight: 1.02,
    color: "white",
    fontSize: isMobile ? 13 : 17,
    fontWeight: 700,
    letterSpacing: isMobile ? 3.4 : 4.8,
    whiteSpace: "nowrap",
    fontFamily: "Arial, Helvetica, sans-serif",
    textTransform: "uppercase",
  };

  const tierDetailHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 104,
    borderBottom: "1px solid rgba(255,255,255,0.62)",
    marginBottom: 26,
    flexShrink: 0,
  };

  const backBtnStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    background: "none",
    border: "none",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
    fontFamily: '"Courier New", monospace',
  };

  const tierTitle =
    step === "ga"
      ? "GA TOKENS"
      : step === "vip"
        ? "VIP TOKENS"
        : "RESERVE A TABLE";

  return (
    <div className="signup-overlay">
      <div className="signup-modal signup-modal-request">

        {/* ── CHOOSER ──────────────────────────────────── */}
        {step === "chooser" && (
          <>
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <button
                className="cta-button"
                onClick={() => onStepChange("ga")}
              >
                GA TOKENS
              </button>
              <button
                className="cta-button"
                onClick={() => onStepChange("vip")}
              >
                VIP TOKENS
              </button>
              <button
                className="cta-button"
                onClick={() => onStepChange("table")}
              >
                RESERVE A TABLE
              </button>
            </div>

            <button className="signup-close" onClick={onClose}>
              CANCEL
            </button>
          </>
        )}

        {/* ── TIER-DETAIL STATES ───────────────────────── */}
        {(step === "ga" || step === "vip" || step === "table") && (
          <>
            {/* Header: back triangle + centered title */}
            <div style={tierDetailHeaderStyle}>
              <button
                style={backBtnStyle}
                onClick={() => onStepChange("chooser")}
                aria-label="Back to chooser"
              >
                ◀
              </button>
              <span
                style={{
                  fontSize: isMobile ? 15 : 16,
                  letterSpacing: isMobile ? 2.4 : 3,
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 700,
                }}
              >
                {tierTitle}
              </span>
            </div>

            {/* ── GENERATE STUB ─────────────────────────── */}
            {generateStub && (
              <>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div className="modal-status-line" style={{ marginBottom: 10 }}>
                    <span className="modal-status-symbol">{">"}</span>
                    <span
                      className="modal-status-text"
                      style={{ color: "#c8c8c8", fontSize: 14, letterSpacing: 1.8 }}
                    >
                      PHASE 2: VERIFICATION + CHECKOUT
                    </span>
                  </div>
                  <div className="modal-status-line" style={{ marginBottom: 36 }}>
                    <span className="modal-status-symbol">{">"}</span>
                    <span
                      className="modal-status-text"
                      style={{ color: "#c8c8c8", fontSize: 14, letterSpacing: 1.8 }}
                    >
                      (THIS WILL WIRE IN NEXT)
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <button
                      className="signup-close"
                      style={{ marginTop: 0 }}
                      onClick={() => setGenerateStub(false)}
                    >
                      BACK TO TIER DETAIL
                    </button>
                  </div>
                </div>
                <button className="signup-close" onClick={onClose}>
                  CANCEL
                </button>
              </>
            )}

            {/* ── GA DETAIL ─────────────────────────────── */}
            {!generateStub && step === "ga" && (
              <>
                {/* Urgency block */}
                <div className="modal-status-copy" style={{ marginBottom: 18 }}>
                  {tier === 1 ? (
                    <>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span
                          className="modal-status-text"
                          style={{ color: "#ff3333" }}
                        >
                          TIER 1 END:{" "}
                          <Countdown
                            targetDate="2026-05-14T23:59:59-04:00"
                            onExpire={loadTier}
                          />
                        </span>
                      </div>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text">
                          TIER 1 ACTIVE - ${(tierPriceCents(1) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text">
                          NEXT TIER - ${(tierPriceCents(2) / 100).toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : tier === 2 ? (
                    <>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text">
                          TIER 2 ACTIVE - ${(tierPriceCents(2) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text">
                          NEXT TIER - ${(tierPriceCents(3) / 100).toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="modal-status-line">
                      <span className="modal-status-symbol">{">"}</span>
                      <span className="modal-status-text">
                        TIER {tier} ACTIVE - ${(tierPriceCents(tier as Tier) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Segmented tier bar with prices under labels */}
                <div style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      textAlign: "center",
                      fontSize: 10,
                      letterSpacing: 1.8,
                      marginBottom: 6,
                    }}
                  >
                    {([1, 2, 3] as const).map((t) => (
                      <div
                        key={t}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: tierColor(t) }}>TIER {t}</span>
                        <span style={{ color: "#888", fontSize: 9, marginTop: 2 }}>
                          ${(tierPriceCents(t) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      height: 10,
                      background: "#222",
                    }}
                  >
                    <div
                      style={{
                        width: "33.3333%",
                        height: "100%",
                        position: "relative",
                        borderRight: "1px solid #888",
                      }}
                    >
                      <div
                        style={{
                          width: `${tier1Fill() * 100}%`,
                          height: "100%",
                          background: "white",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: "33.3333%",
                        height: "100%",
                        position: "relative",
                        borderRight: "1px solid #888",
                      }}
                    >
                      <div
                        style={{
                          width: `${tier2Fill() * 100}%`,
                          height: "100%",
                          background: "white",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: "33.3334%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${tier3Fill() * 100}%`,
                          height: "100%",
                          background: "white",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-row">
                  <button
                    style={arrowBtnStyle}
                    onClick={() => setGaQuantity((q) => Math.max(1, q - 1))}
                  >
                    ▼
                  </button>
                  <div style={qtyBoxStyle}>{gaQuantity}</div>
                  <button
                    style={arrowBtnStyle}
                    onClick={() => setGaQuantity((q) => Math.min(10, q + 1))}
                  >
                    ▲
                  </button>
                </div>

                {/* Promo code */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  <input
                    value={gaPromo}
                    onChange={(e) => setGaPromo(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE (OPTIONAL)"
                    style={promoInputStyle}
                  />
                </div>

                {/* Generate */}
                <div
                  className="signup-generate-button-wrap"
                  style={{ marginTop: "auto", paddingTop: 14 }}
                >
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>
                  CANCEL
                </button>
              </>
            )}

            {/* ── VIP DETAIL ────────────────────────────── */}
            {!generateStub && step === "vip" && (
              <>
                {/* Status line */}
                <div className="modal-status-copy" style={{ marginBottom: 16 }}>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      VIP CHANNEL ACTIVE — $50.00
                    </span>
                  </div>
                </div>

                {/* Description copy */}
                <div
                  style={{
                    fontSize: 13,
                    letterSpacing: 1.4,
                    lineHeight: 1.7,
                    color: "#c8c8c8",
                    marginBottom: 22,
                  }}
                >
                  Private elevated area with unobstructed view of the stage.
                  Astroturf flooring. Exclusive bar access.
                </div>

                {/* Quantity selector */}
                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-row">
                  <button
                    style={arrowBtnStyle}
                    onClick={() => setVipQuantity((q) => Math.max(1, q - 1))}
                  >
                    ▼
                  </button>
                  <div style={qtyBoxStyle}>{vipQuantity}</div>
                  <button
                    style={arrowBtnStyle}
                    onClick={() => {
                      const remaining = Math.max(0, 50 - vipSold);
                      const maxAllowed = Math.max(1, Math.min(10, remaining));
                      setVipQuantity((q) => Math.min(maxAllowed, q + 1));
                    }}
                  >
                    ▲
                  </button>
                </div>

                {/* Promo code */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  <input
                    value={vipPromo}
                    onChange={(e) => setVipPromo(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE (OPTIONAL)"
                    style={promoInputStyle}
                  />
                </div>

                {/* Generate */}
                <div
                  className="signup-generate-button-wrap"
                  style={{ marginTop: "auto", paddingTop: 14 }}
                >
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>
                  CANCEL
                </button>
              </>
            )}

            {/* ── TABLE DETAIL ──────────────────────────── */}
            {!generateStub && step === "table" && (
              <>
                {/* Status + includes list */}
                <div
                  className="modal-status-copy"
                  style={{ marginBottom: 14, lineHeight: 1.5 }}
                >
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      VIP TABLE RESERVATION — $666.67
                    </span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      TABLES REMAINING: {10 - tableSold}
                    </span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">INCLUDES:</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol" />
                    <span className="modal-status-text--indent">
                      6 VIP TABLE TOKENS
                    </span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol" />
                    <span className="modal-status-text--indent">1 FREE BOTTLE</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol" />
                    <span className="modal-status-text--indent">BOTTLE SERVICE</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol" />
                    <span className="modal-status-text--indent">ENDLESS CHASERS</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol" />
                    <span className="modal-status-text--indent">
                      1 CASE OF WATER ON ICE
                    </span>
                  </div>
                </div>

                {/* Promo code */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 14,
                    marginBottom: 14,
                  }}
                >
                  <input
                    value={tablePromo}
                    onChange={(e) => setTablePromo(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE (OPTIONAL)"
                    style={promoInputStyle}
                  />
                </div>

                {/* Generate */}
                <div
                  className="signup-generate-button-wrap"
                  style={{ marginTop: "auto", paddingTop: 14 }}
                >
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>
                  CANCEL
                </button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
