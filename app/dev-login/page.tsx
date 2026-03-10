"use client"

import { supabase } from "@/lib/supabaseClient"

export default function DevLogin() {

  const login = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email: "dev@flags.test",
      password: "devpassword123"
    })

    if(error){
      alert(error.message)
    } else {
      alert("Logged in!")
    }

  }

  return (
    <div style={{padding:40}}>
      <h1>Developer Login</h1>

      <button onClick={login} style={{padding:10,fontSize:18}}>
        Login as Dev User
      </button>
    </div>
  )
}