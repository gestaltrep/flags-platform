"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

interface StripeInstance {
  initCheckoutElementsSdk: (options: {
    clientSecret: string | Promise<string>;
    elementsOptions?: object;
  }) => CheckoutSdk;
}

interface CheckoutSdk {
  on: (event: string, handler: (session: { canConfirm: boolean }) => void) => void;
  loadActions: () => Promise<{ type: string; actions?: CheckoutActions }>;
  createPaymentElement: () => { mount: (selector: string) => void };
}

interface CheckoutActions {
  confirm: () => Promise<{ type: string; error?: { message: string } }>;
  getSession: () => { total: { total: { amount: string } } };
}

interface EmbeddedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "ga" | "vip";
  quantity: number;
  isMobile: boolean;
  onSuccess: () => void;
}

export default function EmbeddedCheckoutModal({
  isOpen,
  onClose,
  type,
  quantity,
  isMobile,
  onSuccess,
}: EmbeddedCheckoutModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [total, setTotal] = useState("");
  const actionsRef = useRef<CheckoutActions | null>(null);
  const checkoutRef = useRef<CheckoutSdk | null>(null);
  const mountedRef = useRef(false);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError("");
    setCanPay(false);
    setTotal("");
    actionsRef.current = null;
    mountedRef.current = false;

    try {
      const endpoint = type === "vip" ? "/api/create-vip-checkout" : "/api/create-checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        setError(data.error || "Failed to initialize checkout.");
        setLoading(false);
        return;
      }

      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
      const stripe = window.Stripe!(stripeKey);

      const checkout = stripe.initCheckoutElementsSdk({
        clientSecret: data.clientSecret,
        elementsOptions: { appearance: { theme: "night" } },
      });
      checkoutRef.current = checkout;

      checkout.on("change", (session) => {
        setCanPay(session.canConfirm);
      });

      const result = await checkout.loadActions();
      if (result.type === "success" && result.actions) {
        actionsRef.current = result.actions;
        const session = result.actions.getSession();
        setTotal(session.total.total.amount);
      }

      const paymentElement = checkout.createPaymentElement();
      paymentElement.mount("#stripe-payment-element");
      mountedRef.current = true;
      setLoading(false);
    } catch (err) {
      console.error("Checkout init error:", err);
      setError("Checkout initialization failed.");
      setLoading(false);
    }
  }, [type, quantity]);

  useEffect(() => {
    if (!isOpen) return;

    // Load Stripe.js if not already loaded
    if (!window.Stripe) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => initialize();
      document.head.appendChild(script);
    } else {
      initialize();
    }

    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, initialize]);

  async function handlePay() {
    if (!actionsRef.current || submitting) return;
    setSubmitting(true);
    setError("");

    const result = await actionsRef.current.confirm();
    if (result.type === "error") {
      setError(result.error?.message || "Payment failed.");
      setSubmitting(false);
      return;
    }
    // Payment succeeded — webhook will handle token generation
    onSuccess();
    onClose();
  }

  if (!isOpen) return null;

  const label = type === "vip" ? "VIP TOKEN" : "TOKEN";
  const qtyLabel = quantity === 1 ? `${quantity} ${label}` : `${quantity} ${label}S`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        zIndex: 1000, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        overflowY: "auto", padding: isMobile ? "24px 16px 40px" : "40px 24px 60px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520,
        border: "1px solid white", background: "black",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid #333",
          padding: isMobile ? "14px 18px" : "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: isMobile ? 11 : 12, letterSpacing: 3,
            color: "white", textTransform: "uppercase",
          }}>
            {">"} GENERATE {qtyLabel}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#666",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 16px",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? "20px 18px" : "24px 24px" }}>
          {loading && (
            <div style={{
              padding: "48px 0", textAlign: "center",
              fontFamily: '"Courier New", monospace',
              fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase",
            }}>{">"} INITIALIZING...</div>
          )}

          {error && (
            <div style={{
              fontFamily: '"Courier New", monospace', fontSize: 11,
              letterSpacing: 2, color: "#ff4444", textTransform: "uppercase",
              marginBottom: 16,
            }}>{">"} {error}</div>
          )}

          {/* Stripe mounts the card form here */}
          <div id="stripe-payment-element" style={{ display: loading ? "none" : "block" }} />

          {!loading && (
            <button
              onClick={handlePay}
              disabled={!canPay || submitting}
              style={{
                marginTop: 24, width: "100%", minHeight: 54,
                border: `1px solid ${canPay && !submitting ? "white" : "#444"}`,
                background: "black",
                color: canPay && !submitting ? "white" : "#444",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 700, fontSize: isMobile ? 13 : 14,
                letterSpacing: 3.5, textTransform: "uppercase",
                cursor: canPay && !submitting ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "> PROCESSING..." : total ? `> PAY ${total}` : "> PAY NOW"}
            </button>
          )}
        </div>
      </div>
      {!loading && (
        <div style={{
          marginTop: 16, fontFamily: '"Courier New", monospace',
          fontSize: 10, letterSpacing: 2, color: "#444",
          textTransform: "uppercase", textAlign: "center",
        }}>CLICK OUTSIDE TO CANCEL</div>
      )}
    </div>
  );
}
