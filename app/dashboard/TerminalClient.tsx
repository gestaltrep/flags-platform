"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

type Ticket = {
  id?: string;
  code: string;
  vip?: boolean;
  is_vip?: boolean;
  claimed?: boolean;
  claimed_at?: string | null;
  created_at?: string;
};

export default function TerminalClient() {
  const pathname = usePathname();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [tier, setTier] = useState(1);
  const [sold, setSold] = useState(0);
  const [vipSold, setVipSold] = useState(0);

  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showTierPanel, setShowTierPanel] = useState(false);
  const [showEntrySection, setShowEntrySection] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);

  const [gaQuantity, setGaQuantity] = useState(1);
  const [vipQuantity, setVipQuantity] = useState(1);

  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [viewportWidth, setViewportWidth] = useState(1400);

  const timeoutIdsRef = useRef<number[]>([]);

  const bootScript = [
    "> INITIALIZING SESSION",
    "> AUTHENTICATING USER",
    "> CONNECTING TO ARCHIVE",
    "> ACCESS CONFIRMED",
    "> SESSION STATUS: OPEN",
    "> DISPLAYING ENTRY CODES",
  ];

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 900;

  async function loadTickets() {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data = await res.json();
      setTickets(data || []);
    } catch (err) {
      console.error("Ticket load failed", err);
      setTickets([]);
    }
    setLoadingTickets(false);
  }

  async function loadTier() {
    try {
      const res = await fetch("/api/tier-status", { cache: "no-store" });
      const data = await res.json();

      setTier(data.tier ?? 1);
      setSold(data.sold ?? 0);
      setVipSold(data.vipSold ?? 0);
    } catch (err) {
      console.error("Tier load failed", err);
    }
  }

  function clearBootTimers() {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  }

  function startBootSequence() {
    clearBootTimers();

    setTerminalLines([]);
    setShowTierPanel(false);
    setShowEntrySection(false);
    setShowButtons(false);
    setCheckoutMessage("");
    setLoadingTickets(true);

    loadTickets();
    loadTier();

    bootScript.forEach((line, index) => {
      const id = window.setTimeout(() => {
        setTerminalLines((prev) => [...prev, line]);
      }, index * 450);
      timeoutIdsRef.current.push(id);
    });

    const bootDoneTime = bootScript.length * 450;

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        if (!isMobile) setShowTierPanel(true);
      }, bootDoneTime + 220)
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setShowEntrySection(true);
      }, bootDoneTime + (isMobile ? 260 : 560))
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setShowButtons(true);
      }, bootDoneTime + (isMobile ? 520 : 900))
    );
  }

  useEffect(() => {
    if (pathname === "/dashboard") {
      startBootSequence();
    }

    return () => {
      clearBootTimers();
    };
  }, [pathname, isMobile]);

  function tierColor(targetTier: number) {
    return tier === targetTier ? "#ffffff" : "#555555";
  }

  function tierProgressPercent() {
    return Math.max(0, Math.min(100, (sold / 1000) * 100));
  }

  function vipProgressPercent() {
    return Math.max(0, Math.min(100, (vipSold / 150) * 100));
  }

  function decGa() {
    setGaQuantity((prev) => Math.max(1, prev - 1));
  }

  function incGa() {
    setGaQuantity((prev) => Math.min(10, prev + 1));
  }

  function decVip() {
    setVipQuantity((prev) => Math.max(1, prev - 1));
  }

  function incVip() {
    const remaining = Math.max(0, 150 - vipSold);
    const maxAllowed = Math.max(1, Math.min(10, remaining));
    setVipQuantity((prev) => Math.min(maxAllowed, prev + 1));
  }

  async function generateTokens() {
    setCheckoutMessage("");

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: gaQuantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutMessage(data.error || "Checkout failed.");
        return;
      }

      if (!data.url) {
        setCheckoutMessage("No checkout URL was returned.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("GA checkout failed", err);
      setCheckoutMessage("Checkout request failed.");
    }
  }

  async function generateVipTokens() {
    setCheckoutMessage("");

    try {
      const res = await fetch("/api/create-vip-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: vipQuantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutMessage(data.error || "VIP checkout failed.");
        return;
      }

      if (!data.url) {
        setCheckoutMessage("No VIP checkout URL was returned.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("VIP checkout failed", err);
      setCheckoutMessage("VIP checkout request failed.");
    }
  }

  const qrBase =
    process.env.NEXT_PUBLIC_QR_BASE_URL || window.location.origin;

  const actionButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    lineHeight: 1.02,
    padding: "14px 20px",
    fontSize: 13,
    letterSpacing: 3.6,
    whiteSpace: "nowrap",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 700,
    textTransform: "uppercase",
  };

  const modalArrowButtonStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    padding: 0,
    fontSize: 10,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const modalQuantityBoxStyle: React.CSSProperties = {
    width: 64,
    height: 30,
    border: "1px solid #666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    letterSpacing: 2,
  };

  return (
    <main
      style={{
        marginTop: isMobile ? 34 : 120,
        marginLeft: isMobile ? 20 : 120,
        marginRight: isMobile ? 20 : 40,
        marginBottom: 60,
      }}
    >
      {!isMobile ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "460px 1fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 30,
                letterSpacing: 6,
                marginBottom: 24,
              }}
            >
              Terminal
            </div>

            <div
              style={{
                border: "1px solid #888",
                padding: 20,
                width: 460,
                fontSize: 13,
                letterSpacing: 1.4,
                lineHeight: 1.7,
                minHeight: 178,
              }}
            >
              {terminalLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}

              {!showTierPanel && <span className="cursor">_</span>}
            </div>

            {showTierPanel && (
              <div
                style={{
                  border: "1px solid #888",
                  borderTop: "none",
                  padding: 20,
                  width: 460,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 12,
                    letterSpacing: 2,
                  }}
                >
                  TOKENS
                </div>

                <div
                  style={{
                    width: 300,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ color: tierColor(1) }}>TIER 1</div>
                  <div style={{ color: tierColor(2) }}>TIER 2</div>
                  <div style={{ color: tierColor(3) }}>TIER 3</div>
                </div>

                <div
                  style={{
                    position: "relative",
                    width: 300,
                    height: 12,
                    background: "#222",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: `${tierProgressPercent()}%`,
                      height: "100%",
                      background: "white",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "33.3333%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "#888",
                      transform: "translateX(-0.5px)",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "66.6666%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "#888",
                      transform: "translateX(-0.5px)",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 8,
                    letterSpacing: 2,
                  }}
                >
                  VIP TOKENS
                </div>

                <div
                  style={{
                    position: "relative",
                    width: 300,
                    height: 12,
                    background: "#222",
                  }}
                >
                  <div
                    style={{
                      width: `${vipProgressPercent()}%`,
                      height: "100%",
                      background: "white",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                marginBottom: 16,
              }}
            >
              Entry Tokens
            </div>

            {!showEntrySection && (
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: 2,
                  marginBottom: 18,
                }}
              >
                Loading...
              </div>
            )}

            {showEntrySection && !loadingTickets && tickets.length === 0 && (
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: 2,
                  marginBottom: 18,
                }}
              >
                {">"} USER HAS NO ENTRY TOKENS
              </div>
            )}

            {showEntrySection && tickets.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 2,
                  lineHeight: 1.8,
                  marginBottom: 18,
                  color: "#c8c8c8",
                }}
              >
                <div>{">"} TOKENS REGISTERED TO USER</div>
                <div>{">"} PRESENT TOKEN AT ENTRY CHECKPOINT</div>
              </div>
            )}

            {showEntrySection && !loadingTickets && tickets.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
                  gap: 18,
                  maxWidth: 420,
                  marginBottom: 22,
                }}
              >
                {tickets.map((ticket, index) => {
                  const isVip = ticket.is_vip || ticket.vip;
                  const isUsed = !!ticket.claimed;

                  return (
                    <div
                      key={ticket.id || index}
                      style={{
                        border: "1px solid #555",
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                          fontSize: 11,
                          letterSpacing: 2,
                        }}
                      >
                        <span>{isVip ? "VIP" : "GA"}</span>
                        <span style={{ color: isUsed ? "#888" : "#fff" }}>
                          {isUsed ? "USED" : "ACTIVE"}
                        </span>
                      </div>

                      <QRCodeSVG
                        value={`${qrBase}/checkin?code=${ticket.code}`}
                        size={120}
                      />

                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 11,
                          letterSpacing: 2,
                          color: "#b8b8b8",
                        }}
                      >
                        TOKEN CODE
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          letterSpacing: 2,
                          marginTop: 4,
                        }}
                      >
                        {ticket.code}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showButtons && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "360px",
                  gap: 18,
                  maxWidth: 360,
                }}
              >
                <button
                  className="cta-button"
                  style={actionButtonStyle}
                  onClick={() => setPurchaseOpen(true)}
                >
                  GENERATE TOKENS
                </button>

                <button
                  className="cta-button"
                  style={actionButtonStyle}
                  onClick={() => setVipOpen(true)}
                >
                  GENERATE VIP TOKENS
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              marginBottom: 20,
            }}
          >
            Terminal
          </div>

          <div
            style={{
              border: "1px solid #888",
              padding: 16,
              fontSize: 12,
              letterSpacing: 1.2,
              lineHeight: 1.7,
              marginBottom: 24,
              minHeight: 160,
            }}
          >
            {terminalLines.map((line, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>
                {line}
              </div>
            ))}

            {!showEntrySection && (
              <div style={{ marginTop: 12 }}>
                <span className="cursor">_</span>
              </div>
            )}
          </div>

          {!showEntrySection && (
            <div
              style={{
                fontSize: 13,
                letterSpacing: 2,
                marginBottom: 18,
              }}
            >
              Loading...
            </div>
          )}

          {showEntrySection && !loadingTickets && tickets.length === 0 && (
            <div
              style={{
                fontSize: 13,
                letterSpacing: 2,
                lineHeight: 1.8,
                marginBottom: 18,
              }}
            >
              <div>{">"} USER HAS NO ENTRY TOKENS</div>
            </div>
          )}

          {showEntrySection && tickets.length > 0 && (
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                lineHeight: 1.8,
                marginBottom: 18,
              }}
            >
              <div>{">"} TOKENS REGISTERED TO USER</div>
              <div>{">"} PRESENT TOKEN AT ENTRY CHECKPOINT</div>
            </div>
          )}

          {showEntrySection && !loadingTickets && tickets.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 16,
                marginBottom: 22,
              }}
            >
              {tickets.map((ticket, index) => {
                const isVip = ticket.is_vip || ticket.vip;
                const isUsed = !!ticket.claimed;

                return (
                  <div
                    key={ticket.id || index}
                    style={{
                      border: "1px solid #555",
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                        fontSize: 11,
                        letterSpacing: 2,
                      }}
                    >
                      <span>{isVip ? "VIP" : "GA"}</span>
                      <span style={{ color: isUsed ? "#888" : "#fff" }}>
                        {isUsed ? "USED" : "ACTIVE"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <QRCodeSVG
                        value={`${qrBase}/checkin?code=${ticket.code}`}
                        size={180}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 11,
                        letterSpacing: 2,
                        color: "#b8b8b8",
                      }}
                    >
                      TOKEN CODE
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        letterSpacing: 2,
                        marginTop: 6,
                      }}
                    >
                      {ticket.code}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showButtons && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 16,
              }}
            >
              <button
                className="cta-button"
                style={{
                  width: "100%",
                  minHeight: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  lineHeight: 1.08,
                  padding: "14px 18px",
                  fontSize: 13,
                  letterSpacing: 3.6,
                  whiteSpace: "nowrap",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
                onClick={() => setPurchaseOpen(true)}
              >
                GENERATE TOKENS
              </button>

              <button
                className="cta-button"
                style={{
                  width: "100%",
                  minHeight: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  lineHeight: 1.08,
                  padding: "14px 18px",
                  fontSize: 13,
                  letterSpacing: 3.6,
                  whiteSpace: "nowrap",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
                onClick={() => setVipOpen(true)}
              >
                GENERATE VIP TOKENS
              </button>
            </div>
          )}
        </div>
      )}

      {purchaseOpen && (
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

            <div className="signup-title signup-title-large">
              Generate Tokens
            </div>

            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                lineHeight: 1.72,
                marginBottom: 18,
              }}
            >
              <div>{">"} CURRENT TIER: TIER {tier} ACTIVE</div>
              <div>{">"} TOKEN GENERATION CHANNEL OPEN</div>
            </div>

            <div
              style={{
                fontSize: 12,
                letterSpacing: 3,
                marginBottom: 10,
              }}
            >
              QUANTITY
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={decGa}
              >
                ▼
              </button>

              <div style={modalQuantityBoxStyle}>{gaQuantity}</div>

              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={incGa}
              >
                ▲
              </button>
            </div>

            {checkoutMessage && (
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                {checkoutMessage}
              </div>
            )}

            <button
              className="cta-button"
              style={{
                width: "82%",
                alignSelf: "center",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 54,
                lineHeight: 1.02,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3.6,
                whiteSpace: "nowrap",
                fontFamily: "Arial, Helvetica, sans-serif",
                textTransform: "uppercase",
              }}
              onClick={generateTokens}
            >
              GENERATE
            </button>

            <button
              className="signup-close"
              onClick={() => {
                setCheckoutMessage("");
                setPurchaseOpen(false);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {vipOpen && (
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

            <div className="signup-title signup-title-large">
              Generate VIP Tokens
            </div>

            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                lineHeight: 1.72,
                marginBottom: 18,
              }}
            >
              <div>{">"} VIP CHANNEL ACTIVE</div>
              <div>
                {">"} REMAINING VIP ALLOCATION: {Math.max(0, 150 - vipSold)}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                letterSpacing: 3,
                marginBottom: 10,
              }}
            >
              QUANTITY
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={decVip}
              >
                ▼
              </button>

              <div style={modalQuantityBoxStyle}>{vipQuantity}</div>

              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={incVip}
              >
                ▲
              </button>
            </div>

            {checkoutMessage && (
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                {checkoutMessage}
              </div>
            )}

            <button
              className="cta-button"
              style={{
                width: "82%",
                alignSelf: "center",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 54,
                lineHeight: 1.02,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3.6,
                whiteSpace: "nowrap",
                fontFamily: "Arial, Helvetica, sans-serif",
                textTransform: "uppercase",
              }}
              onClick={generateVipTokens}
            >
              GENERATE
            </button>

            <button
              className="signup-close"
              onClick={() => {
                setCheckoutMessage("");
                setVipOpen(false);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </main>
  );
}