import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count: gaCount } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", EVENT_ID)
    .eq("is_vip", false)
    .not("buyer_user_id", "is", null);

  const { count: vipCount } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", EVENT_ID)
    .eq("is_vip", true)
    .not("buyer_user_id", "is", null);

  const sold = gaCount ?? 0;
  const vipSold = vipCount ?? 0;

  const tier = sold < 333 ? 1 : sold < 666 ? 2 : 3;

  return Response.json({
    tier,
    sold,
    vipSold,
    generalSoldOut: sold >= 1000,
    vipSoldOut: vipSold >= 150,
  });
}