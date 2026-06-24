import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ReactNode } from "react";

export const metadata = {
  title: "RAVE_Initiation.html",
  description: "May 30 | Charlotte County Fair | Yheti b2b~ Toadface, RAFEEKI, Palpa, Omnichroma, KRiMSUN, Like Butter, DOM | GA, VIP sold in Terminal",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* B4: LQIP preload — unblocks canvas start before full lineup loads */}
        <link rel="preload" as="image" href="/lineup_hero_lqip.webp" type="image/webp" fetchPriority="high" />
      </head>
      <body>

        <Navbar />

        <div style={{ minHeight: '460px' }}>
          {children}
        </div>
        <Footer />

      </body>
    </html>
  );

}
