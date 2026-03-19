import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function POST(req: Request) {
  const { code } = await req.json();

  if (!code) {
    return Response.json({ message: "No code provided." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const scannerUserId = cookieStore.get("user_id")?.value ?? null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ticket, error: fetchError } = await supabase
    .from("ticket_codes")
    .select("id, code, claimed")
    .eq("event_id", EVENT_ID)
    .eq("code", code)
    .maybeSingle();

  if (fetchError || !ticket) {
    return Response.json({ message: "Token not found." }, { status: 404 });
  }

  if (ticket.claimed) {
    return Response.json({ message: "Token already used." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("ticket_codes")
    .update({
      claimed: true,
      claimed_at: new Date().toISOString(),
      claimed_by_user: scannerUserId,
    })
    .eq("id", ticket.id);

  if (updateError) {
    console.error("Check-in update error:", updateError);
    return Response.json({ message: "Check-in failed." }, { status: 500 });
  }

  return Response.json({ message: "Entry confirmed." });
}