"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "phone" | "code" | "success";

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default function ClaimTokenPage() {
  const [ticketId, setTicketId] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    const params = new URLSearchParams(window.location.search);
    setTicketId((params.get("ticket") || "").trim());

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const inputStyle: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      background: "black",
      border: "1px solid rgba(255,255,255,0.22)",
      color: "white",
      padding: isMobile ? "14px 14px" : "10px 12px",
      fontFamily: '"Courier New", monospace',
      fontSize: isMobile ? 15 : 13,
      letterSpacing: 1.2,
      outline: "none",
    }),
    [isMobile]
  );

  const buttonStyle: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      minHeight: 54,
      border: "1px solid white",
      background: "black",
      color: "white",
      padding: "12px 16px",
      fontSize: isMobile ? 13 : 17,
      fontWeight: 700,
      letterSpacing: isMobile ? 3.4 : 4.8,
      lineHeight: 1.02,
      textAlign: "center",
      cursor: "pointer",
      fontFamily: "Arial, Helvetica, sans-serif",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }),
    [isMobile]
  );

  function validatePhoneStep() {
    if (!ticketId) {
      return "Missing token.";
    }

    if (!phone.trim()) {
      return "Enter your phone number.";
    }

    if (!termsChecked) {
      return "Agree to Terms & Conditions.";
    }

    if (!privacyChecked) {
      return "Agree to Privacy Policy.";
    }

    return "";
  }

  function validateCodeStep() {
    if (!ticketId) {
      return "Missing token.";
    }

    if (!phone.trim()) {
      return "Enter your phone number.";
    }

    if (!code.trim()) {
      return "Enter verification code.";
    }

    return "";
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validatePhoneStep();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/claim-token/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          ticketId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error || "Couldn't send code.");
        return;
      }

      setStep("code");
      setMessage("VERIFICATION CODE TRANSMITTED.");
    } catch {
      setMessage("Couldn't send code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndClaim(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateCodeStep();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/claim-token/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
          ticketId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error || "Verification failed.");
        return;
      }

      setStep("success");
      setMessage("TOKEN CLAIMED. REDIRECTING...");
      window.location.href = "/dashboard";
    } catch {
      setMessage("Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  const fieldWrapStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: isMobile ? 18 : 22,
  };

  const messageReserveStyle: React.CSSProperties = {
    minHeight: isMobile ? 28 : 26,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 10,
    letterSpacing: 1.1,
    lineHeight: 1.35,
    color: "#c8c8c8",
    textAlign: "center",
  };

  const checkboxWrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? 10 : 8,
    marginTop: isMobile ? 8 : 4,
    marginBottom: isMobile ? 22 : 16,
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  };

  const checkboxStyle: React.CSSProperties = {
    WebkitAppearance: "checkbox",
    appearance: "auto",
    accentColor: "#9ca3af",
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
    width: isMobile ? 18 : 16,
    height: isMobile ? 18 : 16,
    cursor: "pointer",
    flexShrink: 0,
  };

  const checkboxTextStyle: React.CSSProperties = {
    fontSize: 12,
    lineHeight: 1.25,
    letterSpacing: 0.7,
    color: "white",
    cursor: "pointer",
  };

  const formInnerOffsetStyle: React.CSSProperties = {
    marginTop: "auto",
    paddingTop: isMobile ? 6 : 18,
  };

  return (
    <main
      style={{
        marginTop: isMobile ? 24 : 44,
        marginBottom: 60,
        paddingLeft: isMobile ? 20 : 0,
        paddingRight: isMobile ? 20 : 0,
        color: "white",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className={`signup-modal ${isMobile ? "" : "signup-modal-ticket"}`}
        style={{
          padding: 0,
          width: isMobile ? "100%" : undefined,
        }}
      >
        <div
          className="signup-header signup-header-home"
          style={{
            borderBottom: "none",
            marginBottom: isMobile ? 6 : 2,
            minHeight: isMobile ? 88 : 100,
          }}
        >
          <img src="/logo.png" className="signup-logo" alt="Signo logo" />
          <img
            src="/group-name.png"
            className="signup-group-name"
            alt="Signo Research Group"
          />
        </div>

        <div
          style={{
            width: "calc(100% - 48px)",
            margin: isMobile ? "0 auto 14px auto" : "0 auto 20px auto",
            borderBottom: "1px solid rgba(255, 255, 255, 0.62)",
          }}
        />

        <div
          style={{
            padding: isMobile ? "0 24px 24px 24px" : "0 24px 22px 24px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: isMobile ? undefined : 270,
          }}
        >
          <div
            className="signup-title signup-title-large"
            style={{
              marginTop: isMobile ? 2 : 12,
              marginBottom: isMobile ? 20 : 30,
              fontSize: isMobile ? 19 : undefined,
              letterSpacing: isMobile ? 2.8 : undefined,
              lineHeight: isMobile ? 1 : undefined,
            }}
          >
            Claim Token
          </div>

          <div
            className="modal-status-copy"
            style={{
              marginBottom: isMobile ? 12 : 10,
              fontSize: 14,
              lineHeight: isMobile ? 1.6 : 1.5,
            }}
          >
            <div className="modal-status-line">
              <span className="modal-status-symbol">{">"}</span>
              <span className="modal-status-text">
                VERIFY PHONE TO CLAIM TRANSMITTED TOKEN.
              </span>
            </div>
          </div>

          {step === "phone" && (
            <div style={checkboxWrapStyle}>
              <label style={checkboxRowStyle} htmlFor="claim-terms-consent">
                <input
                  id="claim-terms-consent"
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxTextStyle}>
                  I agree to the{" "}
                  <a
                    href="/terms"
                    style={{
                      color: "white",
                      textDecoration: "underline",
                    }}
                  >
                    Terms &amp; Conditions
                  </a>
                  .
                </span>
              </label>

              <label style={checkboxRowStyle} htmlFor="claim-privacy-consent">
                <input
                  id="claim-privacy-consent"
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxTextStyle}>
                  I agree to the{" "}
                  <a
                    href="/privacy"
                    style={{
                      color: "white",
                      textDecoration: "underline",
                    }}
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>
          )}

          {step === "phone" && (
            <form
              onSubmit={sendCode}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div style={formInnerOffsetStyle}>
                <div style={fieldWrapStyle}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    placeholder="PHONE NUMBER"
                    style={inputStyle}
                  />
                </div>

                <div style={messageReserveStyle}>{message || " "}</div>

                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? "SENDING..." : "SEND CODE"}
                </button>
              </div>
            </form>
          )}

          {step === "code" && (
            <form
              onSubmit={verifyAndClaim}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div style={formInnerOffsetStyle}>
                <div style={fieldWrapStyle}>
                  <input
                    value={phone}
                    readOnly
                    style={{
                      ...inputStyle,
                      opacity: 0.72,
                      marginBottom: 12,
                    }}
                  />

                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    placeholder="VERIFICATION CODE"
                    style={inputStyle}
                  />
                </div>

                <div style={messageReserveStyle}>{message || " "}</div>

                <button type="submit" style={buttonStyle} disabled={loading}>
                  {loading ? "VERIFYING..." : "CLAIM TOKEN"}
                </button>
              </div>
            </form>
          )}

          {step === "success" && message ? (
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                letterSpacing: 1.4,
                lineHeight: 1.5,
                color: "#c8c8c8",
                textAlign: "center",
              }}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}