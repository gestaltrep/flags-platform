"use client";

import { useState } from "react";
import HeroGlitch from "./components/HeroGlitch";
import SponsorSection from "./components/SponsorSection";
import ParticipationModal from "./components/ParticipationModal";

type ParticipationStep = "closed" | "chooser" | "ga" | "vip" | "table" | "phone-entry" | "otp-verify" | "checkout";

/** Minimal event shape the preview needs. Public homepage passes nothing. */
export type HomeEvent = {
  name: string;
  slug: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  hero_image: string | null;
};

/**
 * `event`, `previewMode` and `previewKey` are preview-only and default to the
 * public homepage's behaviour, so / renders exactly as it did before they
 * existed.
 */
export default function HomeClient({
  isDormant,
  event = null,
  previewMode = false,
  previewKey = "",
}: {
  isDormant: boolean;
  event?: HomeEvent | null;
  previewMode?: boolean;
  previewKey?: string;
}) {
  const [participationStep, setParticipationStep] = useState<ParticipationStep>("closed");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "verify">("phone");

  async function sendVerification() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!termsChecked) {
      setMessage("Please agree to the Terms & Conditions.");
      return;
    }

    if (!privacyChecked) {
      setMessage("Please agree to the Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();

        if (raw.includes("invalid parameter")) {
          setMessage("SMS is not available right now.");
        } else if (raw.includes("invalid") && raw.includes("phone")) {
          setMessage("This phone number isn't valid.");
        } else {
          setMessage("We couldn't send your code. Please try again.");
        }
        return;
      }

      setStep("verify");
      setMessage("");
    } catch (err) {
      console.error("verification failed", err);
      setMessage("We couldn't send your code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setMessage("");

    if (!code.trim()) {
      setMessage("Please enter the verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code.trim(),
          name: name.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();

        if (raw.includes("expired")) {
          setMessage("That code has expired.");
        } else if (raw.includes("incorrect") || raw.includes("invalid")) {
          setMessage("That code is incorrect.");
        } else {
          setMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }

      setOpen(false);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("verification error", err);
      setMessage("We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginCode() {
    setMessage("");
    if (!loginPhone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), name: "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404 && data?.error) {
          setMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("invalid parameter")) setMessage("SMS is not available right now.");
          else if (raw.includes("invalid") && raw.includes("phone")) setMessage("This phone number isn't valid.");
          else setMessage("We couldn't send your code. Please try again.");
        }
        return;
      }
      setLoginStep("verify");
      setMessage("");
    } catch {
      setMessage("We couldn't send your code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginCode() {
    setMessage("");
    if (!loginCode.trim()) {
      setMessage("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), code: loginCode.trim(), name: "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 404 && data?.error) {
          setMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("expired")) setMessage("That code has expired.");
          else if (raw.includes("incorrect") || raw.includes("invalid")) setMessage("That code is incorrect.");
          else setMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }
      setOpen(false);
      window.location.href = "/dashboard";
    } catch {
      setMessage("We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const messageSlot = (
    <div
      style={{
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
      }}
    >
      {message ? <span>{message}</span> : null}
    </div>
  );

  const checkboxStyle: React.CSSProperties = {
    WebkitAppearance: "checkbox" as any,
    appearance: "auto" as any,
    accentColor: "#9ca3af",
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
  };

  // Event-facing copy. With no event (the public homepage) every one of these
  // resolves to the exact literal the page has always rendered.
  // Event times are rendered in venue time. Without an explicit timeZone these
  // resolve against the runtime's clock — UTC on the server, the visitor's zone
  // in the browser — which both shifts the printed time and desyncs hydration.
  // The format itself is unchanged.
  const EVENT_TZ = "America/New_York";
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: EVENT_TZ });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: EVENT_TZ });

  const eventLabel = event?.name ?? "RAVE_Initiation.html";
  const eventDate = event ? (event.start_time ? fmtDate(event.start_time) : "Date TBA") : "May 30";
  const eventTimeRange = (start: string, end: string | null) =>
    end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
  const eventTime = event
    ? (event.start_time ? eventTimeRange(event.start_time, event.end_time) : "Time TBA")
    : "4:30 PM – 12 AM";
  const eventLocation = event ? event.location ?? "Location TBA" : "Charlotte County Fair";

  // Event two's poster is not loaded yet; render an empty frame rather than a
  // broken image.
  const heroMissing = previewMode && !event?.hero_image;

  function Poster({ className }: { className?: string }) {
    if (heroMissing) {
      return (
        <div
          className={className}
          style={{
            position: "relative",
            overflow: "hidden",
            background: "#0a0a0a",
            border: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 11,
              letterSpacing: 2,
              color: "#555",
              textTransform: "uppercase",
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            POSTER NOT YET LOADED
          </span>
        </div>
      );
    }
    if (previewMode && event?.hero_image) {
      return <HeroGlitch className={className} lineupSrc={event.hero_image} lqipSrc={event.hero_image} />;
    }
    return <HeroGlitch className={className} />;
  }

  return (
    <>
      {previewMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2000,
            background: "#3d0000",
            borderBottom: "1px solid #ff3333",
            color: "#ff8888",
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            letterSpacing: 3,
            textAlign: "center",
            padding: "6px 12px",
            pointerEvents: "none",
            textTransform: "uppercase",
          }}
        >
          PREVIEW — NOT LIVE
        </div>
      )}

      <main className="home-desktop">
        <div className="home-desktop-grid">
          <div style={{ position: "relative", display: "block" }} className="home-poster-wrap">
            <Poster className="home-poster-image" />
            <div style={{
              position: "absolute",
              bottom: 3,
              right: 3,
              fontFamily: '"Courier New", monospace',
              fontSize: 13,
              letterSpacing: 1.5,
              color: "#ffffff",
              pointerEvents: "none",
            }}>
              {eventLabel}
            </div>
            {isDormant && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                transform: "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 10,
              }}>
                <div style={{ height: 1, background: "#888" }} />
                <div style={{ background: "rgba(0,0,0,0.82)", padding: "22px 0", textAlign: "center" }}>
                  <span style={{
                    color: "white",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: 900,
                    fontSize: 36,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}>
                    INITIATION COMPLETE
                  </span>
                </div>
                <div style={{ height: 1, background: "#888" }} />
              </div>
            )}
          </div>

          <div className="home-desktop-info">
            <div className="home-date-desktop">{eventDate}</div>
            <div className="home-time-desktop">{eventTime}</div>
            <div className="home-location-desktop">{eventLocation}</div>

            <button
              className="cta-button"
              onClick={() => setParticipationStep("chooser")}
              style={{
                width: 352,
                maxWidth: "100%",
              }}
            >
              REQUEST PARTICIPATION
            </button>

            {/* Log-in sends an SMS code; preview must stay side-effect free. */}
            {!previewMode && (
              <div style={{ textAlign: "center", marginTop: 10, width: 352, maxWidth: "100%" }}>
                <button
                  onClick={() => {
                    setMode("login");
                    setLoginStep("phone");
                    setLoginPhone("");
                    setLoginCode("");
                    setMessage("");
                    setOpen(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    fontFamily: '"Courier New", monospace',
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "none",
                  }}
                >
                  ALREADY REGISTERED?{" "}
                  <span style={{ fontWeight: 900, color: "#cccccc" }}>LOG IN</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <main className="home-mobile">
        <div className="home-mobile-frame">
          <div className="home-mobile-text">
            <div className="home-date-mobile">{eventDate.toUpperCase()}</div>
            <div className="home-time-mobile">{eventTime}</div>
            <div className="home-location-mobile">{eventLocation.toUpperCase()}</div>
          </div>
        </div>

        <div className="home-mobile-poster-wrap" style={{ position: "relative" }}>
          <Poster className="home-mobile-poster" />
          {isDormant && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}>
              <div style={{ height: 1, background: "#888" }} />
              <div style={{ background: "rgba(0,0,0,0.82)", padding: "18px 0", textAlign: "center", lineHeight: 1 }}>
                <span style={{
                  color: "white",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}>
                  INITIATION COMPLETE
                </span>
              </div>
              <div style={{ height: 1, background: "#888" }} />
            </div>
          )}
          <div style={{
            position: "absolute",
            bottom: 10,
            right: 6,
            left: "auto",
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            letterSpacing: 1.5,
            color: "#ffffff",
          }}>
            {eventLabel}
          </div>
        </div>

        <div className="home-mobile-cta-wrap">
          <button
            className="cta-button"
            onClick={() => setParticipationStep("chooser")}
            style={{
              width: "100%",
            }}
          >
            REQUEST PARTICIPATION
          </button>

          {!previewMode && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button
                onClick={() => {
                  setMode("login");
                  setLoginStep("phone");
                  setLoginPhone("");
                  setLoginCode("");
                  setMessage("");
                  setOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "none",
                }}
              >
                ALREADY REGISTERED?{" "}
                <span style={{ fontWeight: 900, color: "#cccccc" }}>LOG IN</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <SponsorSection />

      {participationStep !== "closed" && (
        <ParticipationModal
          step={participationStep}
          onClose={() => setParticipationStep("closed")}
          onStepChange={(s) => setParticipationStep(s)}
          isDormant={isDormant}
          previewMode={previewMode}
          previewKey={previewKey}
        />
      )}

      {open && (
        <div className="signup-overlay">
          <div className="signup-modal signup-modal-request">
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            {mode === "register" && step === "form" && (
              <>
                <div className="signup-title signup-title-large">
                  Participant Registration
                </div>

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
                    style={checkboxStyle}
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
                    style={checkboxStyle}
                  />
                  <span>
                    I agree to the <a href="/privacy">Privacy Policy</a>
                  </span>
                </label>

                {messageSlot}

                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={sendVerification}
                    disabled={loading}
                  >
                    {loading ? "SENDING..." : "REQUEST"}
                  </button>
                </div>
              </>
            )}

            {mode === "register" && step === "verify" && (
              <>
                <div className="signup-title signup-title-large">
                  Enter Verification Code
                </div>

                <input
                  placeholder="6 digit code"
                  className="signup-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                {messageSlot}

                <div className="signup-request-button-wrap">
                  <button
                    className="cta-button modal-primary-button"
                    onClick={verifyCode}
                    disabled={loading}
                  >
                    {loading ? "VERIFYING..." : "VERIFY"}
                  </button>
                </div>
              </>
            )}

            {mode === "login" && loginStep === "phone" && (
              <>
                <div className="signup-title signup-title-large" style={{ marginBottom: 0 }}>
                  Log In
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
                  <input
                    placeholder="PHONE NUMBER"
                    className="signup-input"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {messageSlot}
                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={sendLoginCode}
                    disabled={loading}
                  >
                    {loading ? "SENDING..." : "SEND CODE"}
                  </button>
                </div>
              </>
            )}

            {mode === "login" && loginStep === "verify" && (
              <>
                <div className="signup-title signup-title-large" style={{ marginBottom: 0 }}>
                  Enter Code
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
                  <input
                    placeholder="6 digit code"
                    className="signup-input"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {messageSlot}
                <div className="signup-request-button-wrap">
                  <button
                    className="cta-button modal-primary-button"
                    onClick={verifyLoginCode}
                    disabled={loading}
                  >
                    {loading ? "VERIFYING..." : "VERIFY"}
                  </button>
                </div>
              </>
            )}

            <button className="signup-close" onClick={() => { setOpen(false); setMode("register"); }}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
