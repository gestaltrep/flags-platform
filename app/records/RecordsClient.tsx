"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type EventRow = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  start_time: string | null;
  status: string;
  headliner: string | null;
};

export default function RecordsClient({
  events,
  counts,
}: {
  events: EventRow[];
  counts: Record<string, number>;
}) {
  const [viewportWidth, setViewportWidth] = useState(1400);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 900;
  const isCompactDesktop = !isMobile && viewportWidth >= 1180 && viewportWidth <= 1550;

  // Exact values from TerminalClient.tsx desktopMainStyle / mobile main style
  const mainStyle: React.CSSProperties = isMobile
    ? {
        marginTop: 26,
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 60,
      }
    : isCompactDesktop
      ? {
          marginTop: 72,
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: 60,
          width: 1032,
          maxWidth: "calc(100vw - 80px)",
        }
      : {
          marginTop: 72,
          marginLeft: 120,
          marginRight: 40,
          marginBottom: 60,
        };

  // Exact value from TerminalClient.tsx: desktopTitleSize = isCompactDesktop ? 34 : 30
  const titleSize = isMobile ? 28 : isCompactDesktop ? 34 : 30;
  const titleLetterSpacing = isMobile ? 4 : 6;
  const titleMarginBottom = isMobile ? 16 : 24;

  const mono = '"Courier New", monospace';

  return (
    <main style={mainStyle}>
      <div
        style={{
          fontSize: titleSize,
          letterSpacing: titleLetterSpacing,
          marginBottom: titleMarginBottom,
        }}
      >
        Records
      </div>

      {events.map((event) => {
        const count = counts[event.id] ?? 0;
        return (
          <Link
            key={event.id}
            href={`/records/${event.slug}`}
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                borderTop: "1px solid #333",
                padding: "16px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 13,
                    letterSpacing: 2,
                    marginBottom: 5,
                  }}
                >
                  {event.name}
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#666",
                    marginBottom: event.headliner ? 2 : 0,
                  }}
                >
                  {formatDate(event.start_time)}
                  {event.location ? ` · ${event.location}` : ""}
                </div>
                {event.headliner && (
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: "#666",
                    }}
                  >
                    {event.headliner}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: count > 0 ? "#aaa" : "#555",
                  whiteSpace: "nowrap",
                  paddingLeft: 20,
                  paddingTop: 2,
                  flexShrink: 0,
                }}
              >
                {count > 0 ? `${count} RECORD${count === 1 ? "" : "S"}` : "RECORDS PENDING"}
              </div>
            </div>
          </Link>
        );
      })}

      {events.length > 0 && (
        <div style={{ height: 1, background: "#333" }} />
      )}

      {events.length === 0 && (
        <div
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 2,
            color: "#555",
            paddingTop: 24,
          }}
        >
          {">"} NO RECORDS FOUND
        </div>
      )}
    </main>
  );
}
