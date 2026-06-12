export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import UnauthorizedTerminalClient from "../dashboard/UnauthorizedTerminalClient";
import RecordsClient from "./RecordsClient";
import { getVerifiedUserId } from "@/lib/auth";

export default async function RecordsPage() {
  const userId = await getVerifiedUserId();

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

  return <RecordsClient events={eventList} counts={counts} />;
}
