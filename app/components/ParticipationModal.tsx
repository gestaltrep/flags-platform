"use client";

import { useState, useEffect, useRef } from "react";
import Countdown from "./Countdown";
import { tierPriceCents, type Tier } from "@/lib/tier";

type ParticipationStep = "chooser" | "ga" | "vip" | "table";

interface Props {
  step: ParticipationStep;
  onClose: () => void;
  onStepChange: (step: ParticipationStep) => void;
}

export default function ParticipationModal({ step, onClose, onStepChange }: Props) {
  // Per-tier quantities (preserved across chooser ↔ tier navigation)
  const [gaQuantity, setGaQuantity] = useState(1);
  const [vipQuantity, setVipQuantity] = useState(1);
  // tableQuantity tracked for Phase 2 (table has no quantity selector)
  const [tableQuantity, setTableQuantity] = useState(1);

  // GA promo — matches Terminal handleGaPromoChange pattern exactly
  const [gaPromo, setGaPromo] = useState("");
  const [gaPromoValid, setGaPromoValid] = useState<boolean | null>(null);
  const [gaPromoChecking, setGaPromoChecking] = useState(false);
  const [gaPromoDiscount, setGaPromoDiscount] = useState<number | null>(null);
  const gaPromoTimer = useRef<number | null>(null);

  // VIP promo
  const [vipPromo, setVipPromo] = useState("");
  const [vipPromoValid, setVipPromoValid] = useState<boolean | null>(null);
  const [vipPromoChecking, setVipPromoChecking] = useState(false);
  const [vipPromoDiscount, setVipPromoDiscount] = useState<number | null>(null);
  const vipPromoTimer = useRef<number | null>(null);

  // Table promo
  const [tablePromo, setTablePromo] = useState("");
  const [tablePromoValid, setTablePromoValid] = useState<boolean | null>(null);
  const [tablePromoChecking, setTablePromoChecking] = useState(false);
  const [tablePromoDiscount, setTablePromoDiscount] = useState<number | null>(null);
  const tablePromoTimer = useRef<number | null>(null);

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

    return () => {
      if (gaPromoTimer.current) clearTimeout(gaPromoTimer.current);
      if (vipPromoTimer.current) clearTimeout(vipPromoTimer.current);
      if (tablePromoTimer.current) clearTimeout(tablePromoTimer.current);
    };
  }, []);

  // Promo handlers — identical pattern to Terminal's handleGaPromoChange etc.
  function handleGaPromoChange(value: string) {
    setGaPromo(value);
    setGaPromoValid(null);
    setGaPromoDiscount(null);
    if (gaPromoTimer.current) clearTimeout(gaPromoTimer.current);
    if (!value.trim()) { setGaPromoChecking(false); return; }
    setGaPromoChecking(true);
    gaPromoTimer.current = window.setTimeout(async () => {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      setGaPromoValid(data.valid);
      setGaPromoDiscount(data.valid ? (data.discount_percent ?? null) : null);
      setGaPromoChecking(false);
    }, 800);
  }

  function handleVipPromoChange(value: string) {
    setVipPromo(value);
    setVipPromoValid(null);
    setVipPromoDiscount(null);
    if (vipPromoTimer.current) clearTimeout(vipPromoTimer.current);
    if (!value.trim()) { setVipPromoChecking(false); return; }
    setVipPromoChecking(true);
    vipPromoTimer.current = window.setTimeout(async () => {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      setVipPromoValid(data.valid);
      setVipPromoDiscount(data.valid ? (data.discount_percent ?? null) : null);
      setVipPromoChecking(false);
    }, 800);
  }

  function handleTablePromoChange(value: string) {
    setTablePromo(value);
    setTablePromoValid(null);
    setTablePromoDiscount(null);
    if (tablePromoTimer.current) clearTimeout(tablePromoTimer.current);
    if (!value.trim()) { setTablePromoChecking(false); return; }
    setTablePromoChecking(true);
    tablePromoTimer.current = window.setTimeout(async () => {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      setTablePromoValid(data.valid);
      setTablePromoDiscount(data.valid ? (data.discount_percent ?? null) : null);
      setTablePromoChecking(false);
    }, 800);
  }

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

  // Fix 1: promoInputStyle width is "100%" — matches the GENERATE button width below
  const promoInputStyle: React.CSSProperties = {
    width: "100%",
    background: "black",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "white",
    padding: isMobile ? "14px 14px" : "12px 14px",
    paddingRight: 36,
    fontFamily: '"Courier New", monospace',
    fontSize: isMobile ? 13 : 12,
    letterSpacing: 2,
    outline: "none",
    borderRadius: 0,
  };

  // Fix 1: GENERATE button now 100% wide to match the promo input above it
  const generateBtnStyle: React.CSSProperties = {
    width: "100%",
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
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
    alignItems: "center",
    minHeight: 104,
    borderBottom: "1px solid rgba(255,255,255,0.62)",
    marginBottom: 26,
    flexShrink: 0,
  };

  const backBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
    fontFamily: '"Courier New", monospace',
  };

  // Shared checkmark overlay styles — match Terminal exactly
  const promoCheckingStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#555",
    fontSize: 11,
    letterSpacing: 1,
  };
  const promoValidStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#ffffff",
    fontSize: 14,
  };
  const promoErrorStyle: React.CSSProperties = {
    minHeight: isMobile ? 18 : 16,
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "#c8c8c8",
    textAlign: "center",
    width: "100%",
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
              <button className="cta-button" onClick={() => onStepChange("ga")}>
                GA TOKENS
              </button>
              <button className="cta-button" onClick={() => onStepChange("vip")}>
                VIP TOKENS
              </button>
              <button className="cta-button" onClick={() => onStepChange("table")}>
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
            {/* tier-detail header: 3-column grid keeps back button and title on the same vertical center */}
            <div style={tierDetailHeaderStyle}>
              <button
                style={backBtnStyle}
                onClick={() => onStepChange("chooser")}
                aria-label="Back to chooser"
              >
                ◀
              </button>
              <span className="signup-title signup-title-large" style={{ width: "100%", textAlign: "center", marginBottom: 0 }}>
                {tierTitle}
              </span>
              <div />
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
                {/* Urgency block — Fix 3: price drops on valid promo */}
                <div className="modal-status-copy" style={{ marginBottom: 18 }}>
                  {tier === 1 ? (
                    <>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text" style={{ color: "#ff3333" }}>
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
                          TIER 1 ACTIVE - $
                          {gaPromoValid && gaPromoDiscount != null
                            ? (Math.round(tierPriceCents(1) * (1 - gaPromoDiscount / 100)) / 100).toFixed(2)
                            : (tierPriceCents(1) / 100).toFixed(2)}
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
                          TIER 2 ACTIVE - $
                          {gaPromoValid && gaPromoDiscount != null
                            ? (Math.round(tierPriceCents(2) * (1 - gaPromoDiscount / 100)) / 100).toFixed(2)
                            : (tierPriceCents(2) / 100).toFixed(2)}
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
                        TIER {tier} ACTIVE - $
                        {gaPromoValid && gaPromoDiscount != null
                          ? (Math.round(tierPriceCents(tier as Tier) * (1 - gaPromoDiscount / 100)) / 100).toFixed(2)
                          : (tierPriceCents(tier as Tier) / 100).toFixed(2)}
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
                        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        <span style={{ color: tierColor(t) }}>TIER {t}</span>
                        <span style={{ color: "#888", fontSize: 9, marginTop: 2 }}>
                          ${(tierPriceCents(t) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", width: "100%", height: 10, background: "#222" }}>
                    <div style={{ width: "33.3333%", height: "100%", position: "relative", borderRight: "1px solid #888" }}>
                      <div style={{ width: `${tier1Fill() * 100}%`, height: "100%", background: "white" }} />
                    </div>
                    <div style={{ width: "33.3333%", height: "100%", position: "relative", borderRight: "1px solid #888" }}>
                      <div style={{ width: `${tier2Fill() * 100}%`, height: "100%", background: "white" }} />
                    </div>
                    <div style={{ width: "33.3334%", height: "100%", position: "relative" }}>
                      <div style={{ width: `${tier3Fill() * 100}%`, height: "100%", background: "white" }} />
                    </div>
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-row">
                  <button style={arrowBtnStyle} onClick={() => setGaQuantity((q) => Math.max(1, q - 1))}>▼</button>
                  <div style={qtyBoxStyle}>{gaQuantity}</div>
                  <button style={arrowBtnStyle} onClick={() => setGaQuantity((q) => Math.min(10, q + 1))}>▲</button>
                </div>

                {/* Fix 2: Promo code with debounced validation + checkmark (matches Terminal pattern) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 20 }}>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      value={gaPromo}
                      onChange={(e) => handleGaPromoChange(e.target.value.toUpperCase())}
                      placeholder="PROMO CODE (OPTIONAL)"
                      style={promoInputStyle}
                    />
                    {gaPromoChecking && <span style={promoCheckingStyle}>...</span>}
                    {gaPromoValid === true && !gaPromoChecking && <span style={promoValidStyle}>✓</span>}
                  </div>
                  <div style={promoErrorStyle}>
                    {gaPromoValid === false && gaPromo.trim() ? "INVALID PROMO CODE" : ""}
                  </div>
                </div>

                {/* Generate */}
                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── VIP DETAIL ────────────────────────────── */}
            {!generateStub && step === "vip" && (
              <>
                {/* Fix 3: VIP price drops on valid promo */}
                <div className="modal-status-copy" style={{ marginBottom: 16 }}>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      VIP CHANNEL ACTIVE — $
                      {vipPromoValid && vipPromoDiscount != null
                        ? (Math.round(5000 * (1 - vipPromoDiscount / 100)) / 100).toFixed(2)
                        : "50.00"}
                    </span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">PRIVATE ELEVATED AREA WITH UNOBSTRUCTED VIEW OF THE STAGE.</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">ASTROTURF FLOORING.</span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">EXCLUSIVE BAR ACCESS.</span>
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-row">
                  <button style={arrowBtnStyle} onClick={() => setVipQuantity((q) => Math.max(1, q - 1))}>▼</button>
                  <div style={qtyBoxStyle}>{vipQuantity}</div>
                  <button
                    style={arrowBtnStyle}
                    onClick={() => {
                      const remaining = Math.max(0, 50 - vipSold);
                      const maxAllowed = Math.max(1, Math.min(10, remaining));
                      setVipQuantity((q) => Math.min(maxAllowed, q + 1));
                    }}
                  >▲</button>
                </div>

                {/* Fix 2: Promo with validation */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 20 }}>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      value={vipPromo}
                      onChange={(e) => handleVipPromoChange(e.target.value.toUpperCase())}
                      placeholder="PROMO CODE (OPTIONAL)"
                      style={promoInputStyle}
                    />
                    {vipPromoChecking && <span style={promoCheckingStyle}>...</span>}
                    {vipPromoValid === true && !vipPromoChecking && <span style={promoValidStyle}>✓</span>}
                  </div>
                  <div style={promoErrorStyle}>
                    {vipPromoValid === false && vipPromo.trim() ? "INVALID PROMO CODE" : ""}
                  </div>
                </div>

                {/* Generate */}
                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── TABLE DETAIL ──────────────────────────── */}
            {!generateStub && step === "table" && (
              <>
                {/* Fix 3: Table price drops on valid promo */}
                <div className="modal-status-copy" style={{ marginBottom: 14, lineHeight: 1.5 }}>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      VIP TABLE RESERVATION — $
                      {tablePromoValid && tablePromoDiscount != null
                        ? (Math.round(66667 * (1 - tablePromoDiscount / 100)) / 100).toFixed(2)
                        : "666.67"}
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
                    <span className="modal-status-text--indent">6 VIP TABLE TOKENS</span>
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
                    <span className="modal-status-text--indent">1 CASE OF WATER ON ICE</span>
                  </div>
                </div>

                {/* Fix 2: Promo with validation */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14, marginBottom: 14 }}>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      value={tablePromo}
                      onChange={(e) => handleTablePromoChange(e.target.value.toUpperCase())}
                      placeholder="PROMO CODE (OPTIONAL)"
                      style={promoInputStyle}
                    />
                    {tablePromoChecking && <span style={promoCheckingStyle}>...</span>}
                    {tablePromoValid === true && !tablePromoChecking && <span style={promoValidStyle}>✓</span>}
                  </div>
                  <div style={promoErrorStyle}>
                    {tablePromoValid === false && tablePromo.trim() ? "INVALID PROMO CODE" : ""}
                  </div>
                </div>

                {/* Generate */}
                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button
                    className="cta-button"
                    style={generateBtnStyle}
                    onClick={() => setGenerateStub(true)}
                  >
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
