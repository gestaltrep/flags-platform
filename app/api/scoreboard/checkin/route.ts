import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {

  const body = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { phone, gamerTag, team, serial } = body;

  // find user
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  // create user if needed
  if (!user) {
    const { data } = await supabase
      .from("users")
      .insert({ phone })
      .select()
      .single();

    user = data;
  }

  // create player
  const { data: player } = await supabase
    .from("players")
    .insert({
      phone,
      gamer_tag: gamerTag
    })
    .select()
    .single();

  // find flag
  const { data: flag } = await supabase
    .from("flags")
    .select("*")
    .eq("serial_number", serial)
    .single();

  // assign flag
  await supabase
    .from("flags")
    .update({
      owner_player_id: player.id,
      current_owner_id: player.id,
      team
    })
    .eq("id", flag.id);

  return Response.json({ success: true });
}