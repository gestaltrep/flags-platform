import "./globals.css";
import Navbar from "./components/Navbar";
import { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <html lang="en">
      <body>

        <Navbar />

        {children}

        <div className="home-help-text">HELP: support.signoresearchgroup@gmail.com</div>

      </body>
    </html>
  );

}
