"use client";

import { useEffect, useRef, useState } from "react";

const MAIN_DURATION_MS = 2600;
const EPILOGUE_DURATION_MS = 600;
const TOTAL_DURATION_MS = MAIN_DURATION_MS + EPILOGUE_DURATION_MS; // 3200

type Phase = "chaos" | "settled";

function GlitchCanvas({
  lineupSrc,
  onError,
}: {
  lineupSrc: string;
  onError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startTimeRef = useRef<number>(0);
  // Stable ref so the effect doesn't re-run when the parent re-renders
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lineupImg = new Image();
    lineupImg.crossOrigin = "anonymous";
    lineupImg.src = lineupSrc;

    let lineupCanvas: HTMLCanvasElement | null = null;
    let raf = 0;
    let lastDisplace = 0;
    const DISPLACE_INTERVAL = 50;
    const STRIPE_HEIGHT = 8;

    const buildOffscreen = (img: HTMLImageElement) => {
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
        drawY = (h - drawH) * 0.5;
      }
      offCtx.drawImage(img, drawX, drawY, drawW, drawH);
      return off;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (lineupImg.complete && lineupImg.naturalWidth > 0) {
        lineupCanvas = buildOffscreen(lineupImg);
      }
    };

    // Returns 0..1 over the main 2.6s animation. Caps at 1 during epilogue.
    const mainProgress = (now: number): number => {
      const elapsed = now - startTimeRef.current;
      return Math.min(1, Math.max(0, elapsed / MAIN_DURATION_MS));
    };

    // Returns 0..1 over the 600ms epilogue. Returns 0 during main animation.
    const epilogueProgress = (now: number): number => {
      const elapsed = now - startTimeRef.current;
      if (elapsed < MAIN_DURATION_MS) return 0;
      return Math.min(1, (elapsed - MAIN_DURATION_MS) / EPILOGUE_DURATION_MS);
    };

    // Main chaos intensity: full through 88%, decays to 0 at end of main
    const mainChaosIntensity = (mainT: number): number => {
      if (mainT >= 1) return 0;
      if (mainT < 0.88) return 1;
      return Math.max(0, 1 - (mainT - 0.88) / 0.12);
    };

    // Epilogue chaos intensity: starts at ~0.4, decays quadratically to 0
    const epilogueChaosIntensity = (epT: number): number => {
      if (epT <= 0 || epT >= 1) return 0;
      const remaining = 1 - epT;
      return 0.4 * remaining * remaining;
    };

    // Option A: per-stripe vertical scramble decaying to 0.
    // Each stripe reads from a pseudo-random vertical offset that collapses
    // as mainT → 1, giving a TV-tuning-to-signal effect.
    const drawStripes = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const mainT = mainProgress(now);
      ctx.clearRect(0, 0, w, h);

      if (!lineupCanvas || lineupCanvas.width === 0 || lineupCanvas.height === 0) return;

      const stripeCount = Math.ceil(h / STRIPE_HEIGHT);
      for (let i = 0; i < stripeCount; i++) {
        const y = i * STRIPE_HEIGHT;
        const stripeH = Math.min(STRIPE_HEIGHT, h - y);
        if (stripeH <= 0) continue;

        // Deterministic per-stripe noise value 0..1 — constant across frames
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const noise = seed - Math.floor(seed);
        // maxOffset decays to 0 as mainT → 1; hard-clamps at 0 when mainT >= 1
        const maxOffset = h * 0.6 * (1 - mainT);
        const dy = Math.floor((noise - 0.5) * 2 * maxOffset);
        const sourceY = ((y + dy) % h + h) % h;
        // Clamp source rect so we don't read past the offscreen canvas bottom
        const drawH = Math.min(stripeH, Math.max(0, h - sourceY));
        if (drawH <= 0) continue;

        ctx.drawImage(lineupCanvas, 0, sourceY, w, drawH, 0, y, w, drawH);
      }
    };

    const displaceBlocks = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const mainT = mainProgress(now);
      const epT = epilogueProgress(now);

      if (epT > 0) {
        // EPILOGUE: small chaos squares + occasional wide bar, sourced from lineup, decaying
        const intensity = epilogueChaosIntensity(epT);
        if (intensity <= 0) return;
        const blockCount = Math.max(0, Math.floor((3 + Math.random() * 4) * intensity));
        for (let i = 0; i < blockCount; i++) {
          const blockW = 10 + Math.floor(Math.random() * 40);
          const blockH = 5 + Math.floor(Math.random() * 12);
          const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
          const sy = Math.floor(Math.random() * Math.max(1, h - blockH));
          const dx = sx + (Math.random() - 0.5) * 50 * intensity;
          const dy = sy + (Math.random() - 0.5) * 15 * intensity;
          if (!lineupCanvas || lineupCanvas.width === 0 || lineupCanvas.height === 0) continue;
          try {
            const slice = lineupCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
            if (slice) ctx.putImageData(slice, dx, dy);
          } catch { /* ignore */ }
        }

        // Occasional wide horizontal bar jitter (~15% chance per frame)
        if (Math.random() < 0.15 * intensity) {
          const barH = 4 + Math.floor(Math.random() * 8);
          const sy = Math.floor(Math.random() * Math.max(1, h - barH));
          const dx = (Math.random() - 0.5) * 60 * intensity;
          if (!lineupCanvas || lineupCanvas.width === 0 || lineupCanvas.height === 0) return;
          try {
            const bar = lineupCanvas.getContext("2d")?.getImageData(0, sy, w, barH);
            if (bar) ctx.putImageData(bar, dx, sy);
          } catch { /* ignore */ }
        }
        return;
      }

      // MAIN: displaced blocks from lineup only
      const intensity = mainChaosIntensity(mainT);
      if (intensity <= 0) return;

      const baseCount = 8 + Math.floor(Math.random() * 8);
      const blockCount = Math.max(0, Math.floor(baseCount * intensity));
      const dispMagnitude = intensity;

      for (let i = 0; i < blockCount; i++) {
        const blockW = 15 + Math.floor(Math.random() * 90);
        const blockH = 8 + Math.floor(Math.random() * 25);
        const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
        const sy = Math.floor(Math.random() * Math.max(1, h - blockH));
        const dx = sx + (Math.random() - 0.5) * 140 * dispMagnitude;
        const dy = sy + (Math.random() - 0.5) * 50 * dispMagnitude;
        if (!lineupCanvas || lineupCanvas.width === 0 || lineupCanvas.height === 0) continue;
        try {
          const slice = lineupCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
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

    const start = () => {
      resize();
      raf = requestAnimationFrame(tick);
    };

    lineupImg.onload = start;
    lineupImg.onerror = () => onErrorRef.current();
    if (lineupImg.complete && lineupImg.naturalWidth > 0) start();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      startTimeRef.current = 0;
    };
  }, [lineupSrc]);

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
  lineupSrc = "/lineup_hero.png",
  className,
}: {
  lineupSrc?: string;
  className?: string;
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

  // chaos phase — canvas only, no DOM slice layer
  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", background: "#000" }}
    >
      <GlitchCanvas lineupSrc={lineupSrc} onError={() => setPhase("settled")} />
    </div>
  );
}
