"use client";

import { useEffect, useRef, useState } from "react";

export default function UnauthorizedTerminalClient() {
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showFinalBlock, setShowFinalBlock] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(1400);
  const timeoutsRef = useRef<number[]>([]);

  const bootLines = [
    "> AUTHENTICATION FAILURE",
    "> UNAUTHORIZED ACCESS",
    "> PARTICIPANT REGISTRATION REQUIRED",
  ];

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    setTerminalLines([]);
    setShowFinalBlock(false);
    setShowCursor(true);

    const lineDelay = 450;

    bootLines.forEach((line, index) => {
      const id = window.setTimeout(() => {
        setTerminalLines((prev) => [...prev, line]);
      }, index * lineDelay);
      timeoutsRef.current.push(id);
    });

    const finalBlockId = window.setTimeout(() => {
      setShowFinalBlock(true);
    }, bootLines.length * lineDelay);

    timeoutsRef.current.push(finalBlockId);

    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const isMobile = viewportWidth < 900;
  const isCompactDesktop =
    !isMobile && viewportWidth >= 1180 && viewportWidth <= 1550;

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

  const finalBlockStyle: React.CSSProperties = isMobile
    ? { marginTop: 8 }
    : { marginTop: 0 };

  const finalFirstLineStyle: React.CSSProperties = isMobile
    ? { marginTop: 8 }
    : {};

  const finalSecondLineStyle: React.CSSProperties = isMobile
    ? {
        paddingLeft: "1.36em",
        marginTop: 0,
      }
    : {
        paddingLeft: "1.36em",
        marginTop: 0,
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
            {terminalLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}

            {showFinalBlock && (
              <div style={finalBlockStyle}>
                <div style={finalFirstLineStyle}>
                  {">"} REQUEST PARTICIPATION TO OBTAIN
                </div>
                <div style={finalSecondLineStyle}>TERMINAL ACCESS</div>
              </div>
            )}

            {showCursor && <span className="cursor">_</span>}
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
            {terminalLines.map((line, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : 8 }}>
                {line}
              </div>
            ))}

            {showFinalBlock && (
              <div style={finalBlockStyle}>
                <div style={finalFirstLineStyle}>
                  {">"} REQUEST PARTICIPATION TO OBTAIN
                </div>
                <div style={finalSecondLineStyle}>TERMINAL ACCESS</div>
              </div>
            )}

            {showCursor && (
              <div style={{ marginTop: 10 }}>
                <span className="cursor">_</span>
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}