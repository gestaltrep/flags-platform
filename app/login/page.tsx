"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Login() {

  const [phone,setPhone] = useState("")
  const [message,setMessage] = useState("")

  const login = async () => {

  let formattedPhone = phone.trim()

  // Remove spaces, dashes, parentheses
  formattedPhone = formattedPhone.replace(/\D/g, "")

  // Add +1 if user entered a 10 digit US number
  if(formattedPhone.length === 10){
    formattedPhone = "+1" + formattedPhone
  }

  // If user already included country code
  if(formattedPhone.length === 11 && formattedPhone.startsWith("1")){
    formattedPhone = "+" + formattedPhone
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone
  })

  if(error){
    setMessage(error.message)
  } else {
    setMessage("Check your phone for login code")
  }

}

  return (

    <div style={{padding:40}}>

      <h1>Player Login</h1>

      <input
        placeholder="Enter phone number"
        value={phone}
        onChange={(e)=>setPhone(e.target.value)}
        style={{padding:10,fontSize:18}}
      />

      <br/><br/>

      <button onClick={login} style={{padding:10,fontSize:18}}>
        Send Login Code
      </button>

      <p>{message}</p>

    </div>

  )
}