export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code) return Response.json({ valid: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.toUpperCase().trim())}&select=id,active,label,type&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  const rows = await res.json();
  const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

  if (data?.active) {
    return Response.json({ valid: true, label: data.label, type: data.type });
  }

  return Response.json({ valid: false });
}
