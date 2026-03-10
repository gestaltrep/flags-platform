"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function StealFlag() {

  const [serial,setSerial] = useState("")
  const [message,setMessage] = useState("")

  const submitSteal = async () => {

    const { data, error } = await supabase.rpc("steal_flag", {
      p_event_id: "d61cd74b-a259-4c80-b280-446850b4723b",
      p_stolen_serial: serial
    })

    if(error){
      setMessage(error.message)
    } else {
      setMessage(data)
    }

  }

  return (

    <div style={{padding:40}}>

      <h1>Submit Stolen Flag</h1>

      <input
        placeholder="Enter stolen flag serial"
        value={serial}
        onChange={(e)=>setSerial(e.target.value)}
        style={{padding:10,fontSize:18}}
      />

      <br/><br/>

      <button
        onClick={submitSteal}
        style={{padding:10,fontSize:18}}
      >
        Submit Steal
      </button>

      <p>{message}</p>

    </div>

  )
}