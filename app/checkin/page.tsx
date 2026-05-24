"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

// ─── Waiver (verbatim from original checkin page) ────────────────────────────

const WAIVER_BODY = `LIABILITY WAIVER, RELEASE, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

By checking the acceptance box during event check-in, I acknowledge that I have read this Agreement, understand it, and agree to be legally bound by it.

1. Organizer

This event is solely organized, produced, and operated by Azazel_ver1.0.0 LLC, a Florida limited liability company ("Organizer"). The following entities provide or receive services in connection with the event and are not co-organizers: Seativa Entertainment LLC, Signo Research Group LLC, 13th Tribe Inc., and Gestalt LLC (each a Florida limited liability company, collectively "Service Providers"). Each Service Provider acts in its own independent capacity and is not an agent, partner, joint venturer, or representative of Organizer or any other Service Provider.

2. No Third-Party Authority

No third party has authority to make representations, promises, waivers, statements, or commitments on behalf of Organizer unless Organizer has expressly authorized such person or entity in a written instrument signed by Organizer.

3. Independent Capacity of All Entities

Organizer and each Service Provider act in their own separate and independent capacities. The acts, omissions, representations, liabilities, or obligations of one entity shall not be attributed to, imputed to, or create liability for any other entity. No entity is responsible for the acts or omissions of any other entity, whether or not those acts or omissions arise in connection with this event. This independence applies whether or not a written contract exists between the entities.

4. Independent Contractor Status

Any venue owner, landlord, lessor, security company, emergency or medical provider, artist, performer, vendor, sponsor, contractor, subcontractor, volunteer, or premises personnel present at or connected with the event acts in its or his or her own separate capacity unless Organizer expressly states otherwise in a written agreement. Nothing in this Agreement creates a partnership, joint venture, or general agency relationship between Organizer and any such person or entity.

5. Released Parties

For purposes of this Agreement, "Released Parties" means Organizer; the Service Providers (Seativa Entertainment LLC, Signo Research Group LLC, 13th Tribe Inc., and Gestalt LLC); Charlotte County Fair Association, Inc.; the event venue; property owner; landlord; lessor; event staff; security providers; emergency or medical personnel; contractors; subcontractors; volunteers; sponsors; artists; performers; vendors; and each of their respective owners, members, managers, officers, directors, employees, representatives, successors, and assigns.

6. Age Representation

I represent and warrant that I am at least eighteen (18) years old.

7. Activity Description

I understand that I am attending a live music event at which Organizer may conduct an optional, competitive, interactive game involving event-issued tickets, tags, tokens, or similar designated visible game items worn on a participant's person. I understand that the game may begin later in the event without prior public disclosure of its timing. I understand that participation in the game is voluntary. I further understand that the game may involve pursuit, crowd movement, attempts by other participants to remove the designated visible game item, and incidental light physical contact.

8. Voluntary Participation

I understand that attendance at the event does not require participation in the game. I may decline to participate in the game and may stop participating at any time. If I choose to participate, I do so voluntarily and at my own risk.

9. Assumption of Risks

I understand and expressly assume all risks arising from or related to attendance at the event and, if I elect to participate, the game, including but not limited to: crowd density; loud music; darkness or low lighting; flashing lights; fog or visual obstruction; uneven, wet, slippery, cluttered, or damaged surfaces; stairs; barriers; equipment; elevated sound levels; collisions; trips; falls; being bumped, jostled, brushed, lightly grabbed, or pursued by other participants; clothing damage; loss of tickets, tags, phones, wallets, jewelry, or other property; participant misconduct; intoxicated persons; negligent acts of other attendees; and the risk of serious bodily injury, disability, emotional distress, illness, or death.

10. Release and Waiver of Claims

TO THE FULLEST EXTENT PERMITTED BY FLORIDA LAW, I KNOWINGLY AND VOLUNTARILY RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE THE RELEASED PARTIES FOR ANY AND ALL CLAIMS, DEMANDS, ACTIONS, CAUSES OF ACTION, DAMAGES, LOSSES, LIABILITIES, COSTS, OR EXPENSES, INCLUDING ATTORNEYS' FEES, ARISING OUT OF OR RELATED TO MY ATTENDANCE AT THE EVENT OR MY PARTICIPATION IN THE GAME, INCLUDING CLAIMS ARISING FROM THE ORDINARY NEGLIGENCE OF ANY RELEASED PARTY.

11. Non-Waivable Claims

Nothing in this Agreement releases any claim that cannot lawfully be released under Florida law, including claims based on gross negligence, reckless conduct, willful misconduct, or intentional wrongful acts to the extent such claims are non-waivable.

12. No Cross-Entity Liability

I acknowledge that each Released Party acts independently. I agree that I will not assert any claim against one Released Party based solely on that party's association with, presence at, or service relationship to another Released Party. Each Released Party's liability, if any, shall be evaluated solely on the basis of its own independent acts or omissions.

13. Game Rules and Participant Conduct

If I participate in the game, I agree as follows:

I may only attempt to remove the specifically designated visible game item identified by Organizer.

I may not strike, punch, slap, kick, tackle, trip, shove, pin, body-check, choke, restrain, throw, drag, or intentionally knock down another person.

I may not grab private areas, reach into pockets, bags, bras, waistbands, or clothing interiors, or use force to remove clothing.

I may not use any tool, object, weapon, or device in connection with the game.

I may not pursue another participant into bathrooms, staff-only areas, parking lots, roadways, stairwells, backstage areas, bars, food-service lines, medical areas, entrances, exits, or any location designated off-limits by Organizer.

I must immediately stop if another participant verbally disengages, falls, appears injured, or if security, staff, or Organizer gives any instruction.

I may not participate while impaired to a level that makes safe participation unreasonable in Organizer's judgment.

Organizer may suspend, disqualify, eject, or ban me at any time, with or without refund, for any actual or suspected rule violation or unsafe conduct.

14. Designated Item Only

Only the item specifically designated by Organizer as a game item may be targeted or removed. No other personal property may be taken, touched, interfered with, or treated as part of the game.

15. No Authorization of Theft or Assaultive Conduct

I understand that the game item is part of a limited event mechanic only and does not authorize theft of personal property, assault, battery, harassment, invasive touching, or conduct otherwise prohibited by law or event rules.

16. Health and Fitness Representation

I represent that I am physically and mentally capable of attending the event and, if I choose to participate, the game. I will not participate if I feel dizzy, unwell, injured, overly fatigued, or too impaired to participate safely. Organizer may bar or remove me from participation in its sole discretion.

17. Property Damage Responsibility

I am financially responsible for any loss, damage, vandalism, or destruction to the venue, surrounding property, equipment, furnishings, barriers, fixtures, vehicles, staging, sound equipment, lighting equipment, or any other real or personal property caused by my acts or omissions, whether intentional, reckless, negligent, or accidental. I agree to reimburse the applicable Released Parties for repair or replacement costs, including labor, materials, cleanup, security response, and reasonable attorneys' fees and collection costs.

18. Indemnification

I agree to defend, indemnify, and hold harmless the Released Parties from and against any third-party claim, demand, suit, liability, damage, judgment, loss, cost, or expense, including reasonable attorneys' fees, arising out of or related to: (a) my acts or omissions; (b) my violation of event rules or this Agreement; (c) any injury or property damage I cause or contribute to; or (d) any claim brought by a person associated with me or resulting from my conduct.

19. Security and Removal

I understand that Organizer may use security personnel, surveillance, bag checks, ID checks, and other safety measures. Organizer may deny entry, eject, disqualify, or detain me for investigation by law enforcement or venue security if Organizer reasonably believes I violated rules or endangered others. Removal or disqualification may occur without refund.

20. Medical Authorization and Costs

If I become ill or injured, I authorize Organizer, venue personnel, and emergency responders to secure medical treatment for me as they deem appropriate. I understand that Organizer is not required to provide medical insurance or reimburse medical expenses, and I remain solely responsible for my own medical bills except as otherwise required by law.

21. Photo, Video, and Incident Documentation

I consent to the recording, review, preservation, and use of surveillance footage, event photography, video, audio, body-camera footage, witness statements, and incident reports for safety, rules enforcement, insurance, dispute resolution, and legal defense purposes.

22. Personal Property

I am solely responsible for securing my own phone, wallet, keys, jewelry, clothing, and other belongings. The Released Parties are not bailees of my property and are not responsible for lost, stolen, or damaged personal items except as otherwise required by non-waivable law.

23. Data Collection Notice

In connection with event check-in, Organizer and its service providers collect your phone number and event participation information for the purpose of identity verification, entry management, and event communications. By completing check-in, you consent to this collection and its use for these purposes. Your information will not be sold to third parties. Standard message and data rates may apply to any SMS communications. Reply STOP to opt out of SMS notifications at any time.

24. No Warranty of Safety

I understand that the event environment may change rapidly and that Organizer does not guarantee a hazard-free environment or that any participant will follow the rules. I accept that safety measures may reduce, but cannot eliminate, all risks.

25. Governing Law and Venue

This Agreement is governed by the laws of the State of Florida. Any dispute arising out of or related to this Agreement or the event shall be brought exclusively in the state courts located in Charlotte County, Florida, or, if federal jurisdiction exists, the United States District Court for the Middle District of Florida, Fort Myers Division.

26. Severability

If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.

27. Entire Agreement

This Agreement contains the entire understanding between me and Organizer concerning the subject matter hereof and supersedes all prior oral or written statements on that subject.

28. Electronic Acceptance

I agree that my electronic acceptance of this Agreement during check-in is intended to constitute my legally binding signature and manifestation of assent, and that this electronic record and signature may not be denied legal effect solely because they are in electronic form.

29. Acknowledgment

BY CHECKING THE ACCEPTANCE BOX, I ACKNOWLEDGE THAT I HAVE READ THIS AGREEMENT, UNDERSTAND IT, AND AM GIVING UP IMPORTANT LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE FOR CLAIMS ARISING FROM ORDINARY NEGLIGENCE.`;

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
// Pure-JS QR detection via jsQR — no BarcodeDetector API, no WASM, no @yudiel.
// RAF loop; stops after first hit and lets the parent re-mount to restart.

function MinimalScanner({
  onScan,
  onError,
  onTick,
  onResolution,
  onJsqrResult,
}: {
  onScan: (code: DetectedCode) => void;
  onError: (err: Error) => void;
  onTick: () => void;
  onResolution: (w: number, h: number) => void;
  onJsqrResult: (result: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const onTickRef = useRef(onTick);
  const onResolutionRef = useRef(onResolution);
  const onJsqrResultRef = useRef(onJsqrResult);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
    onTickRef.current = onTick;
    onResolutionRef.current = onResolution;
    onJsqrResultRef.current = onJsqrResult;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let cancelled = false;
    let resolutionReported = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // @ts-expect-error — non-standard but supported on mobile Chrome/Safari
            focusMode: { ideal: "continuous" },
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

        const tick = () => {
          if (cancelled) return;
          onTickRef.current();
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              if (!resolutionReported) {
                resolutionReported = true;
                onResolutionRef.current(w, h);
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const code = jsQR(imageData.data, w, h, {
                  inversionAttempts: "attemptBoth",
                });
                onJsqrResultRef.current(code && code.data ? code.data : "null");
                if (code && code.data) {
                  onScanRef.current({ rawValue: code.data });
                  return; // stop polling after first hit
                }
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
  }, []); // runs once on mount, cleanup runs once on unmount

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
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: 200,
          height: "auto",
          aspectRatio: "9 / 16",
          objectFit: "contain",
          outline: "1px solid yellow",
          margin: "10px auto 0",
          background: "black",
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
  const [framesScanned, setFramesScanned] = useState(0);
  const [resolution, setResolution] = useState<string | null>(null);
  const [lastJsqrResult, setLastJsqrResult] = useState("null");
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
        body: JSON.stringify({ code: currentCode }),
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
          onTick={() => setFramesScanned((n) => n + 1)}
          onResolution={(w, h) => setResolution(`${w}×${h}`)}
          onJsqrResult={(r) => setLastJsqrResult(r.length > 80 ? r.slice(0, 80) : r)}
        />

        <div
          style={{
            textAlign: "center",
            color: "red",
            letterSpacing: 3,
            fontSize: 13,
            fontFamily: MONO,
            padding: "10px 0 4px",
          }}
        >
          {">"} AIM AT ENTRY TOKEN
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
              color: "#444",
              fontSize: 10,
              letterSpacing: 1.5,
              fontFamily: MONO,
              marginBottom: 4,
            }}
          >
            CHECKED IN: {checkedInCount} · FRAMES: {framesScanned}{resolution ? ` · RES: ${resolution}` : ""}
          </div>
          <div
            style={{
              color: "#444",
              fontSize: 10,
              letterSpacing: 1.5,
              fontFamily: MONO,
              marginBottom: 10,
              wordBreak: "break-all",
            }}
          >
            LAST JS: {lastJsqrResult}
          </div>
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
