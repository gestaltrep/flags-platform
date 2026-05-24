import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("checkin_tokens")
    .select("id")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (!data) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("checkin_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  return Response.json({ success: true, valid_until_ms: Date.now() + 600000 });
}
