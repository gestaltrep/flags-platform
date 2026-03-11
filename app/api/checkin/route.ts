import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const { code, phone, team, tag, serial } = body;

    console.log("CHECKIN START", body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const eventId = "d61cd74b-a259-4c80-b280-446850b4723b";

    // ------------------------------------------------
    // 1 VERIFY TICKET
    // ------------------------------------------------

    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket lookup error", ticketError);
      return Response.json({
        success: false,
        message: "Invalid ticket code"
      });
    }

    if (ticket.claimed) {
      return Response.json({
        success: false,
        message: "Ticket already used"
      });
    }

    console.log("Ticket valid");

    // ------------------------------------------------
    // 2 MARK TICKET CLAIMED
    // ------------------------------------------------

    const { error: claimError } = await supabase
      .from("ticket_codes")
      .update({ claimed: true })
      .eq("id", ticket.id);

    if (claimError) {
      console.error("Ticket update error", claimError);
      return Response.json({
        success: false,
        message: "Ticket update failed"
      });
    }

    console.log("Ticket claimed");

    // ------------------------------------------------
    // 3 FIND EXISTING USER
    // ------------------------------------------------

    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    // ------------------------------------------------
    // 4 CREATE USER IF NEEDED
    // ------------------------------------------------

    if (!user) {

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          phone: phone
        })
        .select()
        .single();

      if (userError) {
        console.error("User insert error", userError);
        return Response.json({
          success: false,
          message: "User creation failed"
        });
      }

      user = newUser;

      console.log("User created");

    } else {

      console.log("Existing user reused");

    }

    // ------------------------------------------------
    // 5 CREATE PLAYER
    // ------------------------------------------------

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        phone: phone,
        gamer_tag: tag,
        team: team,
        event_id: eventId,
        active: true,
        checked_in: true
      })
      .select()
      .single();

    if (playerError) {
      console.error("Player insert error", playerError);
      return Response.json({
        success: false,
        message: "Player creation failed"
      });
    }

    console.log("Player created", player.id);

    // ------------------------------------------------
    // 6 ASSIGN FLAG
    // ------------------------------------------------

    const { error: flagError } = await supabase
      .from("flags")
      .update({
        owner_player_id: player.id,
        current_owner_id: player.id,
        team: team
      })
      .eq("serial_number", serial);

    if (flagError) {
      console.error("Flag update error", flagError);
      return Response.json({
        success: false,
        message: "Flag assignment failed"
      });
    }

    console.log("Flag assigned");

    return Response.json({ success: true });

  } catch (err) {

    console.error("CHECKIN ERROR", err);

    return Response.json({
      success: false,
      message: "Server error"
    });

  }

}