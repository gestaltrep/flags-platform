"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Checkin() {

  const params = useSearchParams();
  const code = params.get("code");

  const [phone,setPhone] = useState("");
  const [team,setTeam] = useState("black");
  const [tag,setTag] = useState("");
  const [serial,setSerial] = useState("");

  async function submit(){

    const res = await fetch("/api/checkin",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        code: code,
        phone: phone,
        team: team,
        tag: tag,
        serial: serial
      })
    });

    const data = await res.json();

    if(data.success){
      alert("Check-in complete");
    }else{
      alert(data.message || "Check-in failed");
    }

  }

  return(

    <main style={{maxWidth:600,margin:"40px auto"}}>

      <h1>Event Check-In</h1>

      <p>Ticket Code: {code}</p>

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={e=>setPhone(e.target.value)}
      />

      <br/><br/>

      <input
        placeholder="Gamer Tag"
        value={tag}
        onChange={e=>setTag(e.target.value)}
      />

      <br/><br/>

      <input
        placeholder="Flag Serial"
        value={serial}
        onChange={e=>setSerial(e.target.value)}
      />

      <br/><br/>

      <select value={team} onChange={e=>setTeam(e.target.value)}>
        <option value="black">Black</option>
        <option value="white">White</option>
      </select>

      <br/><br/>

      <button onClick={submit}>
        Check In
      </button>

    </main>

  );

}