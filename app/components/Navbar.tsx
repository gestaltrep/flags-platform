"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <>
      <div className="navbar desktop-navbar">
        <div className="nav-left">
          <img
            src="/logo.png"
            className="nav-logo"
            alt="Signo logo"
          />

          <img
            src="/group-name.png"
            className="nav-group-name"
            alt="Signo Research Group"
          />
        </div>

        <div className="nav-right">
          <Link href="/" className="nav-link">
            Home
          </Link>

          <Link href="/dashboard" className="nav-link">
            Terminal
          </Link>
        </div>
      </div>

      <div className="navbar-mobile">
        <img
          src="/logo.png"
          alt="Signo logo"
          className="navbar-mobile-logo"
        />

        <div className="navbar-mobile-links">
          <Link href="/" className="navbar-mobile-link">
            Home
          </Link>

          <Link href="/dashboard" className="navbar-mobile-link">
            Terminal
          </Link>
        </div>
      </div>
    </>
  );
}