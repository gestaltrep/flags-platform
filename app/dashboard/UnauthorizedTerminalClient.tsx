"use client";

import { useEffect, useRef, useState } from "react";

export default function UnauthorizedTerminalClient() {
  const [lines, setLines] = useState<string[]>([]);
  const [viewportWidth, setViewportWidth] = useState(1400);
  const timeoutIdsRef = useRef<number[]>([]);

  const unauthorizedScript = [
    "> AUTHENTICATION FAILURE",
    "> UNAUTHORIZED ACCESS",
    "> PARTICIPANT REGISTRATION REQUIRED",
    "> REQUEST PARTICIPATION TO OBTAIN TERMINAL ACCESS",
  ];

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
    setLines([]);

    unauthorizedScript.forEach((line, index) => {
      const id = window.setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, index * 420);
      timeoutIdsRef.current.push(id);
    });

    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  const isMobile = viewportWidth < 900;
  const isCompactDesktop = !isMobile && viewportWidth >= 1180 && viewportWidth <= 1550;

  const desktopWrapperStyle: React.CSSProperties = isCompactDesktop
    ? {
        display: "block",
        marginTop: 72,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 60,
        width: 1032,
        maxWidth: "calc(100vw - 80px)",
      }
    : {
        display: "block",
        marginTop: 120,
        marginLeft: 120,
        marginRight: 40,
        marginBottom: 60,
      };

  const desktopTitleSize = isCompactDesktop ? 46 : 42;
  const desktopBoxWidth = isCompactDesktop ? 720 : 640;
  const desktopBoxPadding = isCompactDesktop ? "30px 32px" : "28px 30px";
  const desktopBoxFontSize = isCompactDesktop ? 18 : 17;
  const desktopBoxMinHeight = isCompactDesktop ? 248 : 230;

  return (
    <>
      <main className="terminal-unauthorized-desktop" style={desktopWrapperStyle}>
        <div
          style={{
            fontSize: desktopTitleSize,
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
            width: desktopBoxWidth,
            maxWidth: "100%",
            padding: desktopBoxPadding,
            fontSize: desktopBoxFontSize,
            letterSpacing: 2,
            lineHeight: 1.85,
            minHeight: desktopBoxMinHeight,
          }}
        >
          {lines.map((line, i) => (
            <div key={line} style={{ marginTop: i === 0 ? 0 : 18 }}>
              {line}
            </div>
          ))}

          <div style={{ marginTop: lines.length > 0 ? 22 : 0 }}>
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
            minHeight: 196,
          }}
        >
          {lines.map((line, i) => (
            <div key={line} style={{ marginTop: i === 0 ? 0 : 14 }}>
              {line}
            </div>
          ))}

          <div style={{ marginTop: lines.length > 0 ? 16 : 0 }}>
            <span className="cursor">_</span>
          </div>
        </div>
      </main>

      <style>{`
        .terminal-unauthorized-desktop {
          display: block;
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