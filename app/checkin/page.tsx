"use client";

import { useEffect, useState } from "react";

type ValidateState = "loading" | "ready" | "used" | "invalid" | "error";
type Step = "consent" | "form" | "verify" | "success";

const WAIVER_TITLE =
  "Liability Waiver, Release, Assumption of Risk, and Indemnity Agreement";

const WAIVER_CHECKBOX_TEXT =
  "I am at least 18 years old, I have read and agree to the Liability Waiver, Release, Assumption of Risk, and Indemnity Agreement, and I understand that it includes a release of claims for ordinary negligence and a waiver of important legal rights.";

const WAIVER_BODY = `LIABILITY WAIVER, RELEASE, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

By checking the acceptance box during event check-in, I acknowledge that I have read this Agreement, understand it, and agree to be legally bound by it.

1. Organizer

This event is solely organized, produced, and operated by Azazel_ver1.0.0 LLC, a Florida limited liability company (“Organizer”). The following entities provide or receive services in connection with the event and are not co-organizers: Seativa Entertainment LLC, Signo Research Group LLC, 13th Tribe Inc., and Gestalt LLC (each a Florida limited liability company, collectively “Service Providers”). Each Service Provider acts in its own independent capacity and is not an agent, partner, joint venturer, or representative of Organizer or any other Service Provider.

2. No Third-Party Authority

No third party has authority to make representations, promises, waivers, statements, or commitments on behalf of Organizer unless Organizer has expressly authorized such person or entity in a written instrument signed by Organizer.

3. Independent Capacity of All Entities

Organizer and each Service Provider act in their own separate and independent capacities. The acts, omissions, representations, liabilities, or obligations of one entity shall not be attributed to, imputed to, or create liability for any other entity. No entity is responsible for the acts or omissions of any other entity, whether or not those acts or omissions arise in connection with this event. This independence applies whether or not a written contract exists between the entities.

4. Independent Contractor Status

Any venue owner, landlord, lessor, security company, emergency or medical provider, artist, performer, vendor, sponsor, contractor, subcontractor, volunteer, or premises personnel present at or connected with the event acts in its or his or her own separate capacity unless Organizer expressly states otherwise in a written agreement. Nothing in this Agreement creates a partnership, joint venture, or general agency relationship between Organizer and any such person or entity.

5. Released Parties

For purposes of this Agreement, “Released Parties” means Organizer; the Service Providers (Seativa Entertainment LLC, Signo Research Group LLC, 13th Tribe Inc., and Gestalt LLC); Charlotte County Fair Association, Inc.; the event venue; property owner; landlord; lessor; event staff; security providers; emergency or medical personnel; contractors; subcontractors; volunteers; sponsors; artists; performers; vendors; and each of their respective owners, members, managers, officers, directors, employees, representatives, successors, and assigns.

6. Age Representation

I represent and warrant that I am at least eighteen (18) years old.

7. Activity Description

I understand that I am attending a live music event at which Organizer may conduct an optional, competitive, interactive game involving event-issued tickets, tags, tokens, or similar designated visible game items worn on a participant’s person. I understand that the game may begin later in the event without prior public disclosure of its timing. I understand that participation in the game is voluntary. I further understand that the game may involve pursuit, crowd movement, attempts by other participants to remove the designated visible game item, and incidental light physical contact.

8. Voluntary Participation

I understand that attendance at the event does not require participation in the game. I may decline to participate in the game and may stop participating at any time. If I choose to participate, I do so voluntarily and at my own risk.

9. Assumption of Risks

I understand and expressly assume all risks arising from or related to attendance at the event and, if I elect to participate, the game, including but not limited to: crowd density; loud music; darkness or low lighting; flashing lights; fog or visual obstruction; uneven, wet, slippery, cluttered, or damaged surfaces; stairs; barriers; equipment; elevated sound levels; collisions; trips; falls; being bumped, jostled, brushed, lightly grabbed, or pursued by other participants; clothing damage; loss of tickets, tags, phones, wallets, jewelry, or other property; participant misconduct; intoxicated persons; negligent acts of other attendees; and the risk of serious bodily injury, disability, emotional distress, illness, or death.

10. Release and Waiver of Claims

TO THE FULLEST EXTENT PERMITTED BY FLORIDA LAW, I KNOWINGLY AND VOLUNTARILY RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE THE RELEASED PARTIES FOR ANY AND ALL CLAIMS, DEMANDS, ACTIONS, CAUSES OF ACTION, DAMAGES, LOSSES, LIABILITIES, COSTS, OR EXPENSES, INCLUDING ATTORNEYS’ FEES, ARISING OUT OF OR RELATED TO MY ATTENDANCE AT THE EVENT OR MY PARTICIPATION IN THE GAME, INCLUDING CLAIMS ARISING FROM THE ORDINARY NEGLIGENCE OF ANY RELEASED PARTY.

11. Non-Waivable Claims

Nothing in this Agreement releases any claim that cannot lawfully be released under Florida law, including claims based on gross negligence, reckless conduct, willful misconduct, or intentional wrongful acts to the extent such claims are non-waivable.

12. No Cross-Entity Liability

I acknowledge that each Released Party acts independently. I agree that I will not assert any claim against one Released Party based solely on that party’s association with, presence at, or service relationship to another Released Party. Each Released Party’s liability, if any, shall be evaluated solely on the basis of its own independent acts or omissions.

13. Game Rules and Participant Conduct

If I participate in the game, I agree as follows:

I may only attempt to remove the specifically designated visible game item identified by Organizer.

I may not strike, punch, slap, kick, tackle, trip, shove, pin, body-check, choke, restrain, throw, drag, or intentionally knock down another person.

I may not grab private areas, reach into pockets, bags, bras, waistbands, or clothing interiors, or use force to remove clothing.

I may not use any tool, object, weapon, or device in connection with the game.

I may not pursue another participant into bathrooms, staff-only areas, parking lots, roadways, stairwells, backstage areas, bars, food-service lines, medical areas, entrances, exits, or any location designated off-limits by Organizer.

I must immediately stop if another participant verbally disengages, falls, appears injured, or if security, staff, or Organizer gives any instruction.

I may not participate while impaired to a level that makes safe participation unreasonable in Organizer’s judgment.

Organizer may suspend, disqualify, eject, or ban me at any time, with or without refund, for any actual or suspected rule violation or unsafe conduct.

14. Designated Item Only

Only the item specifically designated by Organizer as a game item may be targeted or removed. No other personal property may be taken, touched, interfered with, or treated as part of the game.

15. No Authorization of Theft or Assaultive Conduct

I understand that the game item is part of a limited event mechanic only and does not authorize theft of personal property, assault, battery, harassment, invasive touching, or conduct otherwise prohibited by law or event rules.

16. Health and Fitness Representation

I represent that I am physically and mentally capable of attending the event and, if I choose to participate, the game. I will not participate if I feel dizzy, unwell, injured, overly fatigued, or too impaired to participate safely. Organizer may bar or remove me from participation in its sole discretion.

17. Property Damage Responsibility

I am financially responsible for any loss, damage, vandalism, or destruction to the venue, surrounding property, equipment, furnishings, barriers, fixtures, vehicles, staging, sound equipment, lighting equipment, or any other real or personal property caused by my acts or omissions, whether intentional, reckless, negligent, or accidental. I agree to reimburse the applicable Released Parties for repair or replacement costs, including labor, materials, cleanup, security response, and reasonable attorneys’ fees and collection costs.

18. Indemnification

I agree to defend, indemnify, and hold harmless the Released Parties from and against any third-party claim, demand, suit, liability, damage, judgment, loss, cost, or expense, including reasonable attorneys’ fees, arising out of or related to: (a) my acts or omissions; (b) my violation of event rules or this Agreement; (c) any injury or property damage I cause or contribute to; or (d) any claim brought by a person associated with me or resulting from my conduct.

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

export default function CheckInPage() {
  const [code, setCode] = useState("");
  const [validateState, setValidateState] = useState<ValidateState>("loading");
  const [step, setStep] = useState<Step>("consent");
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [ticketType, setTicketType] = useState<"GA" | "VIP" | "">("");

  const [phone, setPhone] = useState("");
  const [tag, setTag] = useState("");
  const [team, setTeam] = useState<"black" | "white" | "">("");
  const [serial, setSerial] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [waiverOpen, setWaiverOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [debugStep, setDebugStep] = useState<
    "" | "consent" | "form" | "verify" | "success"
  >("");
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    const params = new URLSearchParams(window.location.search);
    const incomingCode = (params.get("code") || "").trim().toUpperCase();
    const incomingDebugStep = (params.get("debugStep") || "").trim().toLowerCase();

    setCode(incomingCode);

    if (
      process.env.NODE_ENV === "development" &&
      ["consent", "form", "verify", "success"].includes(incomingDebugStep)
    ) {
      setDebugMode(true);
      setDebugStep(
        incomingDebugStep as "consent" | "form" | "verify" | "success"
      );
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function validateCode() {
      if (debugMode && debugStep) {
        setValidateState("ready");
        setTicketType("GA");
        setPhone("2395881313");
        setTag("DEVPLAYER");
        setTeam("black");
        setSerial("DEV-SERIAL");
        setVerifyCode("");
        setStep(debugStep);
        setMessage("");
        return;
      }

      if (!code) {
        setValidateState("invalid");
        setMessage("No token code provided.");
        return;
      }

      setValidateState("loading");
      setMessage("");

      try {
        const res = await fetch("/api/scan-ticket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok && data?.success) {
          setValidateState("ready");
          setTicketType(data.ticket?.vip ? "VIP" : "GA");
          setStep("consent");
          return;
        }

        if (res.status === 409) {
          setValidateState("used");
          setMessage(data.message || "Token already used.");
          return;
        }

        if (res.status === 404) {
          setValidateState("invalid");
          setMessage(data.message || "Token not found.");
          return;
        }

        setValidateState("error");
        setMessage(data.message || "Token validation failed.");
      } catch {
        setValidateState("error");
        setMessage("Token validation failed.");
      }
    }

    validateCode();
  }, [code, debugMode, debugStep]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "black",
    border: "1px solid rgba(255,255,255,0.28)",
    color: "white",
    padding: isMobile ? "14px 14px" : "12px 14px",
    fontFamily: '"Courier New", monospace',
    fontSize: isMobile ? 15 : 14,
    outline: "none",
    marginBottom: isMobile ? 14 : 10,
    letterSpacing: isMobile ? 1.5 : 2,
    minHeight: isMobile ? undefined : 46,
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid white",
    background: "black",
    color: "white",
    padding: "14px 18px",
    fontSize: isMobile ? 13 : 15,
    cursor: "pointer",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 700,
    letterSpacing: isMobile ? 3 : 3.2,
    textTransform: "uppercase",
    minHeight: isMobile ? 54 : 56,
  };

  const checkboxStyle: React.CSSProperties = {
    WebkitAppearance: "checkbox",
    appearance: "auto",
    accentColor: "#9ca3af",
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.8)",
    width: isMobile ? 18 : 16,
    height: isMobile ? 18 : 16,
    cursor: "pointer",
    flexShrink: 0,
    marginTop: isMobile ? 2 : 0,
  };

  const pageWrapStyle: React.CSSProperties = {
    maxWidth: isMobile ? 820 : 1180,
    margin: isMobile ? "22px auto 48px auto" : "72px auto 80px auto",
    padding: isMobile ? "0 20px" : "0 24px",
    color: "white",
    fontFamily: '"Courier New", monospace',
    letterSpacing: 2,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? 24 : 30,
    marginBottom: isMobile ? 18 : 28,
    letterSpacing: isMobile ? 3.5 : 6,
    lineHeight: 1,
    wordBreak: "break-word",
  };

  const panelStyle: React.CSSProperties = {
    border: "1px solid #666",
    padding: isMobile ? "18px 18px 22px 18px" : "22px 28px 24px 28px",
  };

  const statusLineStyle: React.CSSProperties = {
    color: "#cfcfcf",
    fontSize: isMobile ? 13 : 14,
    lineHeight: isMobile ? 1.7 : 1.75,
    letterSpacing: isMobile ? 1.6 : 2,
  };

  const reserveStyle: React.CSSProperties = {
    minHeight: 14,
    marginTop: 4,
    marginBottom: 8,
    fontSize: isMobile ? 9 : 11,
    lineHeight: isMobile ? 1.2 : 1.35,
    color: "#cfcfcf",
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    cursor: "pointer",
  };

  const checkboxTextStyle: React.CSSProperties = {
    fontSize: isMobile ? 12 : 12,
    lineHeight: isMobile ? 1.42 : 1.5,
    letterSpacing: isMobile ? 0.7 : 1.5,
    color: "white",
  };

  async function onSubmitDetails(e: React.FormEvent) {
    e.preventDefault();

    if (!phone.trim() || !tag.trim() || !team || !serial.trim()) {
      setMessage("All fields are required.");
      return;
    }

    setSendingVerify(true);
    setMessage("");

    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error || "We couldn't send your code.");
        return;
      }

      setStep("verify");
      setMessage("Verification code sent.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSendingVerify(false);
    }
  }

  async function runCheckIn() {
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          phone,
          tag,
          team,
          serial,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message || "Check-in failed.");
        return false;
      }

      if (data.needsVerification) {
        // Should not happen here — phone was just verified. Guard against it
        // rather than showing a false success screen with no player record written.
        setMessage("Phone verification required. Please try again.");
        return false;
      }

      setStep("success");
      setMessage(data.message || "Check-in complete.");
      return true;
    } catch {
      setMessage("Check-in failed.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function completeVerification(e: React.FormEvent) {
    e.preventDefault();

    if (!verifyCode.trim()) {
      setMessage("Please enter the verification code.");
      return;
    }

    setVerifying(true);
    setMessage("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code: verifyCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error || "Verification failed.");
        return;
      }

      await runCheckIn();
    } catch {
      setMessage("Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function continueFromConsent() {
    if (!termsChecked) {
      setMessage("Please agree to the Terms & Conditions.");
      return;
    }

    if (!privacyChecked) {
      setMessage("Please agree to the Privacy Policy.");
      return;
    }

    if (!waiverChecked) {
      setMessage("Please accept the liability waiver.");
      return;
    }

    setMessage("");
    setStep("form");
  }

  return (
    <main style={pageWrapStyle}>
      <div style={titleStyle}>Check-In Terminal</div>

      <div style={panelStyle}>
        <div style={{ marginBottom: isMobile ? 8 : 12 }}>{">"} TOKEN CODE</div>

        <div
          style={{
            fontSize: isMobile ? 30 : 22,
            marginBottom: isMobile ? 18 : 12,
            wordBreak: "break-word",
            lineHeight: 1.2,
          }}
        >
          {code || "NO CODE DETECTED"}
        </div>

        {ticketType ? (
          <div
            style={{
              marginBottom: isMobile ? 24 : 26,
              color: "#cfcfcf",
              fontSize: isMobile ? 14 : 14,
              letterSpacing: isMobile ? 1.8 : 2,
            }}
          >
            {">"} TOKEN TYPE: {ticketType}
          </div>
        ) : null}

        {validateState === "loading" && (
          <div style={statusLineStyle}>{">"} VALIDATING TOKEN...</div>
        )}

        {(validateState === "used" ||
          validateState === "invalid" ||
          validateState === "error") && (
          <div style={{ ...statusLineStyle, marginTop: 8 }}>{">"} {message}</div>
        )}

        {validateState === "ready" && step === "consent" && (
          <div style={{ marginTop: 4 }}>
            <div style={{ ...statusLineStyle, marginBottom: isMobile ? 16 : 14 }}>
              {">"} COMPLETE PRE-CHECK-IN CONSENT TO CONTINUE.
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? 12 : 10,
                marginBottom: isMobile ? 14 : 14,
              }}
            >
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxTextStyle}>
                  I agree to the{" "}
                  <a
                    href="/terms"
                    style={{ color: "white", textDecoration: "underline" }}
                  >
                    Terms &amp; Conditions
                  </a>
                  .
                </span>
              </label>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  style={checkboxStyle}
                />
                <span style={checkboxTextStyle}>
                  I agree to the{" "}
                  <a
                    href="/privacy"
                    style={{ color: "white", textDecoration: "underline" }}
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              <label
                style={{
                  ...checkboxLabelStyle,
                  maxWidth: isMobile ? "100%" : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={waiverChecked}
                  onChange={(e) => setWaiverChecked(e.target.checked)}
                  style={checkboxStyle}
                />
                <span
                  style={{
                    ...checkboxTextStyle,
                    maxWidth: isMobile ? "calc(100% - 32px)" : "100%",
                  }}
                >
                  {WAIVER_CHECKBOX_TEXT}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setWaiverOpen((prev) => !prev)}
              style={{
                ...buttonStyle,
                minHeight: isMobile ? 52 : 46,
                marginBottom: waiverOpen ? 8 : 6,
                fontSize: isMobile ? 12 : 12,
              }}
            >
              {waiverOpen ? "HIDE FULL WAIVER" : "VIEW FULL WAIVER"}
            </button>

            {waiverOpen && (
              <div
                style={{
                  border: "1px solid #555",
                  padding: isMobile ? 14 : 16,
                  maxHeight: isMobile ? 240 : 300,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  fontSize: 11,
                  lineHeight: 1.55,
                  color: "#d0d0d0",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    fontSize: 12,
                    color: "white",
                    letterSpacing: 1.5,
                  }}
                >
                  {WAIVER_TITLE}
                </div>
                {WAIVER_BODY}
              </div>
            )}

            <div
              style={{
                ...reserveStyle,
                minHeight: message ? 14 : 0,
                marginTop: 2,
                marginBottom: 2,
              }}
            >
              {message}
            </div>

            <button type="button" onClick={continueFromConsent} style={buttonStyle}>
              CONTINUE
            </button>
          </div>
        )}

        {validateState === "ready" && step === "form" && (
          <form onSubmit={onSubmitDetails} style={{ marginTop: 4 }}>
            <div style={{ ...statusLineStyle, marginBottom: isMobile ? 16 : 10 }}>
              {">"} COMPLETE CHECK-IN DETAILS.
            </div>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="PHONE NUMBER"
              style={inputStyle}
            />

            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="GAMER TAG"
              style={inputStyle}
            />

            <div
              style={{
                position: "relative",
                marginBottom: isMobile ? 14 : 10,
              }}
            >
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value as "black" | "white" | "")}
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  paddingRight: isMobile ? 56 : 54,
                  minHeight: isMobile ? undefined : 46,
                }}
              >
                <option value="">TEAM COLOR</option>
                <option value="black">BLACK</option>
                <option value="white">WHITE</option>
              </select>

              <div
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  bottom: 1,
                  width: isMobile ? 48 : 44,
                  borderLeft: "1px solid rgba(255,255,255,0.22)",
                  background: "black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: isMobile
                      ? "7px solid transparent"
                      : "6px solid transparent",
                    borderRight: isMobile
                      ? "7px solid transparent"
                      : "6px solid transparent",
                    borderTop: isMobile ? "9px solid white" : "8px solid white",
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>

            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="FLAG SERIAL NUMBER"
              style={inputStyle}
            />

            <div
              style={{
                ...reserveStyle,
                minHeight: message ? 14 : 4,
                marginTop: 2,
                marginBottom: isMobile ? 8 : 6,
              }}
            >
              {message}
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={sendingVerify}
            >
              {sendingVerify ? "SENDING..." : "SEND CODE"}
            </button>
          </form>
        )}

        {validateState === "ready" && step === "verify" && (
          <form onSubmit={completeVerification} style={{ marginTop: 4 }}>
            <div style={{ ...statusLineStyle, marginBottom: isMobile ? 16 : 10 }}>
              {">"} ENTER THE CODE SENT TO YOUR PHONE.
            </div>

            <input
              value={phone}
              readOnly
              style={{
                ...inputStyle,
                opacity: 0.72,
              }}
            />

            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="VERIFICATION CODE"
              style={inputStyle}
            />

            <div
              style={{
                ...reserveStyle,
                minHeight: message ? 14 : 4,
                marginTop: 2,
                marginBottom: isMobile ? 8 : 6,
              }}
            >
              {message}
            </div>

            <button type="submit" style={buttonStyle} disabled={verifying || submitting}>
              {verifying || submitting ? "VERIFYING..." : "COMPLETE CHECK-IN"}
            </button>
          </form>
        )}

        {validateState === "ready" && step === "success" && (
          <div style={{ ...statusLineStyle, marginTop: 6, lineHeight: 2 }}>
            <div>{">"} CHECK-IN COMPLETE.</div>
            <div>{">"} STAY SAFE.</div>
          </div>
        )}
      </div>
    </main>
  );
}