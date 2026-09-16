import { createClient } from "@supabase/supabase-js";
import { getOperativeEvent } from "@/lib/events";

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

    const { code } = await req.json();

    if (!code) {
      return Response.json({ success: false, message: "No code provided." }, { status: 400 });
    }

    const { data: ticket, error } = await supabase
      .from("ticket_codes")
      .select("id, code, claimed, refunded_at, buyer_user_id, claimed_by_user, is_vip, is_table, event_id")
      .eq("code", code)
      .maybeSingle();

    if (error || !ticket) {
      return Response.json({ success: false, message: "Token not found." }, { status: 404 });
    }

    /**
     * Scope the door to the event it is actually running.
     *
     * Without this a code validates on the strength of existing, which lets any
     * unclaimed token from any past event through this door — 27 of them are
     * outstanding from event one alone. Checked before refunded and claimed on
     * purpose: a ticket for another event is not "already used" here, and the
     * reason on the scanner should say what is actually wrong with it.
     *
     * No operative event means nothing can be admitted. Failing closed is the
     * only safe direction — the alternative is admitting everything.
     */
    const operative = await getOperativeEvent();

    if (!operative) {
      return Response.json(
        { success: false, message: "No event is currently open for check-in." },
        { status: 409 }
      );
    }

    if (ticket.event_id !== operative.id) {
      return Response.json(
        { success: false, message: "This ticket is for a different event." },
        { status: 409 }
      );
    }

    if (ticket.refunded_at) {
      return Response.json(
        { success: false, message: "Ticket has been refunded and is no longer valid for entry." },
        { status: 409 }
      );
    }

    if (ticket.claimed) {
      return Response.json({ success: false, message: "Token already used." }, { status: 409 });
    }

    const holderId = ticket.claimed_by_user || ticket.buyer_user_id;
    let holder: { name: string | null; phone: string | null } | null = null;

    if (holderId) {
      const { data: userData } = await supabase
        .from("users")
        .select("name, phone")
        .eq("id", holderId)
        .maybeSingle();

      if (userData) {
        holder = { name: userData.name ?? null, phone: userData.phone ?? null };
      }
    }

    return Response.json({
      success: true,
      ticket: {
        id: ticket.id,
        code: ticket.code,
        is_vip: !!ticket.is_vip,
        is_table: !!ticket.is_table,
        buyer_user_id: ticket.buyer_user_id,
        claimed_by_user: ticket.claimed_by_user,
        holder,
      },
    });
  } catch (err) {
    console.error("SCAN TICKET ERROR:", err);
    return Response.json({ success: false, message: "Validation failed." }, { status: 500 });
  }
}
