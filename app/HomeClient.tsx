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
/** .home-poster-wrap's border, backed out when positioning against it. */
const WRAP_BORDER = 2;
/**
 * Where the seal's glow sits inside the video frame, as fractions of the
 * rendered box. Measured off the settled frame at luminance threshold 40 —
 * the same threshold that fixed SEAL_LEFT_FRAC, so the three agree.
 * The glow is near enough square: 0.657 of the width, 0.920 of the height.
 */
const SEAL_W_FRAC = 0.657;
/*
 * The mobile stack's height is solved in globals.css, not here: it is fitted
 * to 100svh and only CSS can see svh. The fixed parts are 103px above the
 * frame, the frame's 156, the CTA's 62, and 21 of invisible glyph slack
 * inside the frame that the gap above the seal absorbs, which gives
 * CTA bottom = 300 + 2 * gap + seal height.
 */
/**
 * Seal-right to info-left on desktop. Derived once at 1512 by centring the
 * info column's PAINTED extent, not its declared track: every line is
 * white-space: nowrap and overflows the 350px track to the right, the venue
 * furthest at 467.6px. Centring that in the 763.5px between the seal's right
 * edge and the viewport puts it at 896.5, so the gap is 148. Held constant at
 * every other width rather than re-centring.
 */
const INFO_GAP = 148;
/**
 * The desktop CTA's width in preview: the info block's painted width, set by
 * the venue line at 467.6px. Applied inline because the button carries an
 * inline width of its own, which no stylesheet rule can outrank.
 */
const DESKTOP_CTA_W = 468;
/** Mobile seal scale when no ?mhero= is given. */
export const MOBILE_HERO_DEFAULT = 1.5;
/**
 * Painted ink of the widest mobile line — the date — at the shared CSS's own
 * type sizes. ?mtype= names a target ink width, and the multiplier is that
 * target over this, so the three lines keep their ratios to each other.
 */
const MOBILE_TYPE_BASE_INK = 263;
/** Target ink width for the mobile type when no ?mtype= is given. */
export const MOBILE_TYPE_DEFAULT = 305;
/**
 * Target for the gap above and below the mobile seal. 31 is what the layout
 * gives with no reclaim at all; anything above it is paid for out of the space
 * above the text block, which moves up by twice the gain so the CTA does not
 * move. 40 is reached in full on every viewport — it needs 18px of the 27.5
 * the floor allows.
 */
export const MOBILE_GAP_DEFAULT = 40;
/** Desktop hero scale when no ?hero= is given. */
export const HERO_SCALE_DEFAULT = 1.33;

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
/**
 * The hero, in whichever of the two forms the page needs.
 *
 * Declared at module scope, not inside HomeClient. A component declared in a
 * render body is a new function identity on every render, so React treats it
 * as a different component type and remounts the whole subtree — which meant
 * the boot glitch, which runs in a mount effect, replayed on every state
 * change, opening the participation modal included. The four values it used
 * to close over come in as props instead.
 */
function Poster({
  className, media, sized, mobileVisible,
  heroRootStyle, mobileRootStyle, previewMode, heroImage,
}: {
  className?: string; media: string; sized?: boolean; mobileVisible?: boolean;
  heroRootStyle?: React.CSSProperties; mobileRootStyle?: React.CSSProperties;
  previewMode: boolean; heroImage: string | null;
}) {
  // The mobile hero is otherwise hidden by
  // `.home-mobile-poster-wrap > div:last-child { display: none }`, a rule
  // written to hide the corner label — which preview removes, making the
  // hero itself the last child. Inline display wins over it.
  const rootStyle = sized
    ? heroRootStyle
    : mobileVisible && previewMode
      ? mobileRootStyle
      : undefined;
  // Preview only. HeroVideo is the sole thing that references the poster or
  // the mp4, so on the public path neither is rendered, preloaded or fetched.
  if (previewMode) {
    // A configured event still keeps its own image and gets no video.
    return heroImage ? (
      <HeroVideo className={className} media={media} rootStyle={rootStyle} posterSrc={heroImage} videoSrc={null} />
    ) : (
      <HeroVideo className={className} media={media} rootStyle={rootStyle} />
    );
  }
  // Public dormant path — unchanged.
  return <HeroGlitch className={className} />;
}

export default function HomeClient({
  isDormant,
  event = null,
  previewMode = false,
  previewKey = "",
  heroScale = 1,
  heroLift = HERO_LIFT_DEFAULT,
  mHeroScale = 1,
  mTypeTarget = MOBILE_TYPE_DEFAULT,
  mGapTarget = MOBILE_GAP_DEFAULT,
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
  mTypeTarget?: number;
  mGapTarget?: number;
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

  // Put the seal's left edge where .home-poster-wrap's grey outline used to
  // sit — the left edge of the 590px track in the 1x centred grid. That target
  // is the wrap's own border box, which is also this element's positioning
  // origin, so it needs no measurement and holds at every viewport. The -2
  // backs out the wrap's border, since left:0 is its padding box.
  const heroLeftPx = heroSized ? -Math.round(SEAL_LEFT_FRAC * heroW) - WRAP_BORDER : null;

  // Mobile: the wrap is sized to the seal's glow rather than to the video
  // frame, so the layout reflows to what is actually visible and the frame's
  // extra ground overhangs instead of pushing the CTA down. The sizing lives
  // in CSS off --mk so the cap against the viewport can use vw; doing it in JS
  // would need innerWidth, which the server does not have, and would either
  // mismatch on hydration or shift the layout after mount.
  const mSized = previewMode && mHeroScale !== 1;
  const mobileWrapStyle = previewMode ? { overflow: "visible" as const } : {};
  const mobileRootStyle = { display: "block" as const, overflow: "visible" as const };
  // Equal visible gaps: above is the frame's own glyph slack, so mirroring it
  // below needs nothing but a matching margin on the CTA.
  // The seal's height and both gaps are set in CSS now: they are solved
  // against 100svh, and an inline style would outrank that.
  const mobileCtaStyle = undefined;
  // Desktop: push the info column out to a constant distance from the seal.
  // Fed to CSS as a length so the calc can subtract the track and gap of
  // whichever breakpoint is live, without measuring anything at runtime.
  const infoVars = heroSized
    ? ({ "--seal-w": `${(SEAL_W_FRAC * heroW).toFixed(1)}px` } as React.CSSProperties)
    : undefined;
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
        <div className={heroSized ? "home-desktop-grid home-desktop-grid-preview" : "home-desktop-grid"} style={infoVars}>
          {/* Preview drops the frame and the corner label so the seal floats.
              borderColor rather than border keeps the box metrics identical,
              so the video's size and the grid do not move. */}
          <div
            style={previewMode
              ? { position: "relative", display: "block", borderColor: "transparent", ...heroWrapStyle }
              : { position: "relative", display: "block" }}
            className="home-poster-wrap"
          >
            <Poster className="home-poster-image" media="(min-width: 900px)" sized
              heroRootStyle={heroRootStyle} mobileRootStyle={mobileRootStyle}
              previewMode={previewMode} heroImage={event?.hero_image ?? null} />
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
              style={previewMode
                ? { width: DESKTOP_CTA_W, maxWidth: "none" }
                : { width: 352, maxWidth: "100%" }}
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

      <main
        className={previewMode ? "home-mobile home-mobile-preview" : "home-mobile"}
        style={previewMode
          ? ({ "--mk": String(mHeroScale),
               "--mtype": (mTypeTarget / MOBILE_TYPE_BASE_INK).toFixed(5),
               "--mgap": `${mGapTarget}px` } as React.CSSProperties)
          : undefined}
      >
        <div className="home-mobile-frame" style={previewMode ? { borderColor: "transparent" } : undefined}>
          <div className={previewMode ? "home-mobile-text home-mobile-text-ls" : "home-mobile-text"}>
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
          className={previewMode ? "home-mobile-poster-wrap home-mobile-poster-wrap-preview" : "home-mobile-poster-wrap"}
          style={previewMode
            ? { position: "relative", borderColor: "transparent", background: "transparent", ...mobileWrapStyle }
            : { position: "relative" }}
        >
          <Poster className="home-mobile-poster" media="(max-width: 899px)" mobileVisible
            heroRootStyle={heroRootStyle} mobileRootStyle={mobileRootStyle}
            previewMode={previewMode} heroImage={event?.hero_image ?? null} />
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

        <div className="home-mobile-cta-wrap" style={mobileCtaStyle}>
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
