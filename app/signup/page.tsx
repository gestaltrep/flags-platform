"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [gamerTag, setGamerTag] = useState("");
  const [message, setMessage] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  async function sendCode() {
    setMessage("");

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!smsConsent) {
      setMessage("You must consent to SMS messages before continuing.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });

    if (error) setMessage(error.message);
    else setMessage("Verification code sent");
  }

  async function verifyCode() {
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: code.trim(),
      type: "sms",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const user = data.user!;

    const { error: insertError } = await supabase.from("players").upsert({
      id: user.id,
      phone: phone.trim(),
      gamer_tag: gamerTag.trim(),
    });

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    setMessage("Account created!");
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "40px auto",
        padding: "24px",
        lineHeight: 1.6,
        color: "white",
        fontFamily: '"Courier New", monospace',
      }}
    >
      <h1 style={{ fontSize: 40, marginBottom: 24 }}>Create Account</h1>

      <div style={{ maxWidth: 560 }}>
        <label
          htmlFor="phone"
          style={{
            display: "block",
            fontSize: 14,
            marginBottom: 8,
            letterSpacing: 1.5,
          }}
        >
          Mobile Phone Number
        </label>

        <input
          id="phone"
          placeholder="Phone Number (e.g. +12395551234)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 18,
            marginBottom: 18,
            background: "black",
            color: "white",
            border: "1px solid #666",
            fontFamily: '"Courier New", monospace',
          }}
        />

        <div
          style={{
            border: "1px solid #333",
            padding: 18,
            marginBottom: 18,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            By checking the box below and submitting your phone number, you
            agree to receive SMS messages from <b>Signo Research Group</b>{" "}
            related to account verification, participant registration
            confirmation, event participation instructions, check-in reminders,
            and event updates related to your participation.
          </p>

          <p style={{ marginBottom: 12 }}>
            Message frequency varies by user activity and event status. Message
            and data rates may apply. Reply <b>STOP</b> to opt out. Reply{" "}
            <b>HELP</b> for help.
          </p>

          <p style={{ marginBottom: 0 }}>
            Consent is not a condition of purchase.
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
            fontSize: 14,
            lineHeight: 1.6,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              marginTop: 3,
              accentColor: "white",
            }}
          />
          <span>
            I agree to receive SMS messages from Signo Research Group as
            described above.
          </span>
        </label>

        <p style={{ marginBottom: 22, fontSize: 14 }}>
          <a href="/privacy">Privacy Policy</a> |{" "}
          <a href="/terms">Terms and Conditions</a>
        </p>

        <button
          onClick={sendCode}
          style={{
            padding: "12px 18px",
            fontSize: 18,
            marginBottom: 26,
            cursor: "pointer",
            border: "1px solid white",
            background: "black",
            color: "white",
            fontFamily: '"Courier New", monospace',
          }}
        >
          Send Verification Code
        </button>

        <div style={{ marginBottom: 18 }}>
          <label
            htmlFor="code"
            style={{
              display: "block",
              fontSize: 14,
              marginBottom: 8,
              letterSpacing: 1.5,
            }}
          >
            Verification Code
          </label>

          <input
            id="code"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: 18,
              background: "black",
              color: "white",
              border: "1px solid #666",
              fontFamily: '"Courier New", monospace',
            }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label
            htmlFor="gamerTag"
            style={{
              display: "block",
              fontSize: 14,
              marginBottom: 8,
              letterSpacing: 1.5,
            }}
          >
            Gamer Tag
          </label>

          <input
            id="gamerTag"
            placeholder="Gamer Tag"
            value={gamerTag}
            onChange={(e) => setGamerTag(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: 18,
              background: "black",
              color: "white",
              border: "1px solid #666",
              fontFamily: '"Courier New", monospace',
            }}
          />
        </div>

        <button
          onClick={verifyCode}
          style={{
            padding: "12px 18px",
            fontSize: 18,
            cursor: "pointer",
            border: "1px solid white",
            background: "black",
            color: "white",
            fontFamily: '"Courier New", monospace',
          }}
        >
          Create Account
        </button>

        {message && <p style={{ marginTop: 20, fontSize: 16 }}>{message}</p>}
      </div>
    </main>
  );
}