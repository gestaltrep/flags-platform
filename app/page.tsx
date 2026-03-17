"use client";

import { useState } from "react";

export default function Home() {

  const [open,setOpen] = useState(false);

  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");

  const [step,setStep] = useState("form");
  const [code,setCode] = useState("");

  async function sendVerification(){

    if(!name || !phone){
      alert("Please enter name and phone number");
      return;
    }

    try{

      await fetch("/api/send-code",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          name,
          phone
        })
      });

      setStep("verify");

    }catch(err){

      console.error("verification failed",err);

    }

  }

  async function verifyCode(){

    try{

      const res = await fetch("/api/verify-code",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          phone,
          code
        })
      });

      const data = await res.json();

      if(data.success){

        alert("Verification successful");

        setOpen(false);

      }else{

        alert("Invalid code");

      }

    }catch(err){

      console.error("verification error",err);

    }

  }

  return (

    <>

      {/* HERO SECTION */}

      <div className="hero">

        <img
          src="/poster-image.png"
          className="facility-image"
        />

        <div className="event-info">

          <div className="event-date">May 30</div>

          <div className="event-time">5 PM – 5 AM</div>

          <div className="event-location">Immokalee, FL</div>

          <button
            className="cta-button"
            onClick={()=>setOpen(true)}
          >
            REQUEST PARTICIPATION
          </button>

        </div>

      </div>


      {/* SIGNUP MODAL */}

      {open && (

        <div className="signup-overlay">

          <div className="signup-modal">

            <div className="signup-header">

              <img
                src="/logo.png"
                className="signup-logo"
              />

              <img
                src="/group-name.png"
                className="signup-group-name"
              />

            </div>


            {/* STEP 1 — FORM */}

            {step === "form" && (

              <>

                <div className="signup-title">
                  Participant Registration
                </div>

                <input
                  placeholder="Name"
                  className="signup-input"
                  value={name}
                  onChange={(e)=>setName(e.target.value)}
                />

                <input
                  placeholder="Phone Number"
                  className="signup-input"
                  value={phone}
                  onChange={(e)=>setPhone(e.target.value)}
                />

                <div className="signup-checkbox">

                  <input type="checkbox"/>

                  <span>
                    I agree to the <a href="/terms">Terms & Conditions</a>
                  </span>

                </div>

                <div className="signup-checkbox">

                  <input type="checkbox"/>

                  <span>
                    I agree to the <a href="/privacy">Privacy Policy</a>
                  </span>

                </div>

                <button
                  className="signup-submit"
                  onClick={sendVerification}
                >
                  SEND VERIFICATION CODE
                </button>

              </>

            )}


            {/* STEP 2 — CODE ENTRY */}

            {step === "verify" && (

              <>

                <div className="signup-title">
                  Enter Verification Code
                </div>

                <input
                  placeholder="6 digit code"
                  className="signup-input"
                  value={code}
                  onChange={(e)=>setCode(e.target.value)}
                />

                <button
                  className="signup-submit"
                  onClick={verifyCode}
                >
                  VERIFY
                </button>

              </>

            )}


            <button
              className="signup-close"
              onClick={()=>setOpen(false)}
            >
              CANCEL
            </button>

          </div>

        </div>

      )}

    </>

  );

}