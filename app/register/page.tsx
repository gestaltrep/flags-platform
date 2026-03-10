"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function RegisterFlag() {

  const [serial,setSerial] = useState("")
  const [message,setMessage] = useState("")
  const [user,setUser] = useState<any>(null)

  useEffect(() => {

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    checkUser()

  }, [])

  const registerFlag = async () => {

    if(!user){
      setMessage("You must be logged in")
      return
    }

    const { error } = await supabase.rpc("register_flag", {
      p_event_id: "PASTE_YOUR_EVENT_ID",
      p_serial: serial
    })

    if(error){
      setMessage(error.message)
    } else {
      setMessage("Flag registered successfully")
    }

  }

  if(!user){
    return (
      <div style={{padding:40}}>
        <h1>You must log in to register a flag</h1>
      </div>
    )
  }

  return (

    <div style={{padding:40}}>

      <h1>Register Flag</h1>

      <input
        placeholder="Enter flag serial"
        value={serial}
        onChange={(e)=>setSerial(e.target.value)}
        style={{padding:10,fontSize:18}}
      />

      <br/><br/>

      <button onClick={registerFlag} style={{padding:10,fontSize:18}}>
        Register Flag
      </button>

      <p>{message}</p>

    </div>

  )
}