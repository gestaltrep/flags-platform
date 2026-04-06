"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EmbeddedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "ga" | "vip";
  quantity: number;
  isMobile: boolean;
}

export default function EmbeddedCheckoutModal({
  isOpen,
  onClose,
  type,
  quantity,
  isMobile,
}: EmbeddedCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    setError("");
    setLoading(true);
    setClientSecret(null);

    try {
      const endpoint = type === "vip" ? "/api/create-vip-checkout" : "/api/create-checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();

      if (!res.ok || !data.clientSecret) {
        setError(data.error || "Checkout initialization failed.");
        return;
      }

      setClientSecret(data.clientSecret);
    } catch {
      setError("Checkout request failed.");
    } finally {
      setLoading(false);
    }
  }, [type, quantity]);

  useEffect(() => {
    if (isOpen) {
      fetchClientSecret();
      document.body.style.overflow = "hidden";
    } else {
      setClientSecret(null);
      setError("");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, fetchClientSecret]);

  if (!isOpen) return null;

  const label = type === "vip" ? "VIP TOKEN" : "TOKEN";
  const qtyLabel = quantity === 1 ? `${quantity} ${label}` : `${quantity} ${label}S`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.88)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        padding: isMobile ? "24px 16px 40px" : "40px 24px 60px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid white",
          background: "black",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid #333",
            padding: isMobile ? "14px 18px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? 11 : 12,
              letterSpacing: 3,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {">"} PURCHASE {qtyLabel}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontFamily: '"Courier New", monospace',
              fontSize: 18,
              lineHeight: 1,
              padding: "0 0 0 16px",
            }}
            aria-label="Close checkout"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? "0" : "0" }}>
          {loading && (
            <div
              style={{
                padding: isMobile ? "48px 24px" : "64px 24px",
                textAlign: "center",
                fontFamily: '"Courier New", monospace',
                fontSize: 11,
                letterSpacing: 3,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              {">"} INITIALIZING CHECKOUT...
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: isMobile ? "32px 18px" : "40px 24px",
                fontFamily: '"Courier New", monospace',
                fontSize: 11,
                letterSpacing: 2,
                color: "#ff4444",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              <div>{">"} ERROR: {error}</div>
              <button
                onClick={fetchClientSecret}
                style={{
                  marginTop: 24,
                  border: "1px solid white",
                  background: "black",
                  color: "white",
                  padding: "12px 24px",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {clientSecret && !loading && (
            // Stripe's EmbeddedCheckout renders its own iframe.
            // The outer div controls the container; Stripe handles internal styling.
            <div
              style={{
                // Stripe's embedded checkout has its own background; we clip it here.
                // "overflow: hidden" prevents iframe bleed outside the border.
                overflow: "hidden",
              }}
            >
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </div>

      {/* Dismiss hint */}
      {clientSecret && (
        <div
          style={{
            marginTop: 16,
            fontFamily: '"Courier New", monospace',
            fontSize: 10,
            letterSpacing: 2,
            color: "#444",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          CLICK OUTSIDE TO CANCEL
        </div>
      )}
    </div>
  );
}
