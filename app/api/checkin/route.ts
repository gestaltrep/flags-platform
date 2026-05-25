import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const staffToken = authHeader.slice(7).trim();
    if (!staffToken) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tokenData } = await supabase
      .from("checkin_tokens")
      .select("id")
      .eq("token", staffToken)
      .is("revoked_at", null)
      .maybeSingle();

    if (!tokenData) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code) {
      return Response.json({ success: false, message: "No code provided." }, { status: 400 });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, code, claimed, refunded_at, event_id")
      .eq("event_id", EVENT_ID)
      .eq("code", code)
      .maybeSingle();

    if (ticketError || !ticket) {
      return Response.json({ success: false, message: "Invalid ticket." }, { status: 404 });
    }

    if (ticket.refunded_at) {
      return Response.json(
        { success: false, message: "Ticket has been refunded and is no longer valid for entry." },
        { status: 409 }
      );
    }

    if (ticket.claimed) {
      return Response.json({ success: false, message: "Ticket already used." }, { status: 409 });
    }

    const { error: ticketUpdateError } = await supabase
      .from("ticket_codes")
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq("id", ticket.id)
      .eq("claimed", false);

    if (ticketUpdateError) {
      console.error("Ticket update error:", ticketUpdateError);
      return Response.json({ success: false, message: "Ticket claim failed." }, { status: 500 });
    }

    await supabase
      .from("checkin_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", staffToken);

    return Response.json({ success: true, ticket_code: code });
  } catch (err) {
    console.error("CHECKIN ERROR", err);
    return Response.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
