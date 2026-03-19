import { cookies } from "next/headers";
import TerminalClient from "./TerminalClient";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id");

  if (!userId) {
    return (
      <>
        <main
          className="terminal-unauthorized-desktop"
          style={{
            marginTop: 120,
            marginLeft: 120,
            marginRight: 40,
          }}
        >
          <div
            style={{
              fontSize: 44,
              letterSpacing: 6,
              marginBottom: 40,
            }}
          >
            Terminal
          </div>

          <div
            style={{
              border: "1px solid #666",
              width: 640,
              maxWidth: "100%",
              padding: 32,
              fontSize: 18,
              letterSpacing: 2,
              lineHeight: 1.8,
            }}
          >
            <div>{">"} AUTHENTICATION FAILURE</div>
            <br />
            <div>{">"} UNAUTHORIZED ACCESS</div>
            <br />
            <div>{">"} PARTICIPANT REGISTRATION REQUIRED</div>
            <div>{">"} REQUEST PARTICIPATION TO OBTAIN TERMINAL ACCESS</div>
            <span className="cursor">_</span>
          </div>
        </main>

        <main
          className="terminal-unauthorized-mobile"
          style={{
            display: "none",
            marginTop: 34,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 60,
          }}
        >
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
              border: "1px solid #666",
              padding: 18,
              fontSize: 13,
              letterSpacing: 1.6,
              lineHeight: 1.8,
            }}
          >
            <div>{">"} AUTHENTICATION FAILURE</div>
            <div style={{ marginTop: 14 }}>{">"} UNAUTHORIZED ACCESS</div>
            <div style={{ marginTop: 14 }}>
              {">"} PARTICIPANT REGISTRATION REQUIRED
            </div>
            <div style={{ marginTop: 14 }}>
              {">"} REQUEST PARTICIPATION TO OBTAIN TERMINAL ACCESS
            </div>
            <div style={{ marginTop: 16 }}>
              <span className="cursor">_</span>
            </div>
          </div>
        </main>

        <style>{`
          @media (max-width: 899px) {
            .terminal-unauthorized-desktop {
              display: none !important;
            }
            .terminal-unauthorized-mobile {
              display: block !important;
            }
          }
        `}</style>
      </>
    );
  }

  return <TerminalClient />;
}