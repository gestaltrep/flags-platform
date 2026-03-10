"use client";

import { useState } from "react";

export default function Checkin() {
  const [form, setForm] = useState({
    phone: "",
    gamerTag: "",
    team: "",
    serial: ""
  });

  async function submit(e: any) {
    e.preventDefault();

    await fetch("/api/checkin", {
      method: "POST",
      body: JSON.stringify(form)
    });

    alert("Check-in complete!");
  }

  return (
    <main style={{maxWidth:600, margin:"40px auto"}}>
      <h1>Event Check-In</h1>

      <form onSubmit={submit}>

        <input
          placeholder="Phone Number"
          onChange={(e)=>setForm({...form, phone:e.target.value})}
        />

        <input
          placeholder="Gamer Tag"
          onChange={(e)=>setForm({...form, gamerTag:e.target.value})}
        />

        <select
          onChange={(e)=>setForm({...form, team:e.target.value})}
        >
          <option value="">Select Team</option>
          <option value="black">Black</option>
          <option value="white">White</option>
        </select>

        <input
          placeholder="Ticket Serial Number"
          onChange={(e)=>setForm({...form, serial:e.target.value})}
        />

        <button type="submit">Check In</button>

      </form>
    </main>
  );
}