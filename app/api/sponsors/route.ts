import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("sponsors")
    .select("id, name, logo_url, link_url, display_order")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch sponsors:", error);
    return NextResponse.json({ sponsors: [] });
  }

  return NextResponse.json({ sponsors: data ?? [] });
}
