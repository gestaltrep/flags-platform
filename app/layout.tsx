import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ReactNode } from "react";

export const metadata = {
  title: "Signo Research Group — Electronic Music Event Ticketing",
  description: "Signo Research Group is a ticketing platform for electronic music events in Southwest Florida. We send event updates, ticketing information, and announcements by SMS to members who opt in.",
  openGraph: {
    title: "Signo Research Group — Electronic Music Event Ticketing",
    description: "Signo Research Group is a ticketing platform for electronic music events in Southwest Florida. We send event updates, ticketing information, and announcements by SMS to members who opt in.",
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
        {/* Hero poster preload — the LCP element, and the glitch canvas draws
            against it before the video is ready. */}
        <link rel="preload" as="image" href="/hero_poster.webp" type="image/webp" fetchPriority="high" />
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
