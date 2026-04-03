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

  const desktopOuterWidth = isCompactDesktop ? 1032 : undefined;
  const desktopLeftWidth = isCompactDesktop ? 520 : 460;
  const desktopBoxPadding = isCompactDesktop ? 22 : 20;
  const desktopBoxFont = isCompactDesktop ? 14 : 13;
  const desktopBoxMinHeight = isCompactDesktop ? 194 : 178;
  const desktopTitleSize = isCompactDesktop ? 34 : 30;

  const desktopMainStyle: React.CSSProperties = isCompactDesktop
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

  return (
    <>
      {!isMobile ? (
        <main style={desktopMainStyle}>
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
            {lines.map((line, i) => (
              <div key={line} style={{ marginTop: i === 0 ? 0 : 0 }}>
                {line}
              </div>
            ))}

            <div style={{ marginTop: 0 }}>
              <span className="cursor">_</span>
            </div>
          </div>
        </main>
      ) : (
        <main
          style={{
            marginTop: 26,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 60,
          }}
        >
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
            {lines.map((line, i) => (
              <div key={line} style={{ marginTop: i === 0 ? 0 : 8 }}>
                {line}
              </div>
            ))}

            <div style={{ marginTop: 10 }}>
              <span className="cursor">_</span>
            </div>
          </div>
        </main>
      )}
    </>
  );
}