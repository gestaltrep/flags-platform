"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

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
          <img src="/logo.png" className="nav-logo" alt="Signo logo" />

          <img
            src="/group-name.png"
            className="nav-group-name"
            alt="Signo Research Group"
          />
        </div>

        {!hideNavLinks && (
          <div className="nav-right">
            <Link href="/" className="nav-link">
              Home
            </Link>

            <Link href="/dashboard" className="nav-link">
              Terminal
            </Link>
          </div>
        )}
      </div>

      <div className="navbar-mobile">
        <img
          src="/logo.png"
          alt="Signo logo"
          className="navbar-mobile-logo"
        />

        {!hideNavLinks && (
          <div className="navbar-mobile-links">
            <Link href="/" className="navbar-mobile-link">
              Home
            </Link>

            <Link href="/dashboard" className="navbar-mobile-link">
              Terminal
            </Link>
          </div>
        )}
      </div>
    </>
  );
}