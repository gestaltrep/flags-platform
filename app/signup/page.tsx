"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [gamerTag, setGamerTag] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode() {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) setMessage(error.message);
    else setMessage("Verification code sent");
  }

  async function verifyCode() {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: "sms",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const user = data.user!;

    await supabase.from("players").insert({
      id: user.id,
      phone: phone,
      gamer_tag: gamerTag,
    });

    setMessage("Account created!");
  }

  return (
    <div style={{ padding: 40 }}>

      <h1>Create Account</h1>

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {/* ✅ REQUIRED CONSENT */}
      <div style={{ maxWidth: 500, fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>
        <p>
          By providing your phone number you consent to receive SMS messages from
          <b> Signo Research Group </b> related to account verification and participation in the event experience.
        </p>

        <p>
          Message frequency varies. Message and data rates may apply.
        </p>

        <p>
          Reply <b>STOP</b> to unsubscribe. Reply <b>HELP</b> for assistance.
        </p>

        <p style={{ marginTop: 10 }}>
          <a href="/privacy">Privacy Policy</a> |{" "}
          <a href="/terms">Terms and Conditions</a>
        </p>
      </div>

      <br />

      <button onClick={sendCode}>Send Code</button>

      <br /><br />

      <input
        placeholder="Verification Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Gamer Tag"
        value={gamerTag}
        onChange={(e) => setGamerTag(e.target.value)}
      />

      <br /><br />

      <button onClick={verifyCode}>Create Account</button>

      <p>{message}</p>

    </div>
  );
}