"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  // Carry a preview key across navigation so a preview session stays inside
  // itself. Read after mount from the URL the visitor already has, so server
  // markup is untouched and no page needs a Suspense boundary. Every
  // destination re-validates the key server-side; a wrong one lands on the
  // normal unauthorized screen.
  const [previewQuery, setPreviewQuery] = useState("");

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    setPreviewQuery(key ? `?key=${encodeURIComponent(key)}` : "");
  }, [pathname]);

  const terminalHref = `/dashboard${previewQuery}`;
  const recordsHref = `/records${previewQuery}`;

  const hideNavbarCompletely =
    pathname?.startsWith("/claim") || pathname === "/checkin";

  const hideNavLinks =
    pathname === "/signup" ||
    pathname === "/privacy" ||
    pathname === "/terms";

  if (hideNavbarCompletely) {
    return null;
  }

  return (
    <>
      <div className="navbar desktop-navbar">
        <div className="nav-left">
          <Link href="/" aria-label="Home" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <img src="/logo.png" className="nav-logo" alt="Signo logo" />

            <img
              src="/group-name.png"
              className="nav-group-name"
              alt="Signo Research Group"
            />
          </Link>
        </div>

        {!hideNavLinks && (
          <div className="nav-right">
            <Link href={terminalHref} className="nav-link">
              Terminal
            </Link>

            <Link href={recordsHref} className="nav-link">
              Records
            </Link>
          </div>
        )}
      </div>

      <div className="navbar-mobile">
        <Link href="/" aria-label="Home" style={{ cursor: "pointer" }}>
          <img
            src="/logo.png"
            alt="Signo logo"
            className="navbar-mobile-logo"
          />
        </Link>

        {!hideNavLinks && (
          <div className="navbar-mobile-links">
            <Link href={terminalHref} className="navbar-mobile-link">
              Terminal
            </Link>

            <Link href={recordsHref} className="navbar-mobile-link">
              Records
            </Link>
          </div>
        )}
      </div>
    </>
  );
}