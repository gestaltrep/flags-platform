"use client";

import { useEffect, useRef, useState } from "react";

const SLICE_COUNT = 6;
const POSTER_CHAOS_MS = 1400;
const ASSEMBLY_MS = 1200;
const TOTAL_DURATION_MS = POSTER_CHAOS_MS + ASSEMBLY_MS;

type Phase = "poster-chaos" | "assembly" | "settled";
type CanvasMode = "poster-chaos" | "assembly";

function GlitchCanvas({
  posterSrc,
  lineupSrc,
  mode,
  posterFitMode,
}: {
  posterSrc: string;
  lineupSrc: string;
  mode: CanvasMode;
  posterFitMode: "cover-30pct" | "cover-center";
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
        posterCanvas = buildOffscreen(posterImg, posterFitMode);
      }
      if (lineupImg.complete && lineupImg.naturalWidth > 0) {
        lineupCanvas = buildOffscreen(lineupImg, "cover-center");
      }
    };

    const assemblyProgress = (now: number): number => {
      if (mode !== "assembly") return 0;
      const elapsed = now - startTimeRef.current;
      return Math.min(1, Math.max(0, elapsed / ASSEMBLY_MS));
    };

    const lineupShare = (progress: number): number => {
      if (mode === "poster-chaos") return 0;
      return 0.05 + 0.95 * (progress * progress * (3 - 2 * progress));
    };

    const chaosIntensity = (progress: number): number => {
      if (mode === "poster-chaos") return 1;
      if (progress < 0.61) return 1;
      return Math.max(0, 1 - (progress - 0.61) / 0.39);
    };

    const displacementScale = (progress: number): number => {
      if (mode === "poster-chaos") return 1;
      return Math.max(0, 1 - progress * progress);
    };

    const drawBase = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mode === "poster-chaos" && posterCanvas) {
        ctx.drawImage(posterCanvas, 0, 0);
      }
      // assembly mode: canvas stays transparent — lineup <img> shows through beneath
    };

    const displaceBlocks = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const progress = assemblyProgress(now);
      const intensity = chaosIntensity(progress);
      if (intensity <= 0) return;
      const baseCount = 8 + Math.floor(Math.random() * 8);
      const blockCount = Math.max(1, Math.floor(baseCount * intensity));
      const dispScale = displacementScale(progress);
      const share = lineupShare(progress);

      for (let i = 0; i < blockCount; i++) {
        const blockW = 15 + Math.floor(Math.random() * 90);
        const blockH = 8 + Math.floor(Math.random() * 25);
        const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
        const sy = Math.floor(Math.random() * Math.max(1, h - blockH));

        const fromLineup = Math.random() < share;
        const sourceCanvas = fromLineup ? lineupCanvas : posterCanvas;
        if (!sourceCanvas) continue;

        const settling = fromLineup && mode === "assembly" ? 0.4 : 1.0;
        const dx = sx + (Math.random() - 0.5) * 140 * dispScale * settling;
        const dy = sy + (Math.random() - 0.5) * 50 * dispScale * settling;

        try {
          const slice = sourceCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
          if (slice) ctx.putImageData(slice, dx, dy);
        } catch {
          // tainted canvas, image not ready, etc.
        }
      }
    };

    const tick = (now: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = now;
      drawBase();
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
    if (posterImg.complete) onLoad();
    if (lineupImg.complete) onLoad();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      startTimeRef.current = 0;
    };
  }, [posterSrc, lineupSrc, mode, posterFitMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: mode === "assembly" ? "normal" : "screen",
      }}
    />
  );
}

export default function HeroGlitch({
  posterSrc = "/poster-image.png",
  lineupSrc = "/lineup_hero.png",
  className,
  posterObjectPosition = "center 30%",
  posterFitMode = "cover-30pct",
}: {
  posterSrc?: string;
  lineupSrc?: string;
  className?: string;
  posterObjectPosition?: string;
  posterFitMode?: "cover-30pct" | "cover-center";
}) {
  const [phase, setPhase] = useState<Phase>("poster-chaos");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("settled");
      return;
    }
    const t1 = setTimeout(() => setPhase("assembly"), POSTER_CHAOS_MS);
    const t2 = setTimeout(() => setPhase("settled"), TOTAL_DURATION_MS);
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
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }}
        />
      </div>
    );
  }

  if (phase === "assembly") {
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
        <GlitchCanvas
          posterSrc={posterSrc}
          lineupSrc={lineupSrc}
          mode="assembly"
          posterFitMode={posterFitMode}
        />
      </div>
    );
  }

  // phase === "poster-chaos"
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
      <GlitchCanvas
        posterSrc={posterSrc}
        lineupSrc={lineupSrc}
        mode="poster-chaos"
        posterFitMode={posterFitMode}
      />
    </div>
  );
}
