export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { count } = await supabase.from("ticket_codes").select("*", { count: "exact", head: true }).eq("event_id", EVENT_ID).eq("is_table", true);
  const tablesSold = Math.floor((count || 0) / 6);
  return Response.json({ sold: tablesSold, remaining: 10 - tablesSold, soldOut: tablesSold >= 10 });
}
