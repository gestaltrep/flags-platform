export default function SmsOptIn() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        lineHeight: "1.6",
      }}
    >
      <h1>SMS Messaging Program</h1>

      <p>
        Signo Research Group sends recurring SMS messages about events, updates,
        and announcements to members who opt in. Opt-in is optional and is not
        required to create an account, verify a phone number, or purchase
        tickets.
      </p>

      <hr />

      <h2>How to Opt In</h2>
      <p>
        From <strong>signoresearchgroup.com</strong>, click{" "}
        <strong>REQUEST PARTICIPATION</strong>, enter your name and phone
        number, then check the third checkbox — the SMS opt-in. This checkbox is
        separate from the required Terms of Service and Privacy Policy
        checkboxes. The form submits whether or not the SMS opt-in box is
        checked.
      </p>

      <h2>Opt-In Language</h2>
      <p>The SMS opt-in checkbox reads verbatim:</p>
      <blockquote
        style={{
          borderLeft: "3px solid #ccc",
          margin: "16px 0",
          paddingLeft: "16px",
          fontStyle: "italic",
        }}
      >
        I agree to receive recurring text messages from Signo Research Group
        about events, updates, and announcements. Msg frequency varies. Msg
        &amp; data rates may apply. Reply STOP to cancel.
      </blockquote>

      <h2>Opt-In Form Screenshot</h2>
      <img
        src="/consent-screenshot.png"
        alt="Screenshot of the Signo Research Group participation form showing the three checkboxes: Terms and Conditions, Privacy Policy, and the optional SMS opt-in checkbox"
        style={{ maxWidth: "100%", display: "block", margin: "16px 0" }}
      />

      <hr />

      <h2>Program Details</h2>
      <p>
        <strong>Message frequency:</strong> Varies based on event scheduling and
        announcement cadence.
      </p>
      <p>
        <strong>To stop:</strong> Reply <strong>STOP</strong> to any message.
        This stops all future marketing messages and does not affect your
        account, your ability to receive verification codes, or your ability to
        purchase tickets.
      </p>
      <p>
        <strong>For help:</strong> Reply <strong>HELP</strong>.
      </p>
      <p>
        <strong>Msg &amp; data rates may apply</strong> based on your carrier
        plan. We do not charge a fee for SMS messages.
      </p>
      <p>
        SMS opt-in data is not shared or sold to third parties or affiliates for
        marketing purposes.
      </p>

      <hr />

      <p>
        <a href="/privacy">Privacy Policy</a>
        {" · "}
        <a href="/terms">Terms &amp; Conditions</a>
      </p>
    </main>
  );
}
