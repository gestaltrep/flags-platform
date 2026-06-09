"use client";

import { useState, useEffect, useRef } from "react";
import Countdown from "./Countdown";
import EmbeddedCheckoutModal from "./EmbeddedCheckoutModal";
import { tierPriceCents, type Tier } from "@/lib/tier";

type ParticipationStep =
  | "chooser"
  | "ga"
  | "vip"
  | "table"
  | "phone-entry"
  | "otp-verify"
  | "checkout";

interface Props {
  step: ParticipationStep;
  onClose: () => void;
  onStepChange: (step: ParticipationStep) => void;
  isDormant?: boolean;
}

export default function ParticipationModal({ step, onClose, onStepChange, isDormant = false }: Props) {
  // Per-tier quantities (preserved across chooser ↔ tier navigation)
  const [gaQuantity, setGaQuantity] = useState(1);
  const [vipQuantity, setVipQuantity] = useState(1);

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

  // Auth flow state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [optInSms, setOptInSms] = useState(false);

  // Dormant opt-in sub-step (used when isDormant && step === "chooser")
  const [dormantSubStep, setDormantSubStep] = useState<"form" | "otp">("form");

  // Checkout context — captured when GENERATE is clicked
  const [checkoutSourceStep, setCheckoutSourceStep] = useState<"ga" | "vip" | "table">("ga");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [ticketBaseline, setTicketBaseline] = useState(0);

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

  // Fetch tier/table data once on mount
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

  // Snapshot existing ticket count just before Stripe checkout mounts so the
  // post-payment poll knows what delta to wait for
  useEffect(() => {
    if (step === "checkout") {
      fetch("/api/tickets", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setTicketBaseline(Array.isArray(d) ? d.length : 0))
        .catch(() => setTicketBaseline(0));
    }
  }, [step]);

  // Auth detection — user_id cookie is httpOnly:false, readable from JS
  function isAuthenticated(): boolean {
    if (typeof document === "undefined") return false;
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("user_id="));
    return !!cookie && cookie.split("=").slice(1).join("=").trim().length > 0;
  }

  // Promo handlers — identical pattern to Terminal
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

  // Called by all three GENERATE buttons
  function handleGenerate() {
    const src = step as "ga" | "vip" | "table";

    // Block if promo was entered but hasn't validated
    if (src === "ga" && gaPromo.trim() && (gaPromoChecking || gaPromoValid !== true)) {
      setGaPromoValid(false);
      return;
    }
    if (src === "vip" && vipPromo.trim() && (vipPromoChecking || vipPromoValid !== true)) {
      setVipPromoValid(false);
      return;
    }
    if (src === "table" && tablePromo.trim() && (tablePromoChecking || tablePromoValid !== true)) {
      setTablePromoValid(false);
      return;
    }

    // Compute display amount for the Stripe modal header
    let amount = 0;
    if (src === "ga") {
      const base = tierPriceCents(tier as Tier) * gaQuantity;
      amount = gaPromoValid && gaPromoDiscount ? Math.round(base * (1 - gaPromoDiscount / 100)) : base;
    } else if (src === "vip") {
      const base = 6667 * vipQuantity;
      amount = vipPromoValid && vipPromoDiscount ? Math.round(base * (1 - vipPromoDiscount / 100)) : base;
    } else {
      amount = tablePromoValid && tablePromoDiscount
        ? Math.round(66667 * (1 - tablePromoDiscount / 100))
        : 66667;
    }

    setCheckoutSourceStep(src);
    setCheckoutAmount(amount);
    setAuthMessage("");

    if (isAuthenticated()) {
      onStepChange("checkout");
    } else {
      setName("");
      setPhone("");
      setOtpCode("");
      setTermsChecked(false);
      setPrivacyChecked(false);
      setOptInSms(false);
      onStepChange("phone-entry");
    }
  }

  // Phone-entry: unified signup-or-login (name provided, server skips 404 check)
  async function sendPhoneCode() {
    setAuthMessage("");
    if (!name.trim()) {
      setAuthMessage("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setAuthMessage("Please enter your phone number.");
      return;
    }
    if (!termsChecked) {
      setAuthMessage("Please agree to the Terms & Conditions.");
      return;
    }
    if (!privacyChecked) {
      setAuthMessage("Please agree to the Privacy Policy.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim(), optInSms }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();
        if (raw.includes("invalid parameter")) setAuthMessage("SMS is not available right now.");
        else if (raw.includes("invalid") && raw.includes("phone")) setAuthMessage("This phone number isn't valid.");
        else setAuthMessage("We couldn't send your code. Please try again.");
        return;
      }
      setOtpCode("");
      onStepChange("otp-verify");
    } catch {
      setAuthMessage("We couldn't send your code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // OTP verify — server sets user_id cookie on success
  async function verifyPhone() {
    setAuthMessage("");
    if (!otpCode.trim()) {
      setAuthMessage("Please enter the verification code.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim(), name: name.trim(), optInSms }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 404 && data?.error) {
          setAuthMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("expired")) setAuthMessage("That code has expired.");
          else if (raw.includes("incorrect") || raw.includes("invalid")) setAuthMessage("That code is incorrect.");
          else setAuthMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }
      // Cookie is now set by the server — go straight to checkout
      onStepChange("checkout");
    } catch {
      setAuthMessage("We couldn't sign you in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Dormant opt-in: send SMS code (requires name, phone, terms, privacy; SMS opt-in optional)
  async function sendDormantCode() {
    setAuthMessage("");
    if (!name.trim()) { setAuthMessage("Please enter your name."); return; }
    if (!phone.trim()) { setAuthMessage("Please enter your phone number."); return; }
    if (!termsChecked) { setAuthMessage("Please agree to the Terms & Conditions."); return; }
    if (!privacyChecked) { setAuthMessage("Please agree to the Privacy Policy."); return; }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim(), optInSms }),
      });
      let data: any = null;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();
        if (raw.includes("invalid parameter")) setAuthMessage("SMS is not available right now.");
        else if (raw.includes("invalid") && raw.includes("phone")) setAuthMessage("This phone number isn't valid.");
        else setAuthMessage("We couldn't send your code. Please try again.");
        return;
      }
      setOtpCode("");
      setDormantSubStep("otp");
    } catch {
      setAuthMessage("We couldn't send your code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Dormant opt-in: verify SMS code — on success show confirmation (no redirect)
  async function verifyDormantCode() {
    setAuthMessage("");
    if (!otpCode.trim()) { setAuthMessage("Please enter the verification code."); return; }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim(), name: name.trim(), optInSms }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 404 && data?.error) {
          setAuthMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("expired")) setAuthMessage("That code has expired.");
          else if (raw.includes("incorrect") || raw.includes("invalid")) setAuthMessage("That code is incorrect.");
          else setAuthMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setAuthMessage("We couldn't sign you in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
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

  // 3-column grid header: [44px back] [1fr title] [44px spacer]
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

  // Auth message slot (phone/otp steps)
  const authMessageSlot = (
    <div style={{
      minHeight: 20,
      marginTop: 8,
      marginBottom: 14,
      fontSize: 12,
      lineHeight: 1.5,
      color: "#c8c8c8",
      textAlign: "center",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    }}>
      {authMessage ? <span>{authMessage}</span> : null}
    </div>
  );

  // Header title per step
  const tierTitle =
    step === "ga" ? "GA TOKENS"
    : step === "vip" ? "VIP TOKENS"
    : step === "table" ? "RESERVE A TABLE"
    : step === "phone-entry" ? "VERIFICATION"
    : step === "otp-verify" ? "ENTER CODE"
    : "";

  // Back button target per step
  function handleBack() {
    if (step === "phone-entry") onStepChange(checkoutSourceStep);
    else if (step === "otp-verify") onStepChange("phone-entry");
    else onStepChange("chooser"); // ga / vip / table
  }

  // ── CHECKOUT: render Stripe modal directly, no participation overlay ──
  if (step === "checkout") {
    return (
      <EmbeddedCheckoutModal
        isOpen={true}
        onClose={() => onStepChange(checkoutSourceStep)}
        type={checkoutSourceStep}
        quantity={checkoutSourceStep === "table" ? 6 : checkoutSourceStep === "vip" ? vipQuantity : gaQuantity}
        isMobile={isMobile}
        amount={checkoutAmount}
        promoCode={
          checkoutSourceStep === "ga" ? gaPromo
          : checkoutSourceStep === "vip" ? vipPromo
          : tablePromo
        }
        onSuccess={() => {
          const baseline = ticketBaseline;
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            try {
              const res = await fetch("/api/tickets");
              const data = await res.json();
              if ((data?.length ?? 0) > baseline) {
                clearInterval(poll);
                window.location.href = "/dashboard";
                return;
              }
            } catch {}
            if (attempts >= 20) {
              clearInterval(poll);
              window.location.href = "/dashboard";
            }
          }, 500);
        }}
      />
    );
  }

  return (
    <div className="signup-overlay">
      <div className="signup-modal signup-modal-request">

        {/* ── CHOOSER (active sales) ────────────────────── */}
        {step === "chooser" && !isDormant && (
          <>
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
              <button className="cta-button" onClick={() => onStepChange("ga")}>GA TOKENS</button>
              <button className="cta-button" onClick={() => onStepChange("vip")}>VIP TOKENS</button>
            </div>

            <button className="signup-close" onClick={onClose}>CANCEL</button>
          </>
        )}

        {/* ── DORMANT OPT-IN: form ─────────────────────── */}
        {step === "chooser" && isDormant && dormantSubStep === "form" && (
          <>
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "6%" }}>
              <input
                placeholder="NAME"
                className="signup-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                placeholder="PHONE NUMBER"
                className="signup-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ marginBottom: 22 }}
              />
              <label className="signup-checkbox">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  style={{
                    WebkitAppearance: "checkbox",
                    appearance: "auto",
                    accentColor: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.8)",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    marginTop: 3,
                  }}
                />
                <span>I agree to the <a href="/terms">Terms &amp; Conditions</a></span>
              </label>
              <label className="signup-checkbox">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  style={{
                    WebkitAppearance: "checkbox",
                    appearance: "auto",
                    accentColor: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.8)",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    marginTop: 3,
                  }}
                />
                <span>I agree to the <a href="/privacy">Privacy Policy</a></span>
              </label>
              <label className="signup-checkbox">
                <input
                  type="checkbox"
                  checked={optInSms}
                  onChange={(e) => setOptInSms(e.target.checked)}
                  style={{
                    WebkitAppearance: "checkbox",
                    appearance: "auto",
                    accentColor: "#9ca3af",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.8)",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    marginTop: 3,
                  }}
                />
                <span>
                  I agree to receive recurring text messages from Signo Research Group about events, updates, and announcements. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel.
                </span>
              </label>
            </div>

            {authMessageSlot}

            <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
              <button
                className="cta-button modal-primary-button"
                onClick={sendDormantCode}
                disabled={authLoading}
              >
                {authLoading ? "SENDING..." : "SEND CODE"}
              </button>
            </div>

            <button className="signup-close" onClick={onClose}>CANCEL</button>
          </>
        )}

        {/* ── DORMANT OPT-IN: otp ──────────────────────── */}
        {step === "chooser" && isDormant && dormantSubStep === "otp" && (
          <>
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
              <input
                placeholder="6 DIGIT CODE"
                className="signup-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            {authMessageSlot}

            <div className="signup-request-button-wrap">
              <button
                className="cta-button modal-primary-button"
                onClick={verifyDormantCode}
                disabled={authLoading}
              >
                {authLoading ? "VERIFYING..." : "VERIFY"}
              </button>
            </div>
          </>
        )}

        {/* ── ALL NON-CHOOSER STATES ───────────────────── */}
        {step !== "chooser" && (
          <>
            {/* Header — shared by ga/vip/table/phone-entry/otp-verify */}
            <div style={tierDetailHeaderStyle}>
              <button style={backBtnStyle} onClick={handleBack} aria-label="Back">◀</button>
              <span
                className="signup-title signup-title-large"
                style={{ width: "100%", textAlign: "center", marginBottom: 0 }}
              >
                {tierTitle}
              </span>
              <div />
            </div>

            {/* ── PHONE-ENTRY ───────────────────────────── */}
            {step === "phone-entry" && (
              <>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "6%" }}>
                  <input
                    placeholder="NAME"
                    className="signup-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    placeholder="PHONE NUMBER"
                    className="signup-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ marginBottom: 22 }}
                  />
                  <label className="signup-checkbox">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      style={{
                        WebkitAppearance: "checkbox",
                        appearance: "auto",
                        accentColor: "#9ca3af",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.8)",
                      }}
                    />
                    <span>
                      I agree to the <a href="/terms">Terms &amp; Conditions</a>
                    </span>
                  </label>
                  <label className="signup-checkbox">
                    <input
                      type="checkbox"
                      checked={privacyChecked}
                      onChange={(e) => setPrivacyChecked(e.target.checked)}
                      style={{
                        WebkitAppearance: "checkbox",
                        appearance: "auto",
                        accentColor: "#9ca3af",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.8)",
                      }}
                    />
                    <span>
                      I agree to the <a href="/privacy">Privacy Policy</a>
                    </span>
                  </label>
                  <label className="signup-checkbox">
                    <input
                      type="checkbox"
                      checked={optInSms}
                      onChange={(e) => setOptInSms(e.target.checked)}
                      style={{
                        WebkitAppearance: "checkbox",
                        appearance: "auto",
                        accentColor: "#9ca3af",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.8)",
                        flexShrink: 0,
                        alignSelf: "flex-start",
                        marginTop: 3,
                      }}
                    />
                    <span>
                      I agree to receive recurring text messages from Signo Research Group about events, updates, and announcements. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel.
                    </span>
                  </label>
                </div>
                {authMessageSlot}
                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={sendPhoneCode}
                    disabled={authLoading}
                  >
                    {authLoading ? "SENDING..." : "SEND CODE"}
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── OTP-VERIFY ────────────────────────────── */}
            {step === "otp-verify" && (
              <>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
                  <input
                    placeholder="6 DIGIT CODE"
                    className="signup-input"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {authMessageSlot}
                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={verifyPhone}
                    disabled={authLoading}
                  >
                    {authLoading ? "VERIFYING..." : "VERIFY"}
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── GA DETAIL ─────────────────────────────── */}
            {step === "ga" && (
              <>
                <div className="modal-status-copy" style={{ marginBottom: 18 }}>
                  {tier === 1 ? (
                    <>
                      <div className="modal-status-line">
                        <span className="modal-status-symbol">{">"}</span>
                        <span className="modal-status-text" style={{ color: "#ff3333" }}>
                          TIER 1 END:{" "}
                          <Countdown targetDate="2026-05-14T23:59:59-04:00" onExpire={loadTier} />
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

                {/* Segmented tier bar */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    fontSize: 10,
                    letterSpacing: 1.8,
                    marginBottom: 6,
                  }}>
                    {([1, 2, 3] as const).map((t) => (
                      <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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

                <div className="modal-quantity-label">QUANTITY</div>
                <div className="modal-quantity-row">
                  <button style={arrowBtnStyle} onClick={() => setGaQuantity((q) => Math.max(1, q - 1))}>▼</button>
                  <div style={qtyBoxStyle}>{gaQuantity}</div>
                  <button style={arrowBtnStyle} onClick={() => setGaQuantity((q) => Math.min(10, q + 1))}>▲</button>
                </div>

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

                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button className="cta-button" style={generateBtnStyle} onClick={handleGenerate}>
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── VIP DETAIL ────────────────────────────── */}
            {step === "vip" && (
              <>
                <div className="modal-status-copy" style={{ marginBottom: 16 }}>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">
                      VIP CHANNEL ACTIVE — $
                      {vipPromoValid && vipPromoDiscount != null
                        ? (Math.round(6667 * (1 - vipPromoDiscount / 100)) / 100).toFixed(2)
                        : "66.67"}
                    </span>
                  </div>
                  <div className="modal-status-line">
                    <span className="modal-status-symbol">{">"}</span>
                    <span className="modal-status-text">PRIVATE AREA WITH UNOBSTRUCTED VIEW OF THE STAGE.</span>
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

                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button className="cta-button" style={generateBtnStyle} onClick={handleGenerate}>
                    GENERATE
                  </button>
                </div>
                <button className="signup-close" onClick={onClose}>CANCEL</button>
              </>
            )}

            {/* ── TABLE DETAIL ──────────────────────────── */}
            {step === "table" && (
              <>
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

                <div className="signup-generate-button-wrap" style={{ marginTop: "auto", paddingTop: 14 }}>
                  <button className="cta-button" style={generateBtnStyle} onClick={handleGenerate}>
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
