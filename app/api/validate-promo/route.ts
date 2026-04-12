import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code) return Response.json({ valid: false });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("promo_codes")
    .select("id, active, label, type")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (data?.active) {
    return Response.json({ valid: true, label: data.label, type: data.type });
  }

  return Response.json({ valid: false });
}
