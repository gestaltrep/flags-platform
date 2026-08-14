"use client";

import { Fragment, useEffect, useState, type ElementType } from "react";
import HeroGlitch from "./components/HeroGlitch";
import HeroVideo from "./components/HeroVideo";
import SponsorSection from "./components/SponsorSection";
import ParticipationModal from "./components/ParticipationModal";

/** The desktop hero slot at 1x, and how far the seal rides above centre. */
const SLOT_W = 590;
const SLOT_H = 420;
export const HERO_LIFT_DEFAULT = 10;
/** Navbar heights, used to centre the preview hero below them. */
const DESKTOP_NAV_H = 109;
/**
 * Where the seal's visible edge sits inside the video frame, as a fraction of
 * frame width. Measured off the rendered frame at luminance > 40, which is the
 * stable boundary: the fainter outer halo pulses between 0.071 and 0.106 over
 * the loop, while this edge holds 0.168-0.177.
 */
const SEAL_LEFT_FRAC = 0.170;

type ParticipationStep = "closed" | "chooser" | "ga" | "vip" | "table" | "phone-entry" | "otp-verify" | "checkout";

/** Minimal event shape the preview needs. Public homepage passes nothing. */
export type HomeEvent = {
  name: string;
  slug: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  hero_image: string | null;
};

/**
 * `event`, `previewMode` and `previewKey` are preview-only and default to the
 * public homepage's behaviour, so / renders exactly as it did before they
 * existed.
 */
export default function HomeClient({
  isDormant,
  event = null,
  previewMode = false,
  previewKey = "",
  heroScale = 1,
  heroLift = HERO_LIFT_DEFAULT,
  mHeroScale = 1,
}: {
  isDormant: boolean;
  event?: HomeEvent | null;
  previewMode?: boolean;
  previewKey?: string;
  /** Preview-only hero sizing experiment. 1 leaves the shared CSS alone. */
  heroScale?: number;
  /** Preview-only: px the seal rides above vertical centre on its slot. */
  heroLift?: number;
  /** Preview-only mobile seal scale. 1 leaves the mobile hero as-is. */
  mHeroScale?: number;
}) {
  const [participationStep, setParticipationStep] = useState<ParticipationStep>("closed");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState<"phone" | "verify">("phone");

  async function sendVerification() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (!termsChecked) {
      setMessage("Please agree to the Terms & Conditions.");
      return;
    }

    if (!privacyChecked) {
      setMessage("Please agree to the Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();

        if (raw.includes("invalid parameter")) {
          setMessage("SMS is not available right now.");
        } else if (raw.includes("invalid") && raw.includes("phone")) {
          setMessage("This phone number isn't valid.");
        } else {
          setMessage("We couldn't send your code. Please try again.");
        }
        return;
      }

      setStep("verify");
      setMessage("");
    } catch (err) {
      console.error("verification failed", err);
      setMessage("We couldn't send your code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setMessage("");

    if (!code.trim()) {
      setMessage("Please enter the verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code.trim(),
          name: name.trim(),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const raw = String(data?.error || "").toLowerCase();

        if (raw.includes("expired")) {
          setMessage("That code has expired.");
        } else if (raw.includes("incorrect") || raw.includes("invalid")) {
          setMessage("That code is incorrect.");
        } else {
          setMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }

      setOpen(false);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("verification error", err);
      setMessage("We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginCode() {
    setMessage("");
    if (!loginPhone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), name: "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 404 && data?.error) {
          setMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("invalid parameter")) setMessage("SMS is not available right now.");
          else if (raw.includes("invalid") && raw.includes("phone")) setMessage("This phone number isn't valid.");
          else setMessage("We couldn't send your code. Please try again.");
        }
        return;
      }
      setLoginStep("verify");
      setMessage("");
    } catch {
      setMessage("We couldn't send your code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginCode() {
    setMessage("");
    if (!loginCode.trim()) {
      setMessage("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), code: loginCode.trim(), name: "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 404 && data?.error) {
          setMessage(data.error);
        } else {
          const raw = String(data?.error || "").toLowerCase();
          if (raw.includes("expired")) setMessage("That code has expired.");
          else if (raw.includes("incorrect") || raw.includes("invalid")) setMessage("That code is incorrect.");
          else setMessage("We couldn't verify your code. Please try again.");
        }
        return;
      }
      setOpen(false);
      window.location.href = "/dashboard";
    } catch {
      setMessage("We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const messageSlot = (
    <div
      style={{
        minHeight: 20,
        marginTop: 8,
        marginBottom: 14,
        fontSize: 12,
        lineHeight: 1.5,
        color: "#c8c8c8",
        textAlign: "center",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {message ? <span>{message}</span> : null}
    </div>
  );

  const checkboxStyle: React.CSSProperties = {
    WebkitAppearance: "checkbox" as any,
    appearance: "auto" as any,
    accentColor: "#9ca3af",
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
  };

  // Event-facing copy. With no event (the public homepage) every one of these
  // resolves to the exact literal the page has always rendered.
  // Event times are rendered in venue time. Without an explicit timeZone these
  // resolve against the runtime's clock — UTC on the server, the visitor's zone
  // in the browser — which both shifts the printed time and desyncs hydration.
  // The format itself is unchanged.
  const EVENT_TZ = "America/New_York";
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: EVENT_TZ });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: EVENT_TZ });

  const eventLabel = event?.name ?? "RAVE_Initiation.html";
  const eventDate = event ? (event.start_time ? fmtDate(event.start_time) : "Date TBA") : "May 30";
  const eventTimeRange = (start: string, end: string | null) =>
    end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
  const eventTime = event
    ? (event.start_time ? eventTimeRange(event.start_time, event.end_time) : "Time TBA")
    : "4:30 PM – 12 AM";
  const eventLocation = event ? event.location ?? "Location TBA" : "Charlotte County Fair";

  // Preview-only hero sizing. The GRID IS LEFT ALONE — the poster track stays
  // 590 and the info column keeps its 1x x-position. The video is simply drawn
  // larger than its slot and allowed to spill, which is safe because
  // everything outside the seal is floored to page black.
  const heroSized = previewMode && heroScale !== 1;
  const heroW = Math.round(SLOT_W * heroScale);
  const heroH = Math.round(SLOT_H * heroScale);
  // Centred on the old 590 track, then lifted above vertical centre.
  const heroLeft = (SLOT_W - heroW) / 2;
  const heroTop = (SLOT_H - heroH) / 2 - heroLift;
  const heroWrapStyle = heroSized ? { overflow: "visible" as const } : {};

  // Align the seal's left edge with the navbar logo's. The logo is anchored to
  // the viewport (60px in) while the hero sits in a centred grid, so the offset
  // is viewport-dependent and has to be measured rather than hardcoded.
  const [heroLeftPx, setHeroLeftPx] = useState<number | null>(null);
  useEffect(() => {
    if (!heroSized) { setHeroLeftPx(null); return; }
    const calc = () => {
      const logo = document.querySelector(".desktop-navbar .nav-logo");
      const wrap = document.querySelector(".home-poster-wrap");
      if (!logo || !wrap) return;
      const logoX = logo.getBoundingClientRect().left;
      const wrapX = wrap.getBoundingClientRect().left;
      setHeroLeftPx(Math.round(logoX - wrapX - SEAL_LEFT_FRAC * heroW));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [heroSized, heroW]);

  // Mobile: scale the treated root about its centre. transform does not affect
  // flow, so the wrap keeps its height and the layout does not move; the spill
  // is dead ground and body{overflow-x:hidden} clips it without a scrollbar.
  const mSized = previewMode && mHeroScale !== 1;
  const mobileWrapStyle = mSized ? { overflow: "visible" as const } : {};
  const heroRootStyle = heroSized
    ? {
        position: "absolute" as const,
        left: heroLeftPx ?? heroLeft,
        top: heroTop,
        width: heroW,
        // .home-poster-image carries max-width: 100%, which otherwise clamps
        // the width back to the wrap's content box and kills the spill.
        maxWidth: "none" as const,
        height: heroH,
        overflow: "visible" as const,
      }
    : undefined;

  function Poster({ className, media, sized, mobileVisible }: {
    className?: string; media: string; sized?: boolean; mobileVisible?: boolean;
  }) {
    // The mobile hero is otherwise hidden by
    // `.home-mobile-poster-wrap > div:last-child { display: none }`, a rule
    // written to hide the corner label — which preview removes, making the
    // hero itself the last child. Inline display wins over it.
    const rootStyle = sized
      ? heroRootStyle
      : mobileVisible && previewMode
        ? {
            display: "block" as const,
            ...(mSized
              ? {
                  overflow: "visible" as const,
                  transform: `scale(${mHeroScale})`,
                  transformOrigin: "center center",
                }
              : {}),
          }
        : undefined;
    // Preview only. HeroVideo is the sole thing that references the poster or
    // the mp4, so on the public path neither is rendered, preloaded or fetched.
    if (previewMode) {
      // A configured event still keeps its own image and gets no video.
      return event?.hero_image ? (
        <HeroVideo className={className} media={media} rootStyle={rootStyle} posterSrc={event.hero_image} videoSrc={null} />
      ) : (
        <HeroVideo className={className} media={media} rootStyle={rootStyle} />
      );
    }
    // Public dormant path — unchanged.
    return <HeroGlitch className={className} />;
  }

  // Collapses to nothing outside preview — a bare <div> would still emit
  // tags and break the byte-identical dormant page.
  const DesktopCentre: ElementType = previewMode ? "div" : Fragment;
  const desktopCentreProps = previewMode
    ? {
        style: {
          minHeight: `calc(100vh - ${DESKTOP_NAV_H}px)`,
          display: "flex",
          flexDirection: "column" as const,
          justifyContent: "center",
        },
      }
    : {};

  return (
    <>
      {previewMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2000,
            background: "#3d0000",
            borderBottom: "1px solid #ff3333",
            color: "#ff8888",
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            letterSpacing: 3,
            textAlign: "center",
            padding: "6px 12px",
            pointerEvents: "none",
            textTransform: "uppercase",
          }}
        >
          PREVIEW — NOT LIVE
        </div>
      )}

      {/* Preview centres the hero unit — seal plus info column — between the
          navbar and the fold. The flex sits on an inner wrapper, not on
          .home-desktop: an inline display would beat the media query that
          hides it below 900px and leak the desktop layout onto mobile. */}
      <main className="home-desktop" style={previewMode ? { marginTop: 0 } : undefined}>
        <DesktopCentre {...desktopCentreProps}>
        <div className="home-desktop-grid">
          {/* Preview drops the frame and the corner label so the seal floats.
              borderColor rather than border keeps the box metrics identical,
              so the video's size and the grid do not move. */}
          <div
            style={previewMode
              ? { position: "relative", display: "block", borderColor: "transparent", ...heroWrapStyle }
              : { position: "relative", display: "block" }}
            className="home-poster-wrap"
          >
            <Poster className="home-poster-image" media="(min-width: 900px)" sized />
            {!previewMode && (
              <div style={{
                position: "absolute",
                bottom: 3,
                right: 3,
                fontFamily: '"Courier New", monospace',
                fontSize: 13,
                letterSpacing: 1.5,
                color: "#ffffff",
                pointerEvents: "none",
              }}>
                {eventLabel}
              </div>
            )}
            {isDormant && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                transform: "translateY(-50%)",
                pointerEvents: "none",
                zIndex: 10,
              }}>
                <div style={{ height: 1, background: "#888" }} />
                <div style={{ background: "rgba(0,0,0,0.82)", padding: "22px 0", textAlign: "center" }}>
                  <span style={{
                    color: "white",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: 900,
                    fontSize: 36,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}>
                    INITIATION COMPLETE
                  </span>
                </div>
                <div style={{ height: 1, background: "#888" }} />
              </div>
            )}
          </div>

          <div className="home-desktop-info">
            <div className="home-date-desktop">{eventDate}</div>
            <div className="home-time-desktop">{eventTime}</div>
            <div className="home-location-desktop">{eventLocation}</div>

            <button
              className={previewMode ? "cta-button cta-preview" : "cta-button"}
              onClick={() => setParticipationStep("chooser")}
              style={{
                width: 352,
                maxWidth: "100%",
              }}
            >
              REQUEST PARTICIPATION
            </button>

            {/* Log-in sends an SMS code; preview must stay side-effect free. */}
            {!previewMode && (
              <div style={{ textAlign: "center", marginTop: 10, width: 352, maxWidth: "100%" }}>
                <button
                  onClick={() => {
                    setMode("login");
                    setLoginStep("phone");
                    setLoginPhone("");
                    setLoginCode("");
                    setMessage("");
                    setOpen(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    fontFamily: '"Courier New", monospace',
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "none",
                  }}
                >
                  ALREADY REGISTERED?{" "}
                  <span style={{ fontWeight: 900, color: "#cccccc" }}>LOG IN</span>
                </button>
              </div>
            )}
          </div>
        </div>
        </DesktopCentre>
      </main>

      <main className="home-mobile">
        <div className="home-mobile-frame" style={previewMode ? { borderColor: "transparent" } : undefined}>
          <div className="home-mobile-text">
            <div className="home-date-mobile">{eventDate.toUpperCase()}</div>
            <div className="home-time-mobile">{eventTime}</div>
            {/* The extra class is added only on the event-driven render, so the
                dormant markup is untouched. */}
            <div className={event ? "home-location-mobile home-location-mobile-event" : "home-location-mobile"}>
              {eventLocation.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Preview also clears this wrapper's black background — an opaque
            backdrop would defeat the screen blend on mobile. */}
        <div
          className="home-mobile-poster-wrap"
          style={previewMode
            ? { position: "relative", borderColor: "transparent", background: "transparent", ...mobileWrapStyle }
            : { position: "relative" }}
        >
          <Poster className="home-mobile-poster" media="(max-width: 899px)" mobileVisible />
          {isDormant && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              transform: "translateY(-50%)",
              pointerEvents: "none",
              zIndex: 10,
            }}>
              <div style={{ height: 1, background: "#888" }} />
              <div style={{ background: "rgba(0,0,0,0.82)", padding: "18px 0", textAlign: "center", lineHeight: 1 }}>
                <span style={{
                  color: "white",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}>
                  INITIATION COMPLETE
                </span>
              </div>
              <div style={{ height: 1, background: "#888" }} />
            </div>
          )}
          {!previewMode && (
            <div style={{
              position: "absolute",
              bottom: 10,
              right: 6,
              left: "auto",
              fontFamily: '"Courier New", monospace',
              fontSize: 11,
              letterSpacing: 1.5,
              color: "#ffffff",
            }}>
              {eventLabel}
            </div>
          )}
        </div>

        <div className="home-mobile-cta-wrap">
          <button
            className={previewMode ? "cta-button cta-preview" : "cta-button"}
            onClick={() => setParticipationStep("chooser")}
            style={{
              width: "100%",
            }}
          >
            REQUEST PARTICIPATION
          </button>

          {!previewMode && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button
                onClick={() => {
                  setMode("login");
                  setLoginStep("phone");
                  setLoginPhone("");
                  setLoginCode("");
                  setMessage("");
                  setOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontFamily: '"Courier New", monospace',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "none",
                }}
              >
                ALREADY REGISTERED?{" "}
                <span style={{ fontWeight: 900, color: "#cccccc" }}>LOG IN</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <SponsorSection />

      {participationStep !== "closed" && (
        <ParticipationModal
          step={participationStep}
          onClose={() => setParticipationStep("closed")}
          onStepChange={(s) => setParticipationStep(s)}
          isDormant={isDormant}
          previewMode={previewMode}
          previewKey={previewKey}
        />
      )}

      {open && (
        <div className="signup-overlay">
          <div className="signup-modal signup-modal-request">
            <div className="signup-header signup-header-home">
              <img src="/logo.png" className="signup-logo" alt="Signo logo" />
              <img
                src="/group-name.png"
                className="signup-group-name"
                alt="Signo Research Group"
              />
            </div>

            {mode === "register" && step === "form" && (
              <>
                <div className="signup-title signup-title-large">
                  Participant Registration
                </div>

                <input
                  placeholder="NAME"
                  className="signup-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  placeholder="PHONE NUMBER"
                  className="signup-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ marginBottom: 22 }}
                />

                <label className="signup-checkbox">
                  <input
                    type="checkbox"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span>
                    I agree to the <a href="/terms">Terms &amp; Conditions</a>
                  </span>
                </label>

                <label className="signup-checkbox">
                  <input
                    type="checkbox"
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span>
                    I agree to the <a href="/privacy">Privacy Policy</a>
                  </span>
                </label>

                {messageSlot}

                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={sendVerification}
                    disabled={loading}
                  >
                    {loading ? "SENDING..." : "REQUEST"}
                  </button>
                </div>
              </>
            )}

            {mode === "register" && step === "verify" && (
              <>
                <div className="signup-title signup-title-large">
                  Enter Verification Code
                </div>

                <input
                  placeholder="6 digit code"
                  className="signup-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                {messageSlot}

                <div className="signup-request-button-wrap">
                  <button
                    className="cta-button modal-primary-button"
                    onClick={verifyCode}
                    disabled={loading}
                  >
                    {loading ? "VERIFYING..." : "VERIFY"}
                  </button>
                </div>
              </>
            )}

            {mode === "login" && loginStep === "phone" && (
              <>
                <div className="signup-title signup-title-large" style={{ marginBottom: 0 }}>
                  Log In
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
                  <input
                    placeholder="PHONE NUMBER"
                    className="signup-input"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {messageSlot}
                <div className="signup-request-button-wrap" style={{ paddingTop: 0 }}>
                  <button
                    className="cta-button modal-primary-button"
                    onClick={sendLoginCode}
                    disabled={loading}
                  >
                    {loading ? "SENDING..." : "SEND CODE"}
                  </button>
                </div>
              </>
            )}

            {mode === "login" && loginStep === "verify" && (
              <>
                <div className="signup-title signup-title-large" style={{ marginBottom: 0 }}>
                  Enter Code
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "20%" }}>
                  <input
                    placeholder="6 digit code"
                    className="signup-input"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                {messageSlot}
                <div className="signup-request-button-wrap">
                  <button
                    className="cta-button modal-primary-button"
                    onClick={verifyLoginCode}
                    disabled={loading}
                  >
                    {loading ? "VERIFYING..." : "VERIFY"}
                  </button>
                </div>
              </>
            )}

            <button className="signup-close" onClick={() => { setOpen(false); setMode("register"); }}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
