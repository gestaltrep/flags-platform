"use client";

import { useEffect, useState } from "react";

export default function DevLoginPage() {
  const [message, setMessage] = useState("Signing in...");

  useEffect(() => {
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);
        const phone = (params.get("phone") || "").trim();

        if (!phone) {
          setMessage("Missing phone number.");
          return;
        }

        const res = await fetch(
          `/api/dev-login?phone=${encodeURIComponent(phone)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok || !data?.success) {
          setMessage(data?.error || "Dev login failed.");
          return;
        }

        window.location.href = "/dashboard";
      } catch (error) {
        console.error("dev-login page error:", error);
        setMessage("Dev login failed.");
      }
    }

    run();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "black",
        color: "white",
        fontFamily: '"Courier New", monospace',
        letterSpacing: 2,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>{message}</div>
    </main>
  );
}