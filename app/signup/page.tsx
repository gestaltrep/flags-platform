"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Signup() {

  const [phone,setPhone] = useState("")
  const [code,setCode] = useState("")
  const [gamerTag,setGamerTag] = useState("")
  const [message,setMessage] = useState("")

  const sendCode = async () => {

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone
    })

    if(error){
      setMessage(error.message)
    } else {
      setMessage("Verification code sent")
    }

  }

  const verifyCode = async () => {

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: code,
      type: "sms"
    })

    if(error){
      setMessage(error.message)
      return
    }

    const user = data.user!

    await supabase.from("players").insert({
      id: user.id,
      phone: phone,
      gamer_tag: gamerTag
    })

    setMessage("Account created!")

  }

  return (

    <div style={{padding:40}}>

      <h1>Create Account</h1>

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={(e)=>setPhone(e.target.value)}
      />

      <br/><br/>

      <button onClick={sendCode}>
        Send Code
      </button>

      <br/><br/>

      <input
        placeholder="Verification Code"
        value={code}
        onChange={(e)=>setCode(e.target.value)}
      />

      <br/><br/>

      <input
        placeholder="Gamer Tag"
        value={gamerTag}
        onChange={(e)=>setGamerTag(e.target.value)}
      />

      <br/><br/>

      <button onClick={verifyCode}>
        Create Account
      </button>

      <p>{message}</p>

    </div>

  )
}