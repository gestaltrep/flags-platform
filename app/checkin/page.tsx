"use client";

import { useEffect, useRef, useState } from "react";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import { WAIVER_BODY } from "@/lib/waiver";

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectedCode = { rawValue: string };

type AppState =
  | "auth_checking"
  | "unauthorized"
  | "scanner"
  | "validating"
  | "confirm"
  | "success"
  | "error";

interface TicketHolder {
  name: string | null;
  phone: string | null;
}

interface TicketData {
  id: string;
  code: string;
  is_vip: boolean;
  is_table: boolean;
  buyer_user_id: string | null;
  claimed_by_user: string | null;
  holder: TicketHolder | null;
}

function getTier(ticket: TicketData): string {
  if (ticket.is_table) return "VIP TABLE";
  if (ticket.is_vip) return "VIP";
  return "GA";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MONO = '"Courier New", monospace';

const BASE: React.CSSProperties = {
  background: "black",
  minHeight: "100vh",
  color: "white",
  fontFamily: MONO,
};

const BTN: React.CSSProperties = {
  background: "black",
  border: "1px solid white",
  color: "white",
  padding: "14px 18px",
  letterSpacing: 2,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: MONO,
  textTransform: "uppercase",
};

// ─── MinimalScanner ───────────────────────────────────────────────────────────

// Pre-warm the WASM module on first import so the first scan isn't slow
if (typeof window !== "undefined") {
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => {
        if (path.endsWith(".wasm")) {
          return `/zxing-wasm/${path}`;
        }
        return prefix + path;
      },
    },
    fireImmediately: true,
  });
}

function MinimalScanner({
  onScan,
  onError,
}: {
  onScan: (code: DetectedCode) => void;
  onError: (err: Error) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let cancelled = false;
    let scanning = false;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const tick = async () => {
          if (cancelled) return;

          const video = videoRef.current;
          if (video && ctx && video.readyState >= 2 && !scanning) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              const imageData = ctx.getImageData(0, 0, w, h);

              scanning = true;
              try {
                const results = await readBarcodes(imageData, {
                  formats: ["QRCode"],
                  tryHarder: true,
                  tryRotate: true,
                  tryInvert: true,
                });
                if (results.length > 0 && results[0].text && !cancelled) {
                  onScanRef.current({ rawValue: results[0].text });
                  return;
                }
              } catch {
                // empty frames produce decode noise; swallow
              } finally {
                scanning = false;
              }
            }
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch (e: unknown) {
        onErrorRef.current(e instanceof Error ? e : new Error(String(e)));
      }
    })();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "1 / 1",
          objectFit: "cover",
          background: "black",
          outline: "2px solid red",
        }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const [appState, setAppState] = useState<AppState>("auth_checking");
  const [offlineBanner, setOfflineBanner] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // ── Auth check on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const params = new URLSearchParams(window.location.search);
      const keyParam = params.get("key");
      if (keyParam) {
        localStorage.setItem("checkin_staff_token", keyParam);
        window.history.replaceState({}, "", "/checkin");
      }

      const token = localStorage.getItem("checkin_staff_token");
      if (!token) {
        setAppState("unauthorized");
        return;
      }

      try {
        const res = await fetch("/api/checkin-auth", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(
            "checkin_staff_token_valid_until",
            String(data.valid_until_ms)
          );
          setAppState("scanner");
          return;
        }

        if (res.status === 401) {
          localStorage.removeItem("checkin_staff_token");
          setAppState("unauthorized");
          return;
        }

        // Non-200/401 — check offline cache
        const validUntil = Number(
          localStorage.getItem("checkin_staff_token_valid_until") || "0"
        );
        if (validUntil > Date.now()) {
          setOfflineBanner(true);
          setAppState("scanner");
        } else {
          setAppState("unauthorized");
        }
      } catch {
        const validUntil = Number(
          localStorage.getItem("checkin_staff_token_valid_until") || "0"
        );
        if (validUntil > Date.now()) {
          setOfflineBanner(true);
          setAppState("scanner");
        } else {
          setAppState("unauthorized");
        }
      }
    }

    checkAuth();
  }, []); // mount only

  // ── Code submission (scanner + manual entry share this path) ────────────
  function submitCode(code: string) {
    setCurrentCode(code);
    setAppState("validating");

    const token = localStorage.getItem("checkin_staff_token") || "";

    fetch("/api/scan-ticket", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("checkin_staff_token");
          setAppState("unauthorized");
          return;
        }

        const data = await res.json();

        if (res.status === 404) {
          setErrorMessage("TOKEN NOT FOUND");
          setAppState("error");
          return;
        }

        if (res.status === 409) {
          setErrorMessage(data.message || "Token already used.");
          setAppState("error");
          return;
        }

        if (res.ok && data.success) {
          setTicket(data.ticket);
          setWaiverChecked(false);
          setAppState("confirm");
        }
      })
      .catch(() => {
        setErrorMessage("NETWORK ERROR");
        setAppState("error");
      });
  }

  // ── Scanner handler ──────────────────────────────────────────────────────
  function handleScan(detected: DetectedCode) {
    if (appState !== "scanner") return;
    const rawValue = detected.rawValue;
    if (!rawValue) return;

    let code: string;
    try {
      const url = new URL(rawValue);
      code = (url.searchParams.get("code") || "").trim().toUpperCase();
      if (!code) code = rawValue.trim().toUpperCase();
    } catch {
      code = rawValue.trim().toUpperCase();
    }

    submitCode(code);
  }

  function handleManualSubmit() {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setManualCode("");
    submitCode(code);
  }

  // ── Check-in submit ──────────────────────────────────────────────────────
  async function completeCheckIn() {
    const token = localStorage.getItem("checkin_staff_token") || "";

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: currentCode, waiver_accepted: true }),
      });

      if (res.status === 401) {
        localStorage.removeItem("checkin_staff_token");
        setAppState("unauthorized");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "CHECK-IN FAILED");
        setAppState("error");
        return;
      }

      setCheckedInCount((n) => n + 1);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      setAppState("success");
      successTimerRef.current = setTimeout(() => setAppState("scanner"), 3000);
    } catch {
      setErrorMessage("NETWORK ERROR");
      setAppState("error");
    }
  }

  function scanNext() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setAppState("scanner");
  }

  // ── Render ───────────────────────────────────────────────────────────────

  // auth_checking — blank black screen
  if (appState === "auth_checking") {
    return <main style={BASE} />;
  }

  // unauthorized — gate page JSX duplicated inline (URL stays /checkin)
  if (appState === "unauthorized") {
    return (
      <main
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes eerieBreath {
            0%   { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.88) saturate(0.95); }
            25%  { transform: scale(1.006) translate(-0.5px, 0.5px); filter: brightness(0.93) saturate(1.01); }
            50%  { transform: scale(1.010) translate(0px, 0.8px); filter: brightness(0.97) saturate(1.06); }
            75%  { transform: scale(1.005) translate(0.5px, 0.3px); filter: brightness(0.92) saturate(1.02); }
            100% { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.88) saturate(0.95); }
          }
        `}</style>
        <img
          src="/thislong.gif"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            animation: "eerieBreath 10s ease-in-out infinite",
            willChange: "transform, filter",
          }}
        />
      </main>
    );
  }

  // scanner
  if (appState === "scanner") {
    return (
      <main style={{ ...BASE, paddingBottom: 32 }}>
        {offlineBanner && (
          <div
            style={{
              background: "#1a0000",
              color: "red",
              textAlign: "center",
              padding: "6px 12px",
              letterSpacing: 2,
              fontSize: 11,
              fontFamily: MONO,
              borderBottom: "1px solid #500",
            }}
          >
            OFFLINE — CACHED AUTH
          </div>
        )}

        <MinimalScanner
          onScan={handleScan}
          onError={(err) => console.error("scanner:", err.message)}
        />

        <div
          style={{
            textAlign: "center",
            color: "red",
            letterSpacing: 3,
            fontSize: 13,
            fontFamily: MONO,
            padding: "16px 0",
          }}
        >
          {">"} AIM AT ENTRY TOKEN
        </div>

        <div
          style={{
            margin: "0 20px",
            color: "#444",
            fontSize: 10,
            letterSpacing: 1.5,
            fontFamily: MONO,
            marginBottom: 8,
          }}
        >
          CHECKED IN: {checkedInCount}
        </div>

        <div
          style={{
            margin: "0 20px",
            border: "1px solid #2a2a2a",
            padding: "16px",
          }}
        >
          <div
            style={{
              color: "#555",
              textAlign: "center",
              fontSize: 10,
              letterSpacing: 2,
              fontFamily: MONO,
              marginBottom: 12,
            }}
          >
            ─── OR ENTER CODE MANUALLY ───
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={manualCode}
              onChange={(e) =>
                setManualCode(e.target.value.toUpperCase())
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleManualSubmit();
              }}
              maxLength={8}
              placeholder="CODE"
              style={{
                flex: 1,
                background: "black",
                border: "1px solid #555",
                color: "white",
                padding: "12px 10px",
                fontFamily: MONO,
                fontSize: 15,
                letterSpacing: 3,
                outline: "none",
                minWidth: 0,
              }}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              style={{
                background: "black",
                border: `1px solid ${manualCode.trim() ? "red" : "#400"}`,
                color: manualCode.trim() ? "red" : "#400",
                padding: "12px 16px",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: 2,
                cursor: manualCode.trim() ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              SUBMIT
            </button>
          </div>
        </div>
      </main>
    );
  }

  // validating
  if (appState === "validating") {
    return (
      <main
        style={{
          ...BASE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ letterSpacing: 3, color: "#aaa" }}>
          {">"} VALIDATING TOKEN...
        </div>
        <div style={{ letterSpacing: 2, color: "#555", fontSize: 13 }}>
          {currentCode}
        </div>
      </main>
    );
  }

  // confirm
  if (appState === "confirm" && ticket) {
    return (
      <main style={{ ...BASE, padding: "32px 24px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, letterSpacing: 3, fontSize: 15 }}>
          {">"} ENTRY TOKEN VALIDATED
        </div>

        <div
          style={{
            marginBottom: 24,
            letterSpacing: 2,
            lineHeight: 2.2,
            fontSize: 13,
            fontFamily: MONO,
          }}
        >
          <div>
            <span style={{ color: "#888" }}>CODE:{"   "}</span>
            {ticket.code}
          </div>
          <div>
            <span style={{ color: "#888" }}>TIER:{"   "}</span>
            {getTier(ticket)}
          </div>
          <div>
            <span style={{ color: "#888" }}>HOLDER: </span>
            {ticket.holder?.name ?? "(UNKNOWN)"}
          </div>
          <div>
            <span style={{ color: "#888" }}>PHONE:{"  "}</span>
            {ticket.holder?.phone ?? "(UNKNOWN)"}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #333",
            maxHeight: 200,
            overflowY: "auto",
            padding: "12px 14px",
            marginBottom: 20,
            fontSize: 10,
            lineHeight: 1.65,
            color: "#999",
            whiteSpace: "pre-wrap",
            fontFamily: MONO,
          }}
        >
          {WAIVER_BODY}
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={waiverChecked}
            onChange={(e) => setWaiverChecked(e.target.checked)}
            style={{
              flexShrink: 0,
              marginTop: 3,
              accentColor: "#9ca3af",
              cursor: "pointer",
              width: 16,
              height: 16,
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              lineHeight: 1.6,
              fontFamily: MONO,
            }}
          >
            PARTICIPANT HAS READ AND ACCEPTS THE HOLD-HARMLESS WAIVER
          </span>
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={completeCheckIn}
            disabled={!waiverChecked}
            style={{
              ...BTN,
              flex: 1,
              color: waiverChecked ? "white" : "#444",
              borderColor: waiverChecked ? "white" : "#444",
              cursor: waiverChecked ? "pointer" : "not-allowed",
            }}
          >
            COMPLETE CHECK-IN
          </button>
          <button
            onClick={() => setAppState("scanner")}
            style={{
              ...BTN,
              flex: 1,
              borderColor: "#555",
              color: "#888",
            }}
          >
            CANCEL
          </button>
        </div>
      </main>
    );
  }

  // success
  if (appState === "success") {
    return (
      <main
        style={{
          ...BASE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
          padding: "32px 24px",
        }}
      >
        <div style={{ fontSize: 80, lineHeight: 1, color: "#00cc44" }}>✓</div>
        <div style={{ letterSpacing: 3, color: "#00cc44", fontSize: 14 }}>
          {">"} CHECK-IN COMPLETE
        </div>
        <div style={{ letterSpacing: 2, color: "#666", fontSize: 12 }}>
          {currentCode}
        </div>
        <button
          onClick={scanNext}
          style={{
            ...BTN,
            borderColor: "#00cc44",
            color: "#00cc44",
            marginTop: 8,
          }}
        >
          SCAN NEXT
        </button>
        <div style={{ color: "#333", fontSize: 10, letterSpacing: 1.5 }}>
          AUTO-RETURN IN 3S
        </div>
      </main>
    );
  }

  // error
  if (appState === "error") {
    return (
      <main
        style={{
          ...BASE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
          padding: "32px 24px",
        }}
      >
        <div style={{ color: "red", letterSpacing: 3, fontSize: 14 }}>
          {">"} ERROR
        </div>
        <div style={{ color: "red", letterSpacing: 2, fontSize: 13 }}>
          {errorMessage}
        </div>
        <div style={{ color: "#555", fontSize: 12, letterSpacing: 1.5 }}>
          {currentCode}
        </div>
        <button
          onClick={() => setAppState("scanner")}
          style={{
            ...BTN,
            borderColor: "red",
            color: "red",
            marginTop: 8,
          }}
        >
          SCAN ANOTHER
        </button>
      </main>
    );
  }

  return null;
}
