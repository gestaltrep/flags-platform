export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import UnauthorizedTerminalClient from "../dashboard/UnauthorizedTerminalClient";
import RecordsClient from "./RecordsClient";
import { getVerifiedUserId } from "@/lib/auth";
import { isValidPreviewKey } from "@/lib/preview";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params?.key;
  const key = Array.isArray(raw) ? raw[0] : raw;

  // A valid preview key stands in for a session; everything below is the same
  // view a logged-in user gets. Event two stays absent until it is archived —
  // the query below deliberately excludes draft.
  const previewing = isValidPreviewKey(key);

  const userId = previewing ? "preview" : await getVerifiedUserId();

  if (!userId) return <UnauthorizedTerminalClient title="Records" />;

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

  const counts: Record<string, number> = {};
  (recordRows ?? []).forEach((r: { event_id: string }) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });

  // Records is an archive, so an event with nothing in it has nothing to show.
  // This is a count test rather than a status or name test, so an event joins
  // the list the moment its first record lands and leaves again if they are
  // all removed — nothing here needs editing per event.
  const eventsWithRecords = eventList.filter((e) => (counts[e.id] ?? 0) > 0);

  return <RecordsClient events={eventsWithRecords} counts={counts} />;
}
