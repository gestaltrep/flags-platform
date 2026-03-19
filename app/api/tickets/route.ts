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
    .select("id, code, vip, is_vip, claimed, claimed_at, created_at")
    .eq("buyer_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Tickets fetch error:", error);
    return Response.json([]);
  }

  return Response.json(data || []);
}