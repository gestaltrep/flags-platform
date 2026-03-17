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

  const { data } = await supabase
    .from("ticket_codes")
    .select("code")
    .eq("buyer_user_id", userId);

  return Response.json(data || []);

}