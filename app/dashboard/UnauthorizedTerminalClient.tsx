"use client";

import { useEffect, useRef, useState } from "react";

export default function UnauthorizedTerminalClient() {
  const [showBootBlock, setShowBootBlock] = useState(false);
  const [showFinalBlock, setShowFinalBlock] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1400);
  const timeoutsRef = useRef<number[]>([]);

  const bootBlock = `> AUTHENTICATION FAILURE

> UNAUTHORIZED ACCESS

> PARTICIPANT REGISTRATION REQUIRED`;

  const finalBlock = `> REQUEST PARTICIPATION TO OBTAIN
  TERMINAL ACCESS`;

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

    setShowBootBlock(false);
    setShowFinalBlock(false);
    setShowCursor(false);

    const lineDelay = 450;

    const bootId = window.setTimeout(() => {
      setShowBootBlock(true);
    }, lineDelay);

    const finalId = window.setTimeout(() => {
      setShowFinalBlock(true);
    }, lineDelay * 4);

    const cursorId = window.setTimeout(() => {
      setShowCursor(true);
    }, lineDelay * 5);

    timeoutsRef.current.push(bootId, finalId, cursorId);

    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
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

  const terminalTextStyle: React.CSSProperties = isMobile
    ? {
        whiteSpace: "pre-wrap",
        margin: 0,
        font: 'inherit',
        letterSpacing: 1.15,
        lineHeight: 1.62,
      }
    : {
        whiteSpace: "pre-wrap",
        margin: 0,
        font: 'inherit',
        letterSpacing: 1.4,
        lineHeight: 1.7,
      };

  return !isMobile ? (
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
        {showBootBlock && <pre style={terminalTextStyle}>{bootBlock}</pre>}
        {showFinalBlock && <pre style={terminalTextStyle}>{finalBlock}</pre>}
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
        {showBootBlock && <pre style={terminalTextStyle}>{bootBlock}</pre>}
        {showFinalBlock && <pre style={terminalTextStyle}>{finalBlock}</pre>}
        {showCursor && (
          <div style={{ marginTop: 10 }}>
            <span className="cursor">_</span>
          </div>
        )}
      </div>
    </main>
  );
}