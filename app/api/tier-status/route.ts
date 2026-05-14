import { createClient } from "@supabase/supabase-js";
import { calculateTier, TIER_TWO_TRIGGER } from "@/lib/tier";

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
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  const { count: vipCount } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", EVENT_ID)
    .eq("is_vip", true)
    .eq("comp", false)
    .not("buyer_user_id", "is", null)
    .is("refunded_at", null);

  const sold = gaCount ?? 0;
  const vipSold = vipCount ?? 0;

  const tier = calculateTier(sold);

  let tierStartedAtSold = 0;
  if (tier === 2) {
    const { count: preTriggerSold } = await supabase
      .from("ticket_codes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", EVENT_ID)
      .eq("is_vip", false)
      .eq("comp", false)
      .not("buyer_user_id", "is", null)
      .is("refunded_at", null)
      .lt("created_at", TIER_TWO_TRIGGER.toISOString());
    tierStartedAtSold = Math.min(50, preTriggerSold ?? 0);
  } else if (tier === 3) {
    tierStartedAtSold = 125;
  }

  return Response.json({
    tier,
    sold,
    vipSold,
    generalSoldOut: sold >= 1000,
    vipSoldOut: vipSold >= 50,
    tierStartedAtSold,
  });
}
