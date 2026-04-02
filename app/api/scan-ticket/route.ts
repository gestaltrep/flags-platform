import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return Response.json({ success: false, message: "No code provided." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket, error } = await supabase
      .from("ticket_codes")
      .select("id, code, claimed, buyer_user_id, vip, is_vip, event_id")
      .eq("event_id", EVENT_ID)
      .eq("code", code)
      .maybeSingle();

    if (error || !ticket) {
      return Response.json({ success: false, message: "Token not found." }, { status: 404 });
    }

    if (ticket.claimed) {
      return Response.json({ success: false, message: "Token already used." }, { status: 409 });
    }

    return Response.json({
      success: true,
      ticket: {
        id: ticket.id,
        code: ticket.code,
        vip: !!(ticket.is_vip || ticket.vip),
        buyer_user_id: ticket.buyer_user_id,
      },
    });
  } catch (err) {
    console.error("SCAN TICKET ERROR:", err);
    return Response.json({ success: false, message: "Validation failed." }, { status: 500 });
  }
}