import { supabase } from "@/lib/supabaseClient"

export async function GET() {

  const { data: teams } = await supabase
    .from("team_score")
    .select("*")

  const { data: leaders } = await supabase
    .from("leaderboard")
    .select("*")
    .order("flags_stolen", { ascending: false })
    .limit(10)

  return Response.json({
    teams,
    leaders
  })

}