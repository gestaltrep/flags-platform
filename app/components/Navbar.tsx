"use client";

import Link from "next/link";

export default function Navbar() {

  return (

    <div className="navbar">

      <div className="nav-left">

        <img
          src="/logo.png"
          className="nav-logo"
        />

        <img
          src="/group-name.png"
          className="nav-group-name"
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

  );

}