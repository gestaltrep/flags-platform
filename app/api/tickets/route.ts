import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return Response.json([]);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("ticket_codes")
    .select(
      "id, code, vip, is_vip, claimed, claimed_at, created_at, buyer_user_id, claimed_by_user"
    )
    .or(
      `and(buyer_user_id.eq.${userId},claimed_by_user.is.null),claimed_by_user.eq.${userId}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Tickets fetch error:", error);
    return Response.json([]);
  }

  const shaped = (data || []).map((ticket) => ({
    id: ticket.id,
    code: ticket.code,
    vip: ticket.vip,
    is_vip: ticket.is_vip,
    claimed: ticket.claimed,
    claimed_at: ticket.claimed_at,
    created_at: ticket.created_at,
    can_send:
      ticket.buyer_user_id === userId &&
      !ticket.claimed &&
      !ticket.claimed_by_user,
  }));

  return Response.json(shaped);
}