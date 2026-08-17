import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ReactNode } from "react";

export const metadata = {
  title: "RAVE_Exp_1.html — Signo Research Group",
  description: "September 26 | Disco Bean Coffee Company | Sunken Frequencies, JuLo, Lemon Tech, Dada Cricket, Oxidose | GA tokens in Terminal",
  openGraph: {
    title: "RAVE_Exp_1.html — Signo Research Group",
    description: "September 26 | Disco Bean Coffee Company | Sunken Frequencies, JuLo, Lemon Tech, Dada Cricket, Oxidose | GA tokens in Terminal",
    siteName: "Signo Research Group",
    type: "website",
    url: "https://signoresearchgroup.com",
  },
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
