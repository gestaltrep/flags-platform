"use client";

import { useEffect, useState } from "react";

export default function CheckInPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    const params = new URLSearchParams(window.location.search);
    setCode(params.get("code") || "");

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function completeCheckIn() {
    if (!code) {
      setStatus("error");
      setMessage("No token code provided.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/scan-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message || "Check-in failed.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Entry confirmed.");
    } catch (error) {
      setStatus("error");
      setMessage("Check-in failed.");
    }
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: isMobile ? "28px auto" : "80px auto",
        padding: isMobile ? 16 : 20,
        color: "white",
        fontFamily: '"Courier New", monospace',
        letterSpacing: 2,
      }}
    >
      <div
        style={{
          fontSize: 28,
          marginBottom: 24,
          letterSpacing: isMobile ? 4 : 6,
          wordBreak: "break-word",
        }}
      >
        Check-In Terminal
      </div>

      <div
        style={{
          border: "1px solid #666",
          padding: isMobile ? 18 : 24,
        }}
      >
        <div style={{ marginBottom: 12 }}>{">"} TOKEN CODE</div>

        <div
          style={{
            fontSize: isMobile ? 26 : 22,
            marginBottom: 24,
            wordBreak: "break-word",
            lineHeight: 1.3,
          }}
        >
          {code || "NO CODE DETECTED"}
        </div>

        <button
          onClick={completeCheckIn}
          disabled={!code || status === "loading"}
          style={{
            border: "1px solid white",
            background: "black",
            color: "white",
            padding: "14px 24px",
            fontSize: isMobile ? 15 : 16,
            cursor: !code || status === "loading" ? "default" : "pointer",
            width: isMobile ? "100%" : "auto",
            opacity: !code || status === "loading" ? 0.7 : 1,
            fontFamily: '"Courier New", monospace',
          }}
        >
          {status === "loading" ? "PROCESSING..." : "COMPLETE CHECK-IN"}
        </button>

        {message && (
          <div
            style={{
              marginTop: 24,
              color: status === "success" ? "white" : "#bbb",
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.6,
            }}
          >
            {">"} {message}
          </div>
        )}
      </div>
    </main>
  );
}