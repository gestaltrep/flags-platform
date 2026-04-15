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

        <div style={{ minHeight: '100vh' }}>
          {children}
        </div>
        <div className="global-help-text">HELP: support.signoresearchgroup@gmail.com</div>

      </body>
    </html>
  );

}
