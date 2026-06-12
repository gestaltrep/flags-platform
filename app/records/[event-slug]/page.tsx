export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import UnauthorizedTerminalClient from "../../dashboard/UnauthorizedTerminalClient";
import HlsVideo from "./HlsVideo";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type EventRecord = {
  id: string;
  kind: string;
  storage_path: string;
  caption: string | null;
  display_order: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ "event-slug": string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) return <UnauthorizedTerminalClient title="Records" />;

  const resolvedParams = await params;
  const eventSlug = resolvedParams["event-slug"];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, name, location, start_time, end_time, status, headliner")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (!event) notFound();

  const { data: records } = await supabase
    .from("records")
    .select(
      "id, kind, storage_path, caption, display_order, mime_type, width, height, metadata, created_at"
    )
    .eq("event_id", event.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const recordList = (records ?? []) as EventRecord[];

  // Generate signed URLs server-side (1-hour expiry).
  // Photos: sign the thumbnail derivative (thumb_path); fall back to original if not yet processed.
  // Videos: sign the video source (storage_path) + the poster derivative (poster_path) if present.
  const recordsWithUrls = await Promise.all(
    recordList.map(async (record, index) => {
      const meta = (record.metadata ?? {}) as Record<string, string>;

      const sourcePath =
        record.kind === "photo"
          ? (meta.thumb_path ?? record.storage_path)
          : record.storage_path;

      const { data, error } = await supabase.storage
        .from("records")
        .createSignedUrl(sourcePath, 3600);
      if (error) {
        console.error(`Failed to sign URL for record ${record.id}:`, error);
        return null;
      }

      let signedPosterUrl: string | null = null;
      if (record.kind === "video" && meta.poster_path) {
        const { data: pd } = await supabase.storage
          .from("records")
          .createSignedUrl(meta.poster_path, 3600);
        signedPosterUrl = pd?.signedUrl ?? null;
      }

      return { record, signedUrl: data.signedUrl, signedPosterUrl, index };
    })
  );

  const validRecords = recordsWithUrls.filter(
    (r): r is { record: EventRecord; signedUrl: string; signedPosterUrl: string | null; index: number } =>
      r !== null
  );

  const mono = '"Courier New", monospace';

  return (
    <main
      className="records-detail-main"
      style={{
        marginTop: 60,
        marginBottom: 60,
      }}
    >
      {/* Back link */}
      <div style={{ marginBottom: 28 }}>
        <Link
          href="/records"
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 2,
            color: "#666",
            textDecoration: "none",
          }}
        >
          ← BACK TO RECORDS
        </Link>
      </div>

      {/* Event header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ height: 1, background: "#333", marginBottom: 8 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: mono,
            fontSize: 14,
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          <span>{event.name}</span>
          {event.status === "archived" && (
            <span style={{ color: "#555", fontSize: 10, letterSpacing: 1.5 }}>
              ARCHIVED
            </span>
          )}
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: "#555", marginBottom: event.headliner ? 2 : 8 }}>
          {formatDate(event.start_time)}{event.location ? ` · ${event.location}` : ""}
        </div>
        {event.headliner && (
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 1.5,
              color: "#555",
            }}
          >
            {event.headliner}
          </div>
        )}
        <div style={{ height: 1, background: "#333", marginTop: 8 }} />
      </div>

      {/* Gallery */}
      {validRecords.length === 0 ? (
        <div
          style={{
            fontFamily: mono,
            textAlign: "center",
            padding: "60px 0",
          }}
        >
          <div
            style={{
              fontSize: 13,
              letterSpacing: 2,
              color: "#555",
              marginBottom: 10,
            }}
          >
            RECORDS PENDING
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#444" }}>
            {">"} THIS EVENT'S FILE IS BEING PREPARED.
          </div>
        </div>
      ) : (
        <div
          style={{
            columnWidth: 340,
            columnGap: 20,
          }}
        >
          {validRecords.map(({ record, signedUrl, signedPosterUrl, index }) => {
            const docNum = String(record.display_order ?? index + 1).padStart(3, "0");

            if (record.kind === "photo") {
              return (
                <div
                  key={record.id}
                  style={{ display: "block", breakInside: "avoid", marginBottom: 20, border: "1px solid #333", overflow: "hidden" }}
                >
                  <img
                    src={signedUrl}
                    alt={record.caption ?? docNum}
                    width={record.width ?? undefined}
                    height={record.height ?? undefined}
                    loading="lazy"
                    decoding="async"
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                  <div
                    style={{
                      padding: "8px 12px",
                      fontFamily: mono,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: "#666",
                      borderTop: "1px solid #222",
                    }}
                  >
                    {record.caption ? `${docNum}    ${record.caption}` : docNum}
                  </div>
                </div>
              );
            }

            if (record.kind === "video") {
              const hlsMaster = (record.metadata as any)?.hls?.master as string | undefined;
              return (
                <div
                  key={record.id}
                  style={{ display: "block", breakInside: "avoid", marginBottom: 20, border: "1px solid #333", overflow: "hidden" }}
                >
                  {hlsMaster ? (
                    <HlsVideo
                      masterUrl={`/api/hls/${hlsMaster}`}
                      poster={signedPosterUrl}
                      width={record.width}
                      height={record.height}
                    />
                  ) : (
                    <video
                      src={signedUrl}
                      controls
                      playsInline
                      preload="none"
                      poster={signedPosterUrl ?? undefined}
                      width={record.width ?? undefined}
                      height={record.height ?? undefined}
                      style={{ display: "block", width: "100%", height: "auto" }}
                    />
                  )}
                  <div
                    style={{
                      padding: "8px 12px",
                      fontFamily: mono,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      color: "#666",
                      borderTop: "1px solid #222",
                    }}
                  >
                    {record.caption ? `${docNum}    ${record.caption}` : docNum}
                  </div>
                </div>
              );
            }

            // Defensive fallback for unimplemented kinds
            return (
              <div
                key={record.id}
                style={{
                  display: "block",
                  breakInside: "avoid",
                  marginBottom: 20,
                  border: "1px solid #333",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    fontFamily: mono,
                    fontSize: 11,
                    color: "#666",
                  }}
                >
                  {record.kind.toUpperCase()} RECORD — viewer not yet implemented
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: "#666",
                    borderTop: "1px solid #222",
                  }}
                >
                  {record.caption ? `${docNum}    ${record.caption}` : docNum}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
