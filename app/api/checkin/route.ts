import { createClient } from "@supabase/supabase-js";

const EVENT_ID = "d61cd74b-a259-4c80-b280-446850b4723b";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

function normalizeTag(tag: string) {
  return tag.trim();
}

function normalizeSerial(serial: string) {
  return serial.trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const code = String(body.code || "").trim().toUpperCase();
    const phone = normalizePhone(String(body.phone || ""));
    const team = String(body.team || "").trim().toLowerCase();
    const tag = normalizeTag(String(body.tag || ""));
    const serial = normalizeSerial(String(body.serial || ""));

    if (!code || !phone || !team || !tag || !serial) {
      return Response.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    if (!["black", "white"].includes(team)) {
      return Response.json(
        { success: false, message: "Team must be black or white." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("id, code, claimed, buyer_user_id, event_id")
      .eq("event_id", EVENT_ID)
      .eq("code", code)
      .maybeSingle();

    if (ticketError || !ticket) {
      return Response.json(
        { success: false, message: "Invalid ticket." },
        { status: 404 }
      );
    }

    if (ticket.claimed) {
      return Response.json(
        { success: false, message: "Ticket already used." },
        { status: 409 }
      );
    }

    let { data: user, error: userLookupError } = await supabase
      .from("users")
      .select("id, phone, name, phone_verified")
      .eq("phone", phone)
      .maybeSingle();

    if (userLookupError) {
      console.error("User lookup error:", userLookupError);
      return Response.json(
        { success: false, message: "User lookup failed." },
        { status: 500 }
      );
    }

    if (!user) {
      const { data: newUser, error: newUserError } = await supabase
        .from("users")
        .insert({
          phone,
          phone_verified: false,
        })
        .select("id, phone, name, phone_verified")
        .single();

      if (newUserError || !newUser) {
        console.error("User insert error:", newUserError);
        return Response.json(
          { success: false, message: "Could not create user." },
          { status: 500 }
        );
      }

      user = newUser;
    }

    const { data: tagConflict, error: tagConflictError } = await supabase
      .from("players")
      .select("id, gamer_tag")
      .eq("gamer_tag", tag)
      .neq("id", user.id)
      .maybeSingle();

    if (tagConflictError) {
      console.error("Tag conflict lookup error:", tagConflictError);
      return Response.json(
        { success: false, message: "Could not validate gamer tag." },
        { status: 500 }
      );
    }

    if (tagConflict) {
      return Response.json(
        { success: false, message: "Gamer tag is already in use." },
        { status: 409 }
      );
    }

    const { data: flag, error: flagLookupError } = await supabase
      .from("flags")
      .select("id, serial_number, team, status, owner_player_id, current_owner_id, event_id")
      .eq("event_id", EVENT_ID)
      .eq("serial_number", serial)
      .maybeSingle();

    if (flagLookupError) {
      console.error("Flag lookup error:", flagLookupError);
      return Response.json(
        { success: false, message: "Flag lookup failed." },
        { status: 500 }
      );
    }

    if (!flag) {
      return Response.json(
        { success: false, message: "Flag serial not found." },
        { status: 404 }
      );
    }

    if (flag.team !== team) {
      return Response.json(
        { success: false, message: `Flag belongs to ${flag.team.toUpperCase()} team.` },
        { status: 409 }
      );
    }

    if (
      (flag.owner_player_id && flag.owner_player_id !== user.id) ||
      (flag.current_owner_id && flag.current_owner_id !== user.id)
    ) {
      return Response.json(
        { success: false, message: "Flag is already assigned." },
        { status: 409 }
      );
    }

    if (!user.phone_verified) {
      return Response.json({
        success: true,
        needsVerification: true,
        message: "Verification required before check-in.",
      });
    }

    let { data: player, error: playerLookupError } = await supabase
      .from("players")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (playerLookupError) {
      console.error("Player lookup error:", playerLookupError);
      return Response.json(
        { success: false, message: "Player lookup failed." },
        { status: 500 }
      );
    }

    if (!player) {
      const { data: newPlayer, error: playerInsertError } = await supabase
        .from("players")
        .insert({
          id: user.id,
          phone,
          gamer_tag: tag,
          team,
          event_id: EVENT_ID,
          active: true,
          checked_in: true,
        })
        .select()
        .single();

      if (playerInsertError || !newPlayer) {
        console.error("Player insert error:", playerInsertError);
        return Response.json(
          { success: false, message: "Player creation failed." },
          { status: 500 }
        );
      }

      player = newPlayer;
    } else {
      const { data: updatedPlayer, error: playerUpdateError } = await supabase
        .from("players")
        .update({
          phone,
          gamer_tag: tag,
          team,
          event_id: EVENT_ID,
          active: true,
          checked_in: true,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (playerUpdateError || !updatedPlayer) {
        console.error("Player update error:", playerUpdateError);
        return Response.json(
          { success: false, message: "Player update failed." },
          { status: 500 }
        );
      }

      player = updatedPlayer;
    }

    const { error: flagUpdateError } = await supabase
      .from("flags")
      .update({
        owner_player_id: player.id,
        current_owner_id: player.id,
        status: "active",
      })
      .eq("id", flag.id);

    if (flagUpdateError) {
      console.error("Flag update error:", flagUpdateError);
      return Response.json(
        { success: false, message: "Flag assignment failed." },
        { status: 500 }
      );
    }

    const { error: ticketUpdateError } = await supabase
      .from("ticket_codes")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_user: user.id,
      })
      .eq("id", ticket.id)
      .eq("claimed", false);

    if (ticketUpdateError) {
      console.error("Ticket update error:", ticketUpdateError);
      return Response.json(
        { success: false, message: "Ticket claim failed." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Check-in complete.",
      player: {
        id: player.id,
        gamer_tag: player.gamer_tag,
        team: player.team,
      },
    });
  } catch (err) {
    console.error("CHECKIN ERROR", err);
    return Response.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}