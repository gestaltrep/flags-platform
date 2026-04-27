"use client";

import { useEffect, useState } from "react";

const SLICE_COUNT = 6;
const GLITCH_DURATION_MS = 2000;
const SESSION_KEY = "hero-glitched-rave-initiation";

export default function HeroGlitch({
  posterSrc = "/poster-image.png",
  lineupSrc = "/lineup_hero.png",
  className,
  posterObjectPosition = "center 30%",
}: {
  posterSrc?: string;
  lineupSrc?: string;
  className?: string;
  posterObjectPosition?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (reduced || seen) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => {
      setRevealed(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, GLITCH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // Pre-mount (SSR + first paint): show lineup directly. No layout shift, crawler-friendly.
  if (!mounted || revealed) {
    return (
      <div
        className={className}
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img
          src={lineupSrc}
          alt="RAVE_Initiation lineup"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", background: "#000" }}
    >
      {Array.from({ length: SLICE_COUNT }).map((_, i) => {
        const top = (i * 100) / SLICE_COUNT;
        const bottom = 100 - ((i + 1) * 100) / SLICE_COUNT;
        return (
          <img
            key={i}
            src={posterSrc}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: posterObjectPosition,
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
              animation: `hero-glitch-slice-${i} ${1.4 + i * 0.13}s steps(1, end) infinite`,
              willChange: "transform, filter",
            }}
          />
        );
      })}
    </div>
  );
}
