import { cookies } from "next/headers";
import TerminalClient from "./TerminalClient";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id");

  if (!userId) {
    return (
      <>
        <main className="terminal-unauthorized-desktop">
          <div
            style={{
              fontSize: 42,
              letterSpacing: 6,
              marginBottom: 28,
              lineHeight: 1,
            }}
          >
            Terminal
          </div>

          <div
            style={{
              border: "1px solid #666",
              width: 640,
              maxWidth: "100%",
              padding: "28px 30px",
              fontSize: 17,
              letterSpacing: 2,
              lineHeight: 1.85,
            }}
          >
            <div>{">"} AUTHENTICATION FAILURE</div>
            <div style={{ marginTop: 18 }}>{">"} UNAUTHORIZED ACCESS</div>
            <div style={{ marginTop: 18 }}>
              {">"} PARTICIPANT REGISTRATION REQUIRED
            </div>
            <div style={{ marginTop: 18 }}>
              {">"} REQUEST PARTICIPATION TO OBTAIN TERMINAL ACCESS
            </div>
            <div style={{ marginTop: 22 }}>
              <span className="cursor">_</span>
            </div>
          </div>
        </main>

        <main className="terminal-unauthorized-mobile">
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              marginBottom: 20,
              lineHeight: 1,
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
              lineHeight: 1.85,
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
          .terminal-unauthorized-desktop {
            display: block;
            margin-top: 120px;
            margin-left: 120px;
            margin-right: 40px;
            margin-bottom: 60px;
          }

          .terminal-unauthorized-mobile {
            display: none;
            margin-top: 34px;
            margin-left: 20px;
            margin-right: 20px;
            margin-bottom: 60px;
          }

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