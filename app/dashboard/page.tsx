import { cookies } from "next/headers";
import TerminalClient from "./TerminalClient";

export default async function Dashboard() {

  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id");

  if (!userId) {

    return (

      <main
        style={{
          marginTop:120,
          marginLeft:120
        }}
      >

        <div
          style={{
            fontSize:44,
            letterSpacing:6,
            marginBottom:40
          }}
        >
          Terminal
        </div>

        <div
          style={{
            fontSize:18,
            letterSpacing:2,
            lineHeight:1.6
          }}
        >

          <div>{">"} AUTHENTICATION FAILURE</div>

          <br/>

          <div>{">"} UNAUTHORIZED ACCESS</div>

          <br/>

          <div>{">"} PARTICIPANT REGISTRATION REQUIRED</div>

          <div>
            {">"} REQUEST PARTICIPATION TO OBTAIN TERMINAL ACCESS
          </div>

          <span className="cursor">_</span>

        </div>

      </main>

    );

  }

  return <TerminalClient />;

}