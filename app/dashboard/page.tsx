"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode.react";

export default function Dashboard() {

  const [tickets, setTickets] = useState([]);

  useEffect(() => {

    async function loadTickets() {

      const res = await fetch("/api/tickets");

      const data = await res.json();

      setTickets(data);

    }

    loadTickets();

  }, []);

  return (

    <main style={{maxWidth:700,margin:"40px auto"}}>

      <h1>Your Tickets</h1>

      {tickets.map((ticket:any) => (

        <div key={ticket.id}
          style={{
            border:"1px solid #ccc",
            padding:20,
            marginBottom:20
          }}
        >

          <h2>{ticket.code}</h2>

          <QRCode
            value={`https://flags-platform.vercel.app/checkin?code=${ticket.code}`}
            size={180}
          />

        </div>

      ))}

    </main>

  );

}