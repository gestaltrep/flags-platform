"use client";

import { useEffect, useRef, useState } from "react";

const SLICE_COUNT = 6;
const GLITCH_DURATION_MS = 2000;
const LINEUP_GLITCH_MS = 350;

type Phase = "poster-glitch" | "lineup-glitch" | "settled";

function GlitchCanvas({ src, fitMode }: { src: string; fitMode: "cover-30pct" | "cover-center" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    let raf = 0;
    let lastDisplace = 0;
    const DISPLACE_INTERVAL = 50;

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
        drawY = (h - drawH) * (fitMode === "cover-30pct" ? 0.3 : 0.5);
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    const displaceBlocks = () => {
      const w = canvas.width;
      const h = canvas.height;
      const blockCount = 8 + Math.floor(Math.random() * 8);
      for (let i = 0; i < blockCount; i++) {
        const blockW = 15 + Math.floor(Math.random() * 90);
        const blockH = 8 + Math.floor(Math.random() * 25);
        const sx = Math.floor(Math.random() * (w - blockW));
        const sy = Math.floor(Math.random() * (h - blockH));
        const dx = sx + (Math.random() - 0.5) * 140;
        const dy = sy + (Math.random() - 0.5) * 50;
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
  }, [src, fitMode]);

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
  const [phase, setPhase] = useState<Phase>("poster-glitch");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("settled");
      return;
    }
    const t1 = setTimeout(() => setPhase("lineup-glitch"), GLITCH_DURATION_MS);
    const t2 = setTimeout(() => setPhase("settled"), GLITCH_DURATION_MS + LINEUP_GLITCH_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Pre-mount (SSR + first paint): show lineup directly. No layout shift, crawler-friendly.
  if (!mounted || phase === "settled") {
    return (
      <div
        className={className}
        style={{ position: "relative", overflow: "hidden", background: "transparent" }}
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

  if (phase === "lineup-glitch") {
    return (
      <div
        className={className}
        style={{ position: "relative", overflow: "hidden", background: "#000" }}
      >
        <img
          src={lineupSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            display: "block",
          }}
        />
        <GlitchCanvas src={lineupSrc} fitMode="cover-center" />
      </div>
    );
  }

  // phase === "poster-glitch"
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
      <GlitchCanvas src={posterSrc} fitMode="cover-30pct" />
    </div>
  );
}
