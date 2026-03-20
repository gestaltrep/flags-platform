"use client";

import { useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");

  async function sendVerification() {
    if (!name || !phone) {
      alert("Please enter name and phone number");
      return;
    }

    try {
      await fetch("/api/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      setStep("verify");
    } catch (err) {
      console.error("verification failed", err);
    }
  }

  async function verifyCode() {
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Verification successful");
        setOpen(false);
      } else {
        alert("Invalid code");
      }
    } catch (err) {
      console.error("verification error", err);
    }
  }

  return (
    <>
      <main className="home-desktop">
        <div className="home-desktop-grid">
          <div className="home-poster-wrap">
            <img
              src="/poster-image.png"
              className="home-poster-image"
              alt="Event site"
            />
          </div>

          <div className="home-desktop-info">
            <div className="home-date-desktop">May 30</div>
            <div className="home-time-desktop">5 PM – 5 AM</div>
            <div className="home-location-desktop">Immokalee, FL</div>

            <button
              className="cta-button"
              onClick={() => {
                setStep("form");
                setOpen(true);
              }}
              style={{
                width: 272,
                maxWidth: "100%",
              }}
            >
              REQUEST PARTICIPATION
            </button>
          </div>
        </div>
      </main>

      <main className="home-mobile">
        <div className="home-mobile-frame">
          <div className="home-mobile-text">
            <div className="home-date-mobile">MAY 30</div>
            <div className="home-time-mobile">5 PM – 5 AM</div>
            <div className="home-location-mobile">IMMOKALEE, FL</div>
          </div>
        </div>

        <div className="home-mobile-poster-wrap">
          <img
            src="/poster-image.png"
            className="home-mobile-poster"
            alt="Event site"
          />
        </div>

        <div className="home-mobile-cta-wrap">
          <button
            className="cta-button"
            onClick={() => {
              setStep("form");
              setOpen(true);
            }}
            style={{
              width: "100%",
            }}
          >
            REQUEST PARTICIPATION
          </button>
        </div>
      </main>

      {open && (
        <div className="signup-overlay">
          <div className="signup-modal">
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            {step === "form" && (
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
                />

                <label className="signup-checkbox">
                  <input type="checkbox" />
                  <span>
                    I agree to the <a href="/terms">Terms &amp; Conditions</a>
                  </span>
                </label>

                <label className="signup-checkbox">
                  <input type="checkbox" />
                  <span>
                    I agree to the <a href="/privacy">Privacy Policy</a>
                  </span>
                </label>

                <button
                  className="cta-button modal-primary-button"
                  onClick={sendVerification}
                >
                  REQUEST
                </button>

                <div className="signup-help-text">This sends SMS code.</div>
              </>
            )}

            {step === "verify" && (
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

                <button
                  className="cta-button modal-primary-button"
                  onClick={verifyCode}
                >
                  VERIFY
                </button>
              </>
            )}

            <button className="signup-close" onClick={() => setOpen(false)}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </>
  );
}