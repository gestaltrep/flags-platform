"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Ticket = {
  code: string;
};

export default function TerminalClient(){

const [tickets,setTickets] = useState<Ticket[]>([]);
const [loading,setLoading] = useState(true);

const [tier,setTier] = useState(1);
const [sold,setSold] = useState(0);
const [vipSold,setVipSold] = useState(0);

const [terminalLines,setTerminalLines] = useState<string[]>([]);

const [bootDone,setBootDone] = useState(false);
const [tierVisible,setTierVisible] = useState(false);
const [entryVisible,setEntryVisible] = useState(false);
const [buttonsVisible,setButtonsVisible] = useState(false);

const [purchaseOpen,setPurchaseOpen] = useState(false);
const [vipOpen,setVipOpen] = useState(false);

const bootScript = [
"> INITIALIZING SESSION",
"> AUTHENTICATING USER",
"> CONNECTING TO ARCHIVE",
"> ACCESS CONFIRMED",
"> SESSION STATUS: OPEN",
"> DISPLAYING ENTRY CODES"
];

async function loadTickets(){

try{

const res = await fetch("/api/tickets");
const data = await res.json();

setTickets(data || []);

}catch(err){

console.error(err);
setTickets([]);

}

setLoading(false);

}

async function loadTier(){

try{

const res = await fetch("/api/tier-status");
const data = await res.json();

setTier(data.tier);
setSold(data.sold);
setVipSold(data.vipSold || 0);

}catch(err){

console.error(err);

}

}

/* ---------------- BOOT SEQUENCE ---------------- */

useEffect(()=>{

setTerminalLines([]);
setBootDone(false);
setTierVisible(false);
setEntryVisible(false);
setButtonsVisible(false);

loadTickets();
loadTier();

let i = 0;

const interval = setInterval(()=>{

setTerminalLines(prev=>[...prev,bootScript[i]]);
i++;

if(i === bootScript.length){

clearInterval(interval);

setTimeout(()=>{

setBootDone(true);
setTierVisible(true);

},400);

setTimeout(()=>{

setEntryVisible(true);

},800);

setTimeout(()=>{

setButtonsVisible(true);

},1200);

}

},350);

return ()=>clearInterval(interval);

},[]);

/* ---------------- PROGRESS BARS ---------------- */

function tierBar(){

const percent = sold / 1000;
const filled = Math.floor(percent * 20);

return "█".repeat(filled) + "░".repeat(20-filled);

}

function vipBar(){

const percent = vipSold / 150;
const filled = Math.floor(percent * 20);

return "█".repeat(filled) + "░".repeat(20-filled);

}

function tierColor(t:number){

if(t===tier) return "#fff";
return "#555";

}

/* ---------------- UI ---------------- */

return(

<main style={{marginTop:120,marginLeft:120,maxWidth:1100}}>

<div style={{
display:"grid",
gridTemplateColumns:"520px 1fr",
gap:80,
alignItems:"start"
}}>

{/* LEFT COLUMN */}

<div>

<div style={{fontSize:30,letterSpacing:6,marginBottom:25}}>
Terminal
</div>

<div style={{
border:"1px solid #888",
padding:20,
fontSize:13,
letterSpacing:1.4,
lineHeight:1.7,
width:520
}}>

{terminalLines.map((line,i)=>(
<div key={i}>{line}</div>
))}

{!bootDone && <span className="cursor">_</span>}

</div>

{tierVisible && (

<div style={{
border:"1px solid #888",
borderTop:"none",
padding:20,
fontSize:13,
letterSpacing:1.6,
lineHeight:1.8,
width:520
}}>

<div style={{marginBottom:8}}>TOKENS</div>

<div style={{display:"flex",gap:20,fontSize:12,marginBottom:6}}>

<span style={{color:tierColor(1)}}>TIER 1</span>
<span style={{color:tierColor(2)}}>TIER 2</span>
<span style={{color:tierColor(3)}}>TIER 3</span>

</div>

<div style={{fontSize:14}}>
{tierBar().slice(0,6)}
{"│"}
{tierBar().slice(6,13)}
{"│"}
{tierBar().slice(13)}
</div>

<div style={{marginTop:16}}>VIP TOKENS</div>

<div style={{fontSize:14}}>
{vipBar()}
</div>

</div>

)}

</div>

{/* RIGHT COLUMN */}

<div>

<div style={{
fontSize:26,
letterSpacing:6,
marginBottom:20
}}>
Entry Tokens
</div>

{/* WAIT FOR BOOT + TIER */}

{!entryVisible && (

<div style={{fontSize:13,letterSpacing:2}}>
Loading...
</div>

)}

{entryVisible && tickets.length===0 && (

<div style={{fontSize:13,letterSpacing:2}}>
{">"} USER HAS NO ENTRY TOKENS
</div>

)}

{buttonsVisible && (

<div style={{marginTop:20}}>

<button
className="cta-button"
style={{width:260,fontSize:14,marginBottom:12}}
onClick={()=>setPurchaseOpen(true)}
>
GENERATE TOKENS
</button>

<button
className="cta-button"
style={{width:260,fontSize:14}}
onClick={()=>setVipOpen(true)}
>
GENERATE VIP TOKENS
</button>

</div>

)}

{entryVisible && tickets.length>0 && (

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
gap:30,
marginTop:20
}}>

{tickets.map((ticket,index)=>(

<div key={index} style={{
border:"1px solid #555",
padding:18
}}>

<QRCodeSVG
value={`${window.location.origin}/checkin?code=${ticket.code}`}
size={140}
/>

<div style={{
marginTop:10,
fontSize:12,
letterSpacing:2
}}>
TOKEN CODE
</div>

<div style={{
fontSize:18,
letterSpacing:2
}}>
{ticket.code}
</div>

</div>

))}

</div>

)}

</div>

</div>

</main>

);

}