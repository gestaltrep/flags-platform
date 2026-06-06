export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UnauthorizedTerminalClient from "../dashboard/UnauthorizedTerminalClient";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RecordsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) return <UnauthorizedTerminalClient />;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, name, location, start_time, status, headliner")
    .in("status", ["archived", "locked", "live", "upcoming"])
    .order("start_time", { ascending: false });

  const eventList = events ?? [];
  const eventIds = eventList.map((e) => e.id);

  const { data: recordRows } =
    eventIds.length > 0
      ? await supabase
          .from("records")
          .select("event_id")
          .in("event_id", eventIds)
      : { data: [] };

  const countMap = new Map<string, number>();
  (recordRows ?? []).forEach((r: { event_id: string }) => {
    countMap.set(r.event_id, (countMap.get(r.event_id) ?? 0) + 1);
  });

  const mono = '"Courier New", monospace';

  return (
    <main
      style={{
        marginTop: 60,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 60,
        maxWidth: 900,
        padding: "0 24px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ height: 1, background: "#333", marginBottom: 12 }} />
        <div
          style={{
            fontFamily: mono,
            fontSize: 30,
            letterSpacing: 6,
            marginBottom: 6,
          }}
        >
          RECORDS
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 2,
            color: "#666",
          }}
        >
          DECLASSIFIED ARCHIVE
        </div>
        <div style={{ height: 1, background: "#333", marginTop: 12 }} />
      </div>

      {/* Event cards */}
      {eventList.map((event) => {
        const count = countMap.get(event.id) ?? 0;
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
                  {event.name.toUpperCase()}
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
                {count > 0 ? `${count} RECORDS` : "RECORDS PENDING"}
              </div>
            </div>
          </Link>
        );
      })}
      {eventList.length > 0 && (
        <div style={{ height: 1, background: "#333" }} />
      )}

      {eventList.length === 0 && (
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
