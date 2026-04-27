"use client";

import { useEffect, useRef, useState } from "react";

const SLICE_COUNT = 6;
const GLITCH_DURATION_MS = 2000;

function GlitchCanvas({ posterSrc }: { posterSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = posterSrc;

    let raf = 0;
    let lastDisplace = 0;
    const DISPLACE_INTERVAL = 80;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const drawBase = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!img.complete || img.naturalWidth === 0) return;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;
      let drawW, drawH, drawX, drawY;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) * 0.3;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    const displaceBlocks = () => {
      const w = canvas.width;
      const h = canvas.height;
      const blockCount = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < blockCount; i++) {
        const blockW = 20 + Math.floor(Math.random() * 60);
        const blockH = 8 + Math.floor(Math.random() * 25);
        const sx = Math.floor(Math.random() * (w - blockW));
        const sy = Math.floor(Math.random() * (h - blockH));
        const dx = sx + (Math.random() - 0.5) * 80;
        const dy = sy + (Math.random() - 0.5) * 30;
        try {
          const slice = ctx.getImageData(sx, sy, blockW, blockH);
          ctx.putImageData(slice, dx, dy);
        } catch (e) {
          // tainted canvas or image not ready
        }
      }
    };

    const tick = (now: number) => {
      drawBase();
      if (now - lastDisplace >= DISPLACE_INTERVAL) {
        displaceBlocks();
        lastDisplace = now;
      }
      raf = requestAnimationFrame(tick);
    };

    img.onload = () => {
      resize();
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [posterSrc]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    />
  );
}

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
    if (reduced) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), GLITCH_DURATION_MS);
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
        }}
      >
        <img
          src={lineupSrc}
          alt="RAVE_Initiation lineup"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
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
      <GlitchCanvas posterSrc={posterSrc} />
    </div>
  );
}
