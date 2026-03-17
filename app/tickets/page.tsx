"use client";

import { useState } from "react";

export default function Tickets(){

  const [quantity,setQuantity] = useState(1);
  const [loading,setLoading] = useState(false);

  async function buyTickets(){

    setLoading(true);

    const res = await fetch("/api/create-checkout",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ quantity })
    });

    const data = await res.json();

    window.location.href = data.url;

  }

  async function buyVIP(){

    const res = await fetch("/api/create-vip-checkout",{
      method:"POST"
    });

    const data = await res.json();

    window.location.href = data.url;

  }

  return(

    <main
      style={{
        marginTop:120,
        marginLeft:120,
        maxWidth:900
      }}
    >

      <div style={{marginBottom:60}}>

        <div
          style={{
            fontSize:44,
            letterSpacing:6,
            marginBottom:30
          }}
        >
          Access Terminal
        </div>

        <div style={{fontSize:18,letterSpacing:2,lineHeight:1.6}}>

          <div>&gt; CONNECTING TO EVENT NETWORK</div>
          <div>&gt; RETRIEVING ACCESS TIERS</div>
          <div>&gt; ENTRY TOKEN GENERATION AVAILABLE</div>

          <span className="cursor">_</span>

        </div>

      </div>

      <div
        style={{
          border:"1px solid #333",
          padding:30,
          width:420
        }}
      >

        <div style={{marginBottom:20,letterSpacing:2}}>
          TOKEN QUANTITY
        </div>

        <input
          type="number"
          value={quantity}
          min={1}
          max={10}
          onChange={(e)=>setQuantity(Number(e.target.value))}
          style={{
            background:"black",
            border:"1px solid #444",
            color:"white",
            padding:10,
            width:100
          }}
        />

        <div style={{marginTop:30,display:"flex",flexDirection:"column",gap:15}}>

          <button
            className="cta-button"
            onClick={buyTickets}
            disabled={loading}
          >
            {loading ? "CONNECTING..." : "GENERATE ENTRY TOKEN"}
          </button>

          <button
            className="cta-button"
            onClick={buyVIP}
          >
            REQUEST VIP ACCESS
          </button>

        </div>

      </div>

    </main>

  )

}