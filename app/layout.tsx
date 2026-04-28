import "./globals.css";
import Navbar from "./components/Navbar";
import { ReactNode } from "react";

export const metadata = {
  title: "RAVE_Initiation.html",
  description: "May 30 | Charlotte County Fair | Yheti b2b~ Toadface, RAFEEKI, Palpa, Omnichroma, KRiMSUN, Like Butter, DOM | GA, VIP, VIP tables sold in Terminal",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <html lang="en">
      <body>

        <Navbar />

        <div style={{ minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </div>
        <div className="global-help-text">HELP: support.signoresearchgroup@gmail.com</div>

      </body>
    </html>
  );

}
