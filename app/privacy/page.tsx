export default function Privacy() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        lineHeight: "1.6",
      }}
    >
      <h1>Privacy Policy</h1>
      <p>Last Updated: April 2026</p>

      <h2>Overview</h2>
      <p>
        This Privacy Policy describes how Signo Research Group ("we", "our",
        "us") collects, uses, and protects personal information when individuals
        register for participation through this website.
      </p>

      <h2>Information We Collect</h2>
      <p>When you register through the website, we may collect:</p>
      <ul>
        <li>Name</li>
        <li>Phone number</li>
        <li>User alias or gamer tag</li>
        <li>Ticket or participation identifier</li>
        <li>Event interaction data</li>
      </ul>

      <h2>How Information Is Used</h2>
      <p>
        Information is used only for purposes related to participation through
        the website, including:
      </p>
      <ul>
        <li>Account creation and verification</li>
        <li>Phone verification when signing in or claiming a transferred token</li>
      </ul>

      <h2>SMS Verification</h2>
      <p>
        Signo Research Group sends one-time verification codes via SMS for the
        purpose of completing phone verification when creating an account,
        signing in to an existing account, or claiming a transferred token.
        These are transactional messages sent only in direct response to
        user-initiated actions.
      </p>
      <p>
        Message frequency is limited to user-initiated verification events.
        Message and data rates may apply depending on your mobile carrier.
      </p>
      <p>
        You may reply <b>STOP</b> to opt out of verification messages, though
        doing so will prevent future account access via phone verification. For
        assistance, reply <b>HELP</b>.
      </p>

      <h2>Information Sharing</h2>
      <p>We do not sell or rent personal information to third parties.</p>
      <p>
        Phone numbers are not shared with third parties or affiliates for
        marketing purposes.
      </p>
      <p>
        Information may be processed by service providers required to operate
        the website, including:
      </p>
      <ul>
        <li>Twilio (SMS messaging infrastructure)</li>
        <li>Supabase (database infrastructure)</li>
      </ul>

      <h2>Data Security</h2>
      <p>
        Reasonable safeguards are used to protect personal information,
        including encrypted communications and secure cloud infrastructure.
      </p>

      <h2>Contact</h2>
      <p>
        Questions regarding this Privacy Policy may be directed to{" "}
        <a href="mailto:support.signoresearchgroup@gmail.com">
          support.signoresearchgroup@gmail.com
        </a>.
      </p>
    </main>
  );
}