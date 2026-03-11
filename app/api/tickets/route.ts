import { createClient } from "@supabase/supabase-js";

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("ticket_codes")
    .select("*")
    .eq("claimed", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return Response.json(data);

}