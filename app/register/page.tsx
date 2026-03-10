"use client";

import { useState } from "react";

export default function Register() {

  const [quantity, setQuantity] = useState(1);

  async function buyTickets() {

    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantity: quantity,
        userId: "test-user"
      })
    });

    const data = await res.json();

    window.location.href = data.url;
  }

  return (
    <main style={{maxWidth:600,margin:"40px auto"}}>

      <h1>Event Tickets</h1>

      <p>Select how many tickets you want to purchase.</p>

      <input
        type="number"
        value={quantity}
        min={1}
        max={10}
        onChange={(e)=>setQuantity(Number(e.target.value))}
        style={{fontSize:20,padding:10,width:100}}
      />

      <br/><br/>

      <button
        onClick={buyTickets}
        style={{fontSize:20,padding:"12px 20px"}}
      >
        Buy Tickets
      </button>

    </main>
  );
}