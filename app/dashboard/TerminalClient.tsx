"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import EmbeddedCheckoutModal from "../components/EmbeddedCheckoutModal";
import { QRCodeSVG } from "qrcode.react";

type Ticket = {
  id?: string;
  code: string;
  vip?: boolean;
  is_vip?: boolean;
  claimed?: boolean;
  claimed_at?: string | null;
  created_at?: string;
  can_send?: boolean;
  can_cancel?: boolean;
  pending_transfer_id?: string | null;
  pending_recipient_phone?: string | null;
  pending_status?: string | null;
};

export default function TerminalClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"ga" | "vip">("ga");

  const [gaQuantity, setGaQuantity] = useState(1);
  const [vipQuantity, setVipQuantity] = useState(1);

  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1400);

  const [gaPromoCode, setGaPromoCode] = useState("");
  const [gaPromoValid, setGaPromoValid] = useState<boolean | null>(null);
  const [vipPromoCode, setVipPromoCode] = useState("");
  const [vipPromoValid, setVipPromoValid] = useState<boolean | null>(null);

  const [sendPhones, setSendPhones] = useState<Record<string, string>>({});
  const [sendMessages, setSendMessages] = useState<Record<string, string>>({});
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);
  const [cancellingTicketId, setCancellingTicketId] = useState<string | null>(null);
  const [sendModalTicket, setSendModalTicket] = useState<Ticket | null>(null);

  const timeoutIdsRef = useRef<number[]>([]);
  const gaPromoTimer = useRef<number | null>(null);
  const vipPromoTimer = useRef<number | null>(null);

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
  const isCompactDesktop = !isMobile && viewportWidth >= 1180 && viewportWidth <= 1550;

  const isDesktopEmptyWallet =
    !isMobile && showEntrySection && !loadingTickets && tickets.length === 0;

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

    // Unified to desktop pacing on both desktop and mobile
    const lineDelay = 450;

    bootScript.forEach((line, index) => {
      const id = window.setTimeout(() => {
        setTerminalLines((prev) => [...prev, line]);
      }, index * lineDelay);
      timeoutIdsRef.current.push(id);
    });

    const bootDoneTime = bootScript.length * lineDelay;

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        if (!isMobile) setShowTierPanel(true);
      }, bootDoneTime + 220)
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setShowEntrySection(true);
      }, bootDoneTime + 560)
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setShowButtons(true);
      }, bootDoneTime + 900)
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

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    fetch(`/api/session-status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "complete" || data.payment_status === "paid") {
          setCheckoutMessage("PAYMENT RECEIVED. TOKEN GENERATING...");
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    const hasPending = tickets.some((t) => !!t.can_cancel);
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/tickets");
        const data = await res.json();
        const newPendingCount = (data ?? []).filter((t: Ticket) => !!t.can_cancel).length;
        const currentPendingCount = tickets.filter((t) => !!t.can_cancel).length;
        if (newPendingCount !== currentPendingCount) {
          window.location.reload();
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [tickets]);

  function tierColor(targetTier: number) {
    return tier === targetTier ? "#ffffff" : "#555555";
  }

  function tierProgressPercent() {
    return Math.max(0, Math.min(100, (sold / 1000) * 100));
  }

  function vipProgressPercent() {
    return Math.max(0, Math.min(100, (vipSold / 50) * 100));
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
    const remaining = Math.max(0, 50 - vipSold);
    const maxAllowed = Math.max(1, Math.min(10, remaining));
    setVipQuantity((prev) => Math.min(maxAllowed, prev + 1));
  }

  function handleGaPromoChange(value: string) {
    setGaPromoCode(value);
    setGaPromoValid(null);
    if (gaPromoTimer.current) clearTimeout(gaPromoTimer.current);
    if (!value.trim()) return;
    gaPromoTimer.current = window.setTimeout(async () => {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      setGaPromoValid(data.valid);
    }, 600);
  }

  function handleVipPromoChange(value: string) {
    setVipPromoCode(value);
    setVipPromoValid(null);
    if (vipPromoTimer.current) clearTimeout(vipPromoTimer.current);
    if (!value.trim()) return;
    vipPromoTimer.current = window.setTimeout(async () => {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      setVipPromoValid(data.valid);
    }, 600);
  }

  function generateTokens() {
    if (gaPromoCode.trim() && gaPromoValid !== true) {
      setGaPromoValid(false);
      return;
    }
    setCheckoutMessage("");
    setCheckoutType("ga");
    const pricePerToken = tier === 1 ? 2778 : tier === 2 ? 3889 : 5000;
    const base = pricePerToken * gaQuantity;
    setCheckoutAmount(gaPromoValid ? Math.round(base * 0.9) : base);
    setCheckoutOpen(true);
    setPurchaseOpen(false);
  }

  function generateVipTokens() {
    if (vipPromoCode.trim() && vipPromoValid !== true) {
      setVipPromoValid(false);
      return;
    }
    setCheckoutMessage("");
    setCheckoutType("vip");
    const base = 6667 * vipQuantity;
    setCheckoutAmount(vipPromoValid ? Math.round(base * 0.9) : base);
    setCheckoutOpen(true);
    setVipOpen(false);
  }

  function setSendPhone(ticketId: string, value: string) {
    setSendPhones((prev) => ({
      ...prev,
      [ticketId]: value,
    }));
  }

  function openSendModal(ticket: Ticket) {
    if (!ticket.id) return;
    setSendMessages((prev) => ({
      ...prev,
      [ticket.id!]: "",
    }));
    setSendModalTicket(ticket);
  }

  function closeSendModal() {
    setSendModalTicket(null);
  }

  async function sendToken(ticketId: string) {
    const phone = (sendPhones[ticketId] || "").trim();

    if (!phone) {
      setSendMessages((prev) => ({
        ...prev,
        [ticketId]: "Enter a phone number.",
      }));
      return;
    }

    setSendingTicketId(ticketId);
    setSendMessages((prev) => ({
      ...prev,
      [ticketId]: "",
    }));

    try {
      const res = await fetch("/api/send-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSendMessages((prev) => ({
          ...prev,
          [ticketId]: data.error || "Send failed.",
        }));
        return;
      }

      setSendPhones((prev) => ({
        ...prev,
        [ticketId]: "",
      }));

      await loadTickets();
      setSendModalTicket(null);
    } catch (err) {
      console.error("Send token failed", err);
      setSendMessages((prev) => ({
        ...prev,
        [ticketId]: "Send failed.",
      }));
    } finally {
      setSendingTicketId(null);
    }
  }

  async function cancelSend(ticketId: string) {
    setCancellingTicketId(ticketId);

    try {
      const res = await fetch("/api/send-token/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSendMessages((prev) => ({
          ...prev,
          [ticketId]: data.error || "Cancel failed.",
        }));
        return;
      }

      await loadTickets();
    } catch (err) {
      console.error("Cancel transfer failed", err);
      setSendMessages((prev) => ({
        ...prev,
        [ticketId]: "Cancel failed.",
      }));
    } finally {
      setCancellingTicketId(null);
    }
  }

  const qrBase =
    process.env.NEXT_PUBLIC_QR_BASE_URL || window.location.origin;

  const desktopOuterWidth = isCompactDesktop ? 1032 : undefined;
  const desktopLeftWidth = isCompactDesktop ? 520 : 460;
  const desktopGap = isCompactDesktop ? 92 : 80;
  const desktopRightWidth = isCompactDesktop ? 420 : 360;

  const desktopMainStyle: React.CSSProperties = isMobile
    ? {
        marginTop: 26,
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 60,
      }
    : isCompactDesktop
      ? {
          marginTop: 72,
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: 60,
          width: desktopOuterWidth,
          maxWidth: "calc(100vw - 80px)",
        }
      : {
          marginTop: 72,
          marginLeft: 120,
          marginRight: 40,
          marginBottom: 60,
        };

  const desktopTitleSize = isCompactDesktop ? 34 : 30;
  const desktopEntryTitleSize = isCompactDesktop ? 30 : 26;
  const desktopBoxPadding = isCompactDesktop ? 22 : 20;
  const desktopBoxFont = isCompactDesktop ? 14 : 13;
  const desktopBoxMinHeight = isCompactDesktop ? 194 : 178;
  const desktopProgressWidth = isCompactDesktop ? 336 : 300;
  const desktopProgressHeight = isCompactDesktop ? 13 : 12;
  const desktopSmallLabel = isCompactDesktop ? 13 : 12;
  const desktopCardPadding = isCompactDesktop ? 18 : 16;
  const desktopCardMetaFont = isCompactDesktop ? 12 : 11;
  const desktopCardCodeFont = isCompactDesktop ? 17 : 16;
  const desktopQrSize = isCompactDesktop ? 128 : 120;
  const desktopButtonHeight = isCompactDesktop ? 64 : 60;
  const desktopButtonFont = isCompactDesktop ? 15 : 14;
  const desktopButtonSpacing = isCompactDesktop ? 3.5 : 3.2;
  const desktopEntryGridMaxWidth = isCompactDesktop ? 456 : 420;
  const desktopEntryMinCard = isCompactDesktop ? 195 : 180;

  const desktopGenerateModalStyle: React.CSSProperties = {};
  const desktopSendModalStyle: React.CSSProperties = {
    width: 388,
    maxWidth: "92vw",
  };

  const actionButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: isMobile ? 60 : desktopButtonHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    lineHeight: 1.02,
    padding: "14px 20px",
    fontSize: isMobile ? 14 : desktopButtonFont,
    letterSpacing: isMobile ? 3.2 : desktopButtonSpacing,
    whiteSpace: "nowrap",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 700,
    textTransform: "uppercase",
  };

  const modalArrowButtonStyle: React.CSSProperties = {
    width: isMobile ? 40 : 28,
    height: isMobile ? 40 : 28,
    minHeight: isMobile ? 40 : 28,
    padding: 0,
    fontSize: isMobile ? 14 : 10,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "none",
    textIndent: 0,
    border: "1px solid white",
    background: "black",
    color: "white",
    boxShadow: "none",
    appearance: "none",
    WebkitAppearance: "none",
    borderRadius: 0,
    flexShrink: 0,
  };

  const modalQuantityBoxStyle: React.CSSProperties = {
    width: isMobile ? 86 : 72,
    height: isMobile ? 40 : 28,
    borderTop: "1px solid white",
    borderBottom: "1px solid white",
    borderLeft: "none",
    borderRight: "none",
    background: "black",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? 16 : 13,
    letterSpacing: 2,
    boxShadow: "none",
    flexShrink: 0,
  };

  const sendInputStyle: React.CSSProperties = {
    width: "100%",
    background: "black",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "white",
    padding: isMobile ? "14px 14px" : "12px 14px",
    fontFamily: '"Courier New", monospace',
    fontSize: isMobile ? 15 : 14,
    letterSpacing: 1.2,
    outline: "none",
  };

  const sendButtonStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 54,
    border: "1px solid white",
    background: "black",
    color: "white",
    padding: "12px 16px",
    fontSize: isMobile ? 13 : 16,
    fontWeight: 700,
    letterSpacing: isMobile ? 3.2 : 4.2,
    lineHeight: 1,
    textAlign: "center",
    cursor: "pointer",
    fontFamily: "Arial, Helvetica, sans-serif",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  const sendTriggerStyle: React.CSSProperties = {
    width: "100%",
    minHeight: isMobile ? 38 : 36,
    border: "1px solid white",
    background: "black",
    color: "white",
    padding: isMobile ? "9px 10px" : "8px 10px",
    fontSize: isMobile ? 11 : 11,
    fontWeight: 700,
    letterSpacing: isMobile ? 2.1 : 2,
    lineHeight: 1,
    textAlign: "center",
    cursor: "pointer",
    fontFamily: "Arial, Helvetica, sans-serif",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    marginTop: 12,
  };

  const cancelTriggerStyle: React.CSSProperties = {
    ...sendTriggerStyle,
    marginTop: 12,
  };

  const pendingInfoStyle: React.CSSProperties = {
    marginTop: 10,
    fontSize: isMobile ? 9 : 9,
    letterSpacing: 1.5,
    lineHeight: 1.5,
    color: "#c8c8c8",
  };

  const mobileModalInnerStyle: React.CSSProperties = isMobile
    ? {
        width: "84%",
        maxWidth: 292,
        alignSelf: "center",
      }
    : {};

  const mobileGenerateModalStyle: React.CSSProperties = isMobile
    ? {
        width: "calc(100vw - 32px)",
        maxWidth: 370,
        minHeight: "auto",
        paddingTop: 0,
        paddingBottom: 18,
      }
    : desktopGenerateModalStyle;

  const mobileSendModalStyle: React.CSSProperties = isMobile
    ? {
        width: "calc(100vw - 32px)",
        maxWidth: 370,
        minHeight: "auto",
        paddingTop: 0,
        paddingBottom: 18,
      }
    : desktopSendModalStyle;

  const generateHeaderStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        paddingTop: 18,
        paddingBottom: 14,
        marginBottom: 18,
      }
    : {};

  const generateTitleStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        textAlign: "center",
        fontSize: 19,
        letterSpacing: 2.8,
        marginBottom: 12,
      }
    : {};

  const generateStatusCopyStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        marginBottom: 22,
        fontSize: 11,
        lineHeight: 1.42,
      }
    : {};

  const generateQuantityLabelStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        marginBottom: 14,
        fontSize: 12,
        letterSpacing: 2.4,
      }
    : {};

  const generateQuantityRowStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        display: "flex",
        justifyContent: "center",
        marginBottom: 16,
      }
    : {};

  const generateButtonWrapStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        paddingTop: 14,
        marginTop: 0,
      }
    : {
        paddingTop: 14,
        marginTop: 0,
      };

  const generateButtonStyle: React.CSSProperties = isMobile
    ? {
        minHeight: 52,
        fontSize: 12,
        letterSpacing: 3.2,
      }
    : {};

  const generateCancelStyle: React.CSSProperties = isMobile
    ? {
        alignSelf: "center",
        marginTop: 10,
        fontSize: 11,
        letterSpacing: 2.8,
      }
    : {};

  const sendHeaderStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        paddingTop: 18,
        paddingBottom: 14,
        marginBottom: 18,
      }
    : {
        marginBottom: 14,
      };

  const sendTitleStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        textAlign: "center",
        fontSize: 19,
        letterSpacing: 2.8,
        marginBottom: 12,
      }
    : {
        marginBottom: 12,
      };

  const sendStatusCopyStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        marginBottom: 22,
        fontSize: 11,
        lineHeight: 1.42,
      }
    : {
        marginBottom: 12,
      };

  const sendButtonWrapStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        paddingTop: 10,
      }
    : {
        paddingTop: 10,
      };

  const sendCancelStyle: React.CSSProperties = isMobile
    ? {
        alignSelf: "center",
        marginTop: 10,
        fontSize: 11,
        letterSpacing: 2.8,
      }
    : {
        marginTop: 10,
      };

  const mobileTierVisualWrapStyle: React.CSSProperties = isMobile
    ? {
        ...mobileModalInnerStyle,
        marginBottom: 30,
      }
    : {};

  const mobileTierLabelStyle: React.CSSProperties = isMobile
    ? {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 8,
      }
    : {};

  const mobileTierTrackStyle: React.CSSProperties = isMobile
    ? {
        position: "relative",
        width: "100%",
        height: 10,
        background: "#222",
      }
    : {};

  const mobileVipTrackStyle: React.CSSProperties = isMobile
    ? {
        position: "relative",
        width: "100%",
        height: 10,
        background: "#222",
      }
    : {};

  const mobileEntryCardGridStyle: React.CSSProperties = isMobile
    ? {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 18,
        alignItems: "start",
      }
    : {
        display: "grid",
        gridTemplateColumns: `repeat(2, minmax(${desktopEntryMinCard}px, 1fr))`,
        gap: isCompactDesktop ? 20 : 18,
        maxWidth: desktopEntryGridMaxWidth,
        marginBottom: 22,
        alignItems: "start",
      };

  const mobileEntryCardStyle: React.CSSProperties = isMobile
    ? {
        border: "1px solid #555",
        padding: 10,
        width: "100%",
        maxWidth: 182,
        justifySelf: "center",
        alignSelf: "start",
      }
    : {
        border: "1px solid #555",
        padding: desktopCardPadding,
        alignSelf: "start",
      };

  const mobileSendTokenCardStyle: React.CSSProperties = isMobile
    ? {
        width: 160,
        maxWidth: "100%",
        alignSelf: "center",
        border: "1px solid #555",
        padding: 10,
        marginBottom: 10,
      }
    : {
        border: "1px solid #555",
        padding: 12,
        width: 160,
        alignSelf: "center",
        marginBottom: 10,
      };

  return (
    <main style={desktopMainStyle}>
      {!isMobile ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${desktopLeftWidth}px ${desktopRightWidth}px`,
            gap: desktopGap,
            alignItems: "start",
            width: isCompactDesktop ? desktopOuterWidth : undefined,
            maxWidth: "100%",
          }}
        >
          <div>
            <div
              style={{
                fontSize: desktopTitleSize,
                letterSpacing: 6,
                marginBottom: 24,
              }}
            >
              Terminal
            </div>

            <div
              style={{
                border: "1px solid #888",
                padding: desktopBoxPadding,
                width: desktopLeftWidth,
                fontSize: desktopBoxFont,
                letterSpacing: 1.4,
                lineHeight: 1.7,
                minHeight: desktopBoxMinHeight,
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
                  padding: desktopBoxPadding,
                  width: desktopLeftWidth,
                }}
              >
                <div
                  style={{
                    fontSize: desktopSmallLabel,
                    marginBottom: 12,
                    letterSpacing: 2,
                  }}
                >
                  TOKENS
                </div>

                <div
                  style={{
                    width: desktopProgressWidth,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    fontSize: desktopSmallLabel,
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
                    width: desktopProgressWidth,
                    height: desktopProgressHeight,
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
                      left: "66.6667%",
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
                    fontSize: desktopSmallLabel,
                    marginBottom: 8,
                    letterSpacing: 2,
                  }}
                >
                  VIP TOKENS
                </div>

                <div
                  style={{
                    position: "relative",
                    width: desktopProgressWidth,
                    height: desktopProgressHeight,
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
                fontSize: desktopEntryTitleSize,
                letterSpacing: 6,
                marginBottom: 16,
              }}
            >
              Entry Tokens
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: isDesktopEmptyWallet ? (isCompactDesktop ? 210 : 190) : undefined,
              }}
            >
              {!showEntrySection && (
                <div
                  style={{
                    fontSize: isCompactDesktop ? 15 : 14,
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
                    fontSize: isCompactDesktop ? 15 : 14,
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
                    fontSize: isCompactDesktop ? 13 : 12,
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
                <div style={mobileEntryCardGridStyle}>
                  {tickets.map((ticket, index) => {
                    const isVip = ticket.is_vip || ticket.vip;
                    const isUsed = !!ticket.claimed;
                    const isPending = !!ticket.can_cancel;

                    return (
                      <div
                        key={ticket.id || index}
                        style={mobileEntryCardStyle}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                            fontSize: desktopCardMetaFont,
                            letterSpacing: 2,
                          }}
                        >
                          <span>{isVip ? "VIP" : "GA"}</span>
                          <span style={{ color: isUsed ? "#888" : "#fff" }}>
                            {isUsed ? "USED" : isPending ? "PENDING" : "ACTIVE"}
                          </span>
                        </div>

                        <QRCodeSVG
                          value={`${qrBase}/checkin?code=${ticket.code}`}
                          size={desktopQrSize}
                        />

                        <div
                          style={{
                            marginTop: 10,
                            fontSize: desktopCardMetaFont,
                            letterSpacing: 2,
                            color: "#b8b8b8",
                          }}
                        >
                          TOKEN CODE
                        </div>

                        <div
                          style={{
                            fontSize: desktopCardCodeFont,
                            letterSpacing: 2,
                            marginTop: 4,
                            wordBreak: "break-word",
                          }}
                        >
                          {ticket.code}
                        </div>

                        {isPending && ticket.pending_recipient_phone && (
                          <div style={pendingInfoStyle}>
                            {ticket.pending_recipient_phone}
                          </div>
                        )}

                        {ticket.can_send && !isUsed && ticket.id && (
                          <button
                            style={sendTriggerStyle}
                            onClick={() => openSendModal(ticket)}
                          >
                            SEND TOKEN
                          </button>
                        )}

                        {ticket.can_cancel && !isUsed && ticket.id && (
                          <button
                            style={cancelTriggerStyle}
                            onClick={() => cancelSend(ticket.id!)}
                            disabled={cancellingTicketId === ticket.id}
                          >
                            {cancellingTicketId === ticket.id ? "CANCELLING..." : "CANCEL SEND"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {showButtons && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${desktopRightWidth}px`,
                    gap: 18,
                    maxWidth: desktopRightWidth,
                    marginTop: isDesktopEmptyWallet ? "auto" : 0,
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
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              marginBottom: 16,
            }}
          >
            Terminal
          </div>

          <div
            style={{
              border: "1px solid #888",
              padding: 14,
              fontSize: 11,
              letterSpacing: 1.15,
              lineHeight: 1.62,
              marginBottom: 18,
              minHeight: 146,
            }}
          >
            {terminalLines.map((line, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : 8 }}>
                {line}
              </div>
            ))}

            {!showEntrySection && (
              <div style={{ marginTop: 10 }}>
                <span className="cursor">_</span>
              </div>
            )}
          </div>

          {showEntrySection && (
            <>
              <div
                style={{
                  fontSize: 20,
                  letterSpacing: 3.2,
                  marginBottom: 10,
                }}
              >
                Entry Tokens
              </div>

              {tickets.length > 0 ? (
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    lineHeight: 1.7,
                    marginBottom: 12,
                  }}
                >
                  <div>{">"} TOKENS REGISTERED TO USER</div>
                  <div>{">"} PRESENT TOKEN AT ENTRY CHECKPOINT</div>
                </div>
              ) : !loadingTickets ? (
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    lineHeight: 1.7,
                    marginBottom: 12,
                  }}
                >
                  <div>{">"} USER HAS NO ENTRY TOKENS</div>
                </div>
              ) : null}

              {!loadingTickets && tickets.length > 0 && (
                <div style={mobileEntryCardGridStyle}>
                  {tickets.map((ticket, index) => {
                    const isVip = ticket.is_vip || ticket.vip;
                    const isUsed = !!ticket.claimed;
                    const isPending = !!ticket.can_cancel;

                    return (
                      <div
                        key={ticket.id || index}
                        style={mobileEntryCardStyle}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                            fontSize: 10,
                            letterSpacing: 1.8,
                          }}
                        >
                          <span>{isVip ? "VIP" : "GA"}</span>
                          <span style={{ color: isUsed ? "#888" : "#fff" }}>
                            {isUsed ? "USED" : isPending ? "PENDING" : "ACTIVE"}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <QRCodeSVG
                            value={`${qrBase}/checkin?code=${ticket.code}`}
                            size={110}
                          />
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 9,
                            letterSpacing: 1.8,
                            color: "#b8b8b8",
                          }}
                        >
                          TOKEN CODE
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            letterSpacing: 1.6,
                            marginTop: 4,
                            wordBreak: "break-word",
                          }}
                        >
                          {ticket.code}
                        </div>

                        {isPending && ticket.pending_recipient_phone && (
                          <div style={pendingInfoStyle}>
                            {ticket.pending_recipient_phone}
                          </div>
                        )}

                        {ticket.can_send && !isUsed && ticket.id && (
                          <button
                            style={sendTriggerStyle}
                            onClick={() => openSendModal(ticket)}
                          >
                            SEND TOKEN
                          </button>
                        )}

                        {ticket.can_cancel && !isUsed && ticket.id && (
                          <button
                            style={cancelTriggerStyle}
                            onClick={() => cancelSend(ticket.id!)}
                            disabled={cancellingTicketId === ticket.id}
                          >
                            {cancellingTicketId === ticket.id ? "CANCELLING..." : "CANCEL SEND"}
                          </button>
                        )}
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
                    gap: 14,
                  }}
                >
                  <button
                    className="cta-button"
                    style={{
                      width: "100%",
                      minHeight: 58,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      lineHeight: 1.08,
                      padding: "12px 16px",
                      fontSize: 13,
                      letterSpacing: 3,
                      whiteSpace: "nowrap",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontWeight: 700,
                    }}
                    onClick={() => setPurchaseOpen(true)}
                  >
                    GENERATE TOKENS
                  </button>

                  <button
                    className="cta-button"
                    style={{
                      width: "100%",
                      minHeight: 58,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      lineHeight: 1.08,
                      padding: "12px 16px",
                      fontSize: 13,
                      letterSpacing: 3,
                      whiteSpace: "nowrap",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontWeight: 700,
                    }}
                    onClick={() => setVipOpen(true)}
                  >
                    GENERATE VIP TOKENS
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {purchaseOpen && (
        <div className="signup-overlay">
          <div
            className={`signup-modal ${isMobile ? "" : "signup-modal-ticket"}`}
            style={{
              ...mobileGenerateModalStyle,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="signup-header signup-header-home" style={generateHeaderStyle}>
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div
              className="signup-title signup-title-large"
              style={generateTitleStyle}
            >
              Generate Tokens
            </div>

            <div className="modal-status-copy" style={generateStatusCopyStyle}>
              <div className="modal-status-line">
                <span className="modal-status-symbol">{">"}</span>
                <span className="modal-status-text">
                  {`TIER ${tier} ACTIVE — ${tier === 1 ? "$27.78" : tier === 2 ? "$38.89" : "$50.00"}`}
                </span>
              </div>
            </div>

            {isMobile && (
              <div style={mobileTierVisualWrapStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    textAlign: "center",
                    ...mobileTierLabelStyle,
                  }}
                >
                  <div style={{ color: tierColor(1) }}>TIER 1</div>
                  <div style={{ color: tierColor(2) }}>TIER 2</div>
                  <div style={{ color: tierColor(3) }}>TIER 3</div>
                </div>

                <div style={mobileTierTrackStyle}>
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
                      left: "66.6667%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "#888",
                      transform: "translateX(-0.5px)",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="modal-quantity-label" style={generateQuantityLabelStyle}>
              QUANTITY
            </div>

            <div className="modal-quantity-row" style={generateQuantityRowStyle}>
              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={decGa}
              >
                <span className="modal-arrow-glyph modal-arrow-glyph-down">▼</span>
              </button>

              <div style={modalQuantityBoxStyle}>{gaQuantity}</div>

              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={incGa}
              >
                <span className="modal-arrow-glyph modal-arrow-glyph-up">▲</span>
              </button>
            </div>

            <div style={{
              ...(isMobile ? mobileModalInnerStyle : {}),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: isMobile ? 22 : 30,
              marginBottom: isMobile ? 22 : 30,
            }}>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  value={gaPromoCode}
                  onChange={(e) => handleGaPromoChange(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE (OPTIONAL)"
                  style={{
                    ...sendInputStyle,
                    paddingRight: 36,
                    fontSize: isMobile ? 13 : 12,
                    letterSpacing: 2,
                    width: "100%",
                  }}
                />
                {gaPromoValid === true && (
                  <span style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#ffffff",
                    fontSize: 14,
                  }}>✓</span>
                )}
              </div>
              <div style={{
                minHeight: isMobile ? 18 : 16,
                marginTop: 8,
                fontSize: 10,
                letterSpacing: 1.2,
                color: "#c8c8c8",
                textAlign: "center",
                width: "100%",
              }}>
                {gaPromoValid === false && gaPromoCode.trim() ? "INVALID PROMO CODE." : ""}
              </div>
            </div>

            {checkoutMessage && (
              <div className="modal-checkout-message">{checkoutMessage}</div>
            )}

            <div
              className="signup-generate-button-wrap"
              style={generateButtonWrapStyle}
            >
              <button
                className="cta-button"
                style={{
                  width: isMobile ? "100%" : 300,
                  maxWidth: "100%",
                  minHeight: 54,
                  lineHeight: 1.02,
                  color: "white",
                  fontSize: isMobile ? 13 : 17,
                  fontWeight: 700,
                  letterSpacing: isMobile ? 3.4 : 4.8,
                  whiteSpace: "nowrap",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  textTransform: "uppercase",
                  ...generateButtonStyle,
                }}
                onClick={generateTokens}
              >
                GENERATE
              </button>
            </div>

            <button
              className="signup-close"
              style={generateCancelStyle}
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
          <div
            className={`signup-modal ${isMobile ? "" : "signup-modal-ticket"}`}
            style={{
              ...mobileGenerateModalStyle,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="signup-header signup-header-home" style={generateHeaderStyle}>
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div
              className="signup-title signup-title-large"
              style={generateTitleStyle}
            >
              Generate VIP Tokens
            </div>

            <div className="modal-status-copy" style={generateStatusCopyStyle}>
              <div className="modal-status-line">
                <span className="modal-status-symbol">{">"}</span>
                <span className="modal-status-text">VIP CHANNEL ACTIVE — $66.67</span>
              </div>
              <div className="modal-status-line">
                <span className="modal-status-symbol">{">"}</span>
                <span className="modal-status-text">
                  REMAINING VIP ALLOCATION: {Math.max(0, 50 - vipSold)}
                </span>
              </div>
            </div>

            {isMobile && (
              <div style={mobileTierVisualWrapStyle}>
                <div style={mobileTierLabelStyle}>VIP ALLOCATION</div>
                <div style={mobileVipTrackStyle}>
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

            <div className="modal-quantity-label" style={generateQuantityLabelStyle}>
              QUANTITY
            </div>

            <div className="modal-quantity-row" style={generateQuantityRowStyle}>
              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={decVip}
              >
                <span className="modal-arrow-glyph modal-arrow-glyph-down">▼</span>
              </button>

              <div style={modalQuantityBoxStyle}>{vipQuantity}</div>

              <button
                className="cta-button"
                style={modalArrowButtonStyle}
                onClick={incVip}
              >
                <span className="modal-arrow-glyph modal-arrow-glyph-up">▲</span>
              </button>
            </div>

            <div style={{
              ...(isMobile ? mobileModalInnerStyle : {}),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: isMobile ? 22 : 30,
              marginBottom: isMobile ? 22 : 30,
            }}>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  value={vipPromoCode}
                  onChange={(e) => handleVipPromoChange(e.target.value.toUpperCase())}
                  placeholder="PROMO CODE (OPTIONAL)"
                  style={{
                    ...sendInputStyle,
                    paddingRight: 36,
                    fontSize: isMobile ? 13 : 12,
                    letterSpacing: 2,
                    width: "100%",
                  }}
                />
                {vipPromoValid === true && (
                  <span style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#ffffff",
                    fontSize: 14,
                  }}>✓</span>
                )}
              </div>
              <div style={{
                minHeight: isMobile ? 18 : 16,
                marginTop: 8,
                fontSize: 10,
                letterSpacing: 1.2,
                color: "#c8c8c8",
                textAlign: "center",
                width: "100%",
              }}>
                {vipPromoValid === false && vipPromoCode.trim() ? "INVALID PROMO CODE." : ""}
              </div>
            </div>

            {checkoutMessage && (
              <div className="modal-checkout-message">{checkoutMessage}</div>
            )}

            <div
              className="signup-generate-button-wrap"
              style={generateButtonWrapStyle}
            >
              <button
                className="cta-button"
                style={{
                  width: isMobile ? "100%" : 300,
                  maxWidth: "100%",
                  minHeight: 54,
                  lineHeight: 1.02,
                  color: "white",
                  fontSize: isMobile ? 13 : 17,
                  fontWeight: 700,
                  letterSpacing: isMobile ? 3.4 : 4.8,
                  whiteSpace: "nowrap",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  textTransform: "uppercase",
                  ...generateButtonStyle,
                }}
                onClick={generateVipTokens}
              >
                GENERATE
              </button>
            </div>

            <button
              className="signup-close"
              style={generateCancelStyle}
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

      <EmbeddedCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        type={checkoutType}
        quantity={checkoutType === "vip" ? vipQuantity : gaQuantity}
        isMobile={isMobile}
        amount={checkoutAmount}
        promoCode={checkoutType === "vip" ? vipPromoCode : gaPromoCode}
        onSuccess={() => {
          setCheckoutMessage("PAYMENT RECEIVED. TOKEN GENERATING...");
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            try {
              const res = await fetch("/api/tickets");
              const data = await res.json();
              if ((data.tickets?.length ?? 0) > (tickets?.length ?? 0)) {
                clearInterval(poll);
                window.location.reload();
                return;
              }
            } catch {}
            if (attempts >= 20) {
              clearInterval(poll);
              window.location.reload();
            }
          }, 500);
        }}
      />

      {sendModalTicket && sendModalTicket.id && (
        <div className="signup-overlay">
          <div
            className={`signup-modal ${isMobile ? "" : "signup-modal-ticket"} send-token-modal`}
            style={mobileSendModalStyle}
          >
            <div className="signup-header signup-header-home" style={sendHeaderStyle}>
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            <div
              className="signup-title signup-title-large"
              style={sendTitleStyle}
            >
              Send Token
            </div>

            <div
              className="modal-status-copy"
              style={sendStatusCopyStyle}
            >
              <div className="modal-status-line">
                <span className="modal-status-symbol">{">"}</span>
                <span className="modal-status-text">
                  TRANSMIT THIS TOKEN BY ENTERING THE RECIPIENT&apos;S PHONE NUMBER.
                </span>
              </div>
            </div>

            <div style={mobileSendTokenCardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  fontSize: 10,
                  letterSpacing: 1.8,
                }}
              >
                <span>
                  {sendModalTicket.is_vip || sendModalTicket.vip ? "VIP" : "GA"}
                </span>
                <span style={{ color: "#fff" }}>ACTIVE</span>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <QRCodeSVG
                  value={`${qrBase}/checkin?code=${sendModalTicket.code}`}
                  size={isMobile ? 104 : 102}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 9,
                  letterSpacing: 1.8,
                  color: "#b8b8b8",
                }}
              >
                TOKEN CODE
              </div>

              <div
                style={{
                  fontSize: 13,
                  letterSpacing: 1.6,
                  marginTop: 4,
                  wordBreak: "break-word",
                }}
              >
                {sendModalTicket.code}
              </div>
            </div>

            <input
              value={sendPhones[sendModalTicket.id] || ""}
              onChange={(e) => setSendPhone(sendModalTicket.id!, e.target.value)}
              placeholder="RECIPIENT PHONE"
              style={{
                ...sendInputStyle,
                ...mobileModalInnerStyle,
              }}
            />

            <div
              style={{
                ...mobileModalInnerStyle,
                marginTop: 10,
                minHeight: 16,
                fontSize: 10,
                letterSpacing: 1.2,
                lineHeight: 1.2,
                color: "#c8c8c8",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sendMessages[sendModalTicket.id] || " "}
            </div>

            <div
              className="signup-generate-button-wrap"
              style={sendButtonWrapStyle}
            >
              <button
                style={{
                  ...sendButtonStyle,
                  ...(isMobile
                    ? {
                        minHeight: 52,
                        fontSize: 12,
                        letterSpacing: 3,
                      }
                    : {}),
                }}
                onClick={() => sendToken(sendModalTicket.id!)}
                disabled={sendingTicketId === sendModalTicket.id}
              >
                {sendingTicketId === sendModalTicket.id
                  ? "SENDING..."
                  : "SEND TOKEN"}
              </button>
            </div>

            <button
              className="signup-close"
              style={sendCancelStyle}
              onClick={closeSendModal}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </main>
  );
}