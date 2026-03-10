"use client";

import { useState } from "react";

export default function Register() {

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function buyTickets() {

    try {

      setLoading(true);

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

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        alert("Checkout failed. Check console for details.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data.url) {
        console.error("Missing checkout URL:", data);
        alert("Checkout session failed.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;

    } catch (err) {

      console.error("Checkout error:", err);
      alert("Error connecting to checkout.");

    } finally {
      setLoading(false);
    }

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
        disabled={loading}
        style={{fontSize:20,padding:"12px 20px"}}
      >
        {loading ? "Creating Checkout..." : "Buy Tickets"}
      </button>

    </main>
  );
}