"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Leaderboard(){

const [players,setPlayers] = useState<any[]>([])

const loadLeaderboard = async () => {

const { data, error } = await supabase
.from("leaderboard")
.select("*")

if(data){
setPlayers(data)
}

}

useEffect(()=>{
loadLeaderboard()
},[])

return (

<div style={{padding:40}}>

<h1>Leaderboard</h1>

<table>

<thead>

<tr>
<th>Player</th>
<th>Flags</th>
<th>Stake</th>
</tr>

</thead>

<tbody>

{players.map((p,i)=>(

<tr key={i}>
<td>{p.gamer_tag}</td>
<td>{p.flags_stolen}</td>
<td>{p.total_stake}</td>
</tr>

))}

</tbody>

</table>

</div>

)

}