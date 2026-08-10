import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { WAIVER_BODY, WAIVER_VERSION } from "@/lib/waiver";
import { getLiveEvent } from "@/lib/events";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type SupabaseAdmin = ReturnType<typeof admin>;

/** Staff bearer token -> checkin_tokens row, or null. */
async function authStaff(req: Request, supabase: SupabaseAdmin) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const staffToken = authHeader.slice(7).trim();
  if (!staffToken) return null;

  const { data } = await supabase
    .from("checkin_tokens")
    .select("id")
    .eq("token", staffToken)
    .is("revoked_at", null)
    .maybeSingle();

  return data ? { id: data.id as string, token: staffToken } : null;
}

/**
 * Server-side count of under-21 admissions for the live event. Counts every
 * admitted token including comps — this is the venue settlement input.
 */
async function under21Count(supabase: SupabaseAdmin): Promise<number> {
  const live = await getLiveEvent();
  if (!live) return 0;

  const { count } = await supabase
    .from("ticket_codes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", live.id)
    .eq("claimed", true)
    .eq("admitted_under_21", true);

  return count ?? 0;
}

/** Scanner screen reads the running under-21 tally here so it survives a refresh. */
export async function GET(req: Request) {
  const supabase = admin();

  const staff = await authStaff(req, supabase);
  if (!staff) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ success: true, under_21_count: await under21Count(supabase) });
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const staff = await authStaff(req, supabase);
    if (!staff) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const tokenData = { id: staff.id };
    const staffToken = staff.token;

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const waiverAccepted = body.waiver_accepted === true;
    const ageBracket = body.age_bracket;

    if (!code) {
      return Response.json({ success: false, message: "No code provided." }, { status: 400 });
    }

    if (!waiverAccepted) {
      return Response.json({ success: false, message: "Waiver not accepted." }, { status: 400 });
    }

    if (ageBracket !== "over_21" && ageBracket !== "under_21") {
      return Response.json({ success: false, message: "Age bracket required." }, { status: 400 });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, code, claimed, refunded_at, event_id, buyer_user_id, claimed_by_user")
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

    const { data: claimedRows, error: ticketUpdateError } = await supabase
      .from("ticket_codes")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        admitted_under_21: ageBracket === "under_21",
      })
      .eq("id", ticket.id)
      .eq("claimed", false)
      .select("id");

    if (ticketUpdateError) {
      console.error("Ticket update error:", ticketUpdateError);
      return Response.json({ success: false, message: "Ticket claim failed." }, { status: 500 });
    }

    if (!claimedRows || claimedRows.length === 0) {
      return Response.json({ success: false, message: "Ticket already used." }, { status: 409 });
    }

    await supabase
      .from("checkin_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", staffToken);

    // Waiver record — write after successful claim; never block entry on audit failure
    try {
      const holderId = ticket.claimed_by_user || ticket.buyer_user_id;
      let holderName: string | null = null;
      let holderPhone: string | null = null;

      if (holderId) {
        const { data: userData } = await supabase
          .from("users")
          .select("name, phone")
          .eq("id", holderId)
          .maybeSingle();

        if (userData) {
          holderName = userData.name ?? null;
          holderPhone = userData.phone ?? null;
        }
      }

      const waiverHash = createHash("sha256").update(WAIVER_BODY).digest("hex");

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;
      const ua = req.headers.get("user-agent") || null;

      await supabase.from("waiver_acceptances").insert({
        ticket_code_id: ticket.id,
        ticket_code: ticket.code,
        event_id: ticket.event_id,
        user_id: holderId || null,
        holder_name: holderName,
        holder_phone: holderPhone,
        waiver_version: WAIVER_VERSION,
        waiver_text: WAIVER_BODY,
        waiver_text_sha256: waiverHash,
        checked_in_by_token_id: tokenData.id,
        ip_address: ip,
        user_agent: ua,
      });
    } catch (waiverErr) {
      console.error("WAIVER INSERT FAILED for ticket", code, waiverErr);
    }

    return Response.json({
      success: true,
      ticket_code: code,
      admitted_under_21: ageBracket === "under_21",
      under_21_count: await under21Count(supabase),
    });
  } catch (err) {
    console.error("CHECKIN ERROR", err);
    return Response.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
