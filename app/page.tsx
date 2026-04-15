"use client";

import { useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [smsChecked, setSmsChecked] = useState(false);
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

    if (!smsChecked) {
      setMessage("Please agree to receive SMS messages.");
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
      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();
        if (raw.includes("invalid parameter")) setMessage("SMS is not available right now.");
        else if (raw.includes("invalid") && raw.includes("phone")) setMessage("This phone number isn't valid.");
        else setMessage("We couldn't send your code. Please try again.");
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
        const raw = String(data?.error || "").toLowerCase();
        if (raw.includes("expired")) setMessage("That code has expired.");
        else if (raw.includes("incorrect") || raw.includes("invalid")) setMessage("That code is incorrect.");
        else setMessage("We couldn't verify your code. Please try again.");
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

  return (
    <>
      <main className="home-desktop">
        <div className="home-desktop-grid">
          <div style={{ position: "relative", display: "block" }} className="home-poster-wrap">
            <img src="/poster-image.png" className="home-poster-image" alt="Event site" />
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
              RAVE_Initiation.html
            </div>
          </div>

          <div className="home-desktop-info">
            <div className="home-date-desktop">May 30</div>
            <div className="home-time-desktop">4:30 PM – 12 AM</div>
            <div className="home-location-desktop">Port Charlotte, FL</div>

            <button
              className="cta-button"
              onClick={() => {
                setMode("register");
                setStep("form");
                setMessage("");
                setOpen(true);
              }}
              style={{
                width: 352,
                maxWidth: "100%",
              }}
            >
              REQUEST PARTICIPATION
            </button>

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
          </div>
        </div>
        <div className="home-help-text">HELP: support.signoresearchgroup@gmail.com</div>
      </main>

      <main className="home-mobile">
        <div className="home-mobile-frame">
          <div className="home-mobile-text">
            <div className="home-date-mobile">MAY 30</div>
            <div className="home-time-mobile">4:30 PM – 12 AM</div>
            <div className="home-location-mobile">PORT CHARLOTTE, FL</div>
          </div>
        </div>

        <div className="home-mobile-poster-wrap" style={{ position: "relative" }}>
          <img
            src="/poster-image.png"
            className="home-mobile-poster"
            alt="Event site"
          />
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
            RAVE_Initiation.html
          </div>
        </div>

        <div className="home-mobile-cta-wrap">
          <button
            className="cta-button"
            onClick={() => {
              setMode("register");
              setStep("form");
              setMessage("");
              setOpen(true);
            }}
            style={{
              width: "100%",
            }}
          >
            REQUEST PARTICIPATION
          </button>

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
        </div>
        <div className="home-help-text">HELP: support.signoresearchgroup@gmail.com</div>
      </main>

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
                  placeholder="Name"
                  className="signup-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  placeholder="Phone Number"
                  className="signup-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ marginBottom: 8 }}
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

                <label className="signup-checkbox" style={{ alignItems: "flex-start", marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={smsChecked}
                    onChange={(e) => setSmsChecked(e.target.checked)}
                    style={{
                      WebkitAppearance: "checkbox",
                      appearance: "auto",
                      accentColor: "#9ca3af",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.8)",
                      marginTop: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    I consent to receive SMS text messages from Signo Research Group, including event updates and account notifications. Message &amp; data rates may apply. Reply STOP to opt out at any time.
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
                    placeholder="Phone Number"
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
