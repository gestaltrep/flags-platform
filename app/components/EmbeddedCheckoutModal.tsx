"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EmbeddedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "ga" | "vip";
  quantity: number;
  isMobile: boolean;
  onSuccess: () => void;
  amount: number;
}

function CheckoutForm({ onSuccess, isMobile, onSucceeded }: {
  onSuccess: () => void;
  isMobile: boolean;
  onSucceeded: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?purchase=complete`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed.");
      setSubmitting(false);
      return;
    }

    onSucceeded();
    onSuccess();
  }

  return (
    <div style={{ padding: isMobile ? "20px 18px" : "24px 24px" }}>
      <PaymentElement onReady={() => setReady(true)} />
      {error && (
        <div style={{
          marginTop: 12,
          fontFamily: '"Courier New", monospace',
          fontSize: 11, letterSpacing: 2,
          color: "#ff4444", textTransform: "uppercase",
        }}>{">"} {error}</div>
      )}
      <button
        onClick={handlePay}
        disabled={!ready || submitting}
        style={{
          marginTop: 20, width: "100%", minHeight: 54,
          border: `1px solid ${ready && !submitting ? "white" : "#444"}`,
          background: "black",
          color: ready && !submitting ? "white" : "#444",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 700, fontSize: isMobile ? 13 : 14,
          letterSpacing: 3.5, textTransform: "uppercase",
          cursor: ready && !submitting ? "pointer" : "not-allowed",
        }}
      >
        {submitting ? "PROCESSING..." : "PAY NOW"}
      </button>
    </div>
  );
}

export default function EmbeddedCheckoutModal({
  isOpen, onClose, type, quantity, isMobile, onSuccess, amount,
}: EmbeddedCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const fetchSecret = useCallback(async () => {
    setLoading(true);
    setError("");
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
        setError(data.error || "Failed to initialize checkout.");
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
      fetchSecret();
      setSucceeded(false);
      document.body.style.overflow = "hidden";
    } else {
      setClientSecret(null);
      setError("");
      setSucceeded(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, fetchSecret]);

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
      onClick={(e) => { if (!succeeded && e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520,
        border: "1px solid white", background: "black",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          borderBottom: "1px solid #333",
          padding: isMobile ? "14px 18px" : "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? 11 : 12, letterSpacing: 3,
              color: "white", textTransform: "uppercase",
            }}>
              GENERATE {qtyLabel}
            </div>
            {amount > 0 && (
              <div style={{
                fontFamily: '"Courier New", monospace',
                fontSize: isMobile ? 11 : 12,
                letterSpacing: 2,
                color: "#888888",
                textAlign: "center",
                marginTop: 4,
                marginBottom: 0,
              }}>
                {`$${(amount / 100).toFixed(2)} USD`}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#666",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 16px",
          }}>×</button>
        </div>

        {succeeded ? (
          <div style={{
            padding: isMobile ? "32px 18px" : "40px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: isMobile ? 11 : 12,
              letterSpacing: 2.5,
              color: "white",
              textTransform: "uppercase",
              lineHeight: 2,
            }}>
              {(() => {
                const tokenLabel = type === "vip" ? "VIP TOKEN" : "TOKEN";
                const tokenPlural = quantity > 1 ? `${quantity} ${tokenLabel}S` : tokenLabel;
                return (
                  <>
                    <div>{"> PAYMENT CONFIRMED."}</div>
                    <div>{`> GENERATING ${tokenPlural}...`}</div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div style={{
                padding: "48px 24px", textAlign: "center",
                fontFamily: '"Courier New", monospace',
                fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase",
              }}>INITIALIZING...</div>
            )}

            {error && !loading && (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <div style={{
                  fontFamily: '"Courier New", monospace', fontSize: 11,
                  letterSpacing: 2, color: "#ff4444", textTransform: "uppercase",
                }}>{error}</div>
                <button onClick={fetchSecret} style={{
                  marginTop: 20, border: "1px solid white", background: "black",
                  color: "white", padding: "12px 24px",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 11, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer",
                }}>RETRY</button>
              </div>
            )}

            {clientSecret && !loading && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorBackground: "#000000",
                      colorText: "#ffffff",
                      colorPrimary: "#ffffff",
                      borderRadius: "0px",
                    },
                  },
                }}
              >
                <CheckoutForm onSuccess={onSuccess} isMobile={isMobile} onSucceeded={() => setSucceeded(true)} />
              </Elements>
            )}
          </>
        )}
      </div>
      {!succeeded && clientSecret && !loading && (
        <div style={{
          marginTop: 16, fontFamily: '"Courier New", monospace',
          fontSize: 10, letterSpacing: 2, color: "#444",
          textTransform: "uppercase", textAlign: "center",
        }}>CLICK OUTSIDE TO CANCEL</div>
      )}
    </div>
  );
}
