"use client";

import { useEffect, useRef, useState } from "react";

const SLICE_COUNT = 6;
const TOTAL_DURATION_MS = 2600;

type Phase = "chaos" | "settled";

function GlitchCanvas({
  posterSrc,
  lineupSrc,
}: {
  posterSrc: string;
  lineupSrc: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const posterImg = new Image();
    posterImg.crossOrigin = "anonymous";
    posterImg.src = posterSrc;
    const lineupImg = new Image();
    lineupImg.crossOrigin = "anonymous";
    lineupImg.src = lineupSrc;

    let posterCanvas: HTMLCanvasElement | null = null;
    let lineupCanvas: HTMLCanvasElement | null = null;
    let raf = 0;
    let lastDisplace = 0;
    const DISPLACE_INTERVAL = 50;
    const STRIPE_HEIGHT = 8;

    const buildOffscreen = (img: HTMLImageElement, fit: "cover-30pct" | "cover-center") => {
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext("2d");
      if (!offCtx) return off;
      const w = canvas.width;
      const h = canvas.height;
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
        drawY = (h - drawH) * (fit === "cover-30pct" ? 0.3 : 0.5);
      }
      offCtx.drawImage(img, drawX, drawY, drawW, drawH);
      return off;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (posterImg.complete && posterImg.naturalWidth > 0) {
        posterCanvas = buildOffscreen(posterImg, "cover-30pct");
      }
      if (lineupImg.complete && lineupImg.naturalWidth > 0) {
        lineupCanvas = buildOffscreen(lineupImg, "cover-center");
      }
    };

    // Animation progress 0..1 over the full chaos duration
    const progress = (now: number): number => {
      const elapsed = now - startTimeRef.current;
      return Math.min(1, Math.max(0, elapsed / TOTAL_DURATION_MS));
    };

    // Sigmoid curve, crossover at t=0.5 (1.3s of 2.6s). Returns lineup share 0..1.
    const lineupShare = (t: number): number => {
      return 1 / (1 + Math.exp(-10 * (t - 0.5)));
    };

    // Full intensity through 88%, then ramps to 0 over the last 12%
    const chaosIntensity = (t: number): number => {
      if (t < 0.88) return 1;
      return Math.max(0, 1 - (t - 0.88) / 0.12);
    };

    // Pseudo-random per-stripe assignment shifting with time
    const stripeIsLineup = (stripeIndex: number, t: number): boolean => {
      const timeQuant = Math.floor(t * 50);
      const hash = Math.sin(stripeIndex * 12.9898 + timeQuant * 78.233) * 43758.5453;
      const noise = hash - Math.floor(hash);
      return noise < lineupShare(t);
    };

    const drawStripes = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const t = progress(now);
      ctx.clearRect(0, 0, w, h);

      const stripeCount = Math.ceil(h / STRIPE_HEIGHT);
      for (let i = 0; i < stripeCount; i++) {
        const y = i * STRIPE_HEIGHT;
        const stripeH = Math.min(STRIPE_HEIGHT, h - y);
        if (stripeH <= 0) continue;
        const useLineup = stripeIsLineup(i, t);
        const sourceCanvas = useLineup ? lineupCanvas : posterCanvas;
        if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) continue;
        ctx.drawImage(
          sourceCanvas,
          0, y, w, stripeH,
          0, y, w, stripeH
        );
      }
    };

    const displaceBlocks = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const t = progress(now);
      const intensity = chaosIntensity(t);
      if (intensity <= 0) return;

      const baseCount = 8 + Math.floor(Math.random() * 8);
      const blockCount = Math.max(0, Math.floor(baseCount * intensity));
      const dispMagnitude = intensity;
      const lineupShareNow = lineupShare(t);

      for (let i = 0; i < blockCount; i++) {
        const blockW = 15 + Math.floor(Math.random() * 90);
        const blockH = 8 + Math.floor(Math.random() * 25);
        const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
        const sy = Math.floor(Math.random() * Math.max(1, h - blockH));
        const dx = sx + (Math.random() - 0.5) * 140 * dispMagnitude;
        const dy = sy + (Math.random() - 0.5) * 50 * dispMagnitude;

        const fromLineup = Math.random() < lineupShareNow;
        const sourceCanvas = fromLineup ? lineupCanvas : posterCanvas;
        if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) continue;

        try {
          const slice = sourceCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
          if (slice) ctx.putImageData(slice, dx, dy);
        } catch { /* ignore */ }
      }
    };

    const tick = (now: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = now;
      drawStripes(now);
      if (now - lastDisplace >= DISPLACE_INTERVAL) {
        displaceBlocks(now);
        lastDisplace = now;
      }
      raf = requestAnimationFrame(tick);
    };

    let imagesLoaded = 0;
    const onLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        resize();
        raf = requestAnimationFrame(tick);
      }
    };
    posterImg.onload = onLoad;
    lineupImg.onload = onLoad;
    if (posterImg.complete && posterImg.naturalWidth > 0) onLoad();
    if (lineupImg.complete && lineupImg.naturalWidth > 0) onLoad();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      startTimeRef.current = 0;
    };
  }, [posterSrc, lineupSrc]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
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
  const [phase, setPhase] = useState<Phase>("chaos");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("settled");
      return;
    }
    const t = setTimeout(() => setPhase("settled"), TOTAL_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // Pre-mount (SSR + first paint) or settled
  if (!mounted || phase === "settled") {
    return (
      <div
        className={className}
        style={{ position: "relative", overflow: "hidden", background: "transparent" }}
      >
        <img
          src={lineupSrc}
          alt="RAVE_Initiation lineup"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }}
        />
      </div>
    );
  }

  // chaos phase
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
      <GlitchCanvas posterSrc={posterSrc} lineupSrc={lineupSrc} />
    </div>
  );
}
