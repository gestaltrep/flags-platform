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
    const BAND_HEIGHT = 40;

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

    // Returns 0..1 for assembly progress, or 0 in poster-chaos mode
    const assemblyProgress = (now: number): number => {
      if (mode !== "assembly") return 0;
      const elapsed = now - startTimeRef.current;
      return Math.min(1, Math.max(0, elapsed / ASSEMBLY_MS));
    };

    // Ease-in-out cubic — slow start, fast middle, slow end
    const easeInOutCubic = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Lock band Y-position in canvas-pixel space.
    // Starts above canvas (-BAND_HEIGHT) so band enters from top.
    // Ends below canvas (h + BAND_HEIGHT) so band fully exits before settle.
    const lockBandY = (progress: number, h: number): number => {
      const eased = easeInOutCubic(progress);
      const totalTravel = h + BAND_HEIGHT * 2;
      return -BAND_HEIGHT + eased * totalTravel;
    };

    // Final-stage degauss flash: triggers in last 8% of assembly (~100ms)
    const isDegaussFlash = (progress: number): boolean => {
      return progress >= 0.92 && progress < 1.0;
    };

    const drawBase = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (mode === "poster-chaos" && posterCanvas && posterCanvas.width > 0 && posterCanvas.height > 0) {
        ctx.drawImage(posterCanvas, 0, 0);
        return;
      }

      if (mode === "assembly" && posterCanvas && posterCanvas.width > 0 && posterCanvas.height > 0) {
        const progress = assemblyProgress(now);

        // Degauss flash at very end: full white-ish flash fading over last 8%
        if (isDegaussFlash(progress)) {
          const flashStrength = 1 - (progress - 0.92) / 0.08;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashStrength * 0.6})`;
          ctx.fillRect(0, 0, w, h);
          return;
        }

        const bandY = lockBandY(progress, h);
        const halfBand = BAND_HEIGHT / 2;

        // Below the band: paint poster chaos texture (clipped)
        const belowStart = Math.max(0, bandY + halfBand);
        if (belowStart < h) {
          ctx.drawImage(
            posterCanvas,
            0, belowStart, w, h - belowStart,
            0, belowStart, w, h - belowStart
          );
        }

        // Above the band: leave canvas transparent so lineup <img> shows through. (no-op)

        // Inside the band: 60% poster blended in — canvas blocks will overlay in displaceBlocks
        const bandTop = Math.max(0, bandY - halfBand);
        const bandBot = Math.min(h, bandY + halfBand);
        if (bandBot > bandTop) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.drawImage(
            posterCanvas,
            0, bandTop, w, bandBot - bandTop,
            0, bandTop, w, bandBot - bandTop
          );
          ctx.restore();
        }
      }
    };

    const displaceBlocks = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;

      if (mode === "poster-chaos") {
        // Full-canvas chaos — high density, large throws
        const blockCount = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < blockCount; i++) {
          const blockW = 15 + Math.floor(Math.random() * 90);
          const blockH = 8 + Math.floor(Math.random() * 25);
          const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
          const sy = Math.floor(Math.random() * Math.max(1, h - blockH));
          const dx = sx + (Math.random() - 0.5) * 140;
          const dy = sy + (Math.random() - 0.5) * 50;
          if (!posterCanvas || posterCanvas.width === 0 || posterCanvas.height === 0) continue;
          try {
            const slice = posterCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
            if (slice) ctx.putImageData(slice, dx, dy);
          } catch { /* ignore */ }
        }
        return;
      }

      if (mode !== "assembly") return;

      const progress = assemblyProgress(now);
      if (isDegaussFlash(progress)) return; // no chaos during flash

      const bandY = lockBandY(progress, h);
      const halfBand = BAND_HEIGHT / 2;
      const bandTop = bandY - halfBand;
      const bandBot = bandY + halfBand;

      // (a) Heavy chaos INSIDE band: ~10 blocks, 50/50 poster+lineup, big displacement
      for (let i = 0; i < 10; i++) {
        const blockW = 15 + Math.floor(Math.random() * 90);
        const blockH = 6 + Math.floor(Math.random() * 20);
        const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
        const sy = Math.max(0, Math.floor(bandTop + Math.random() * BAND_HEIGHT));
        const clampedH = Math.min(blockH, Math.max(1, bandBot - sy));
        if (clampedH < 1) continue;
        const dx = sx + (Math.random() - 0.5) * 140;
        const dy = sy + (Math.random() - 0.5) * 30;
        const fromLineup = Math.random() < 0.5;
        const sourceCanvas = fromLineup ? lineupCanvas : posterCanvas;
        if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) continue;
        try {
          const slice = sourceCanvas.getContext("2d")?.getImageData(sx, sy, blockW, clampedH);
          if (slice) ctx.putImageData(slice, dx, dy);
        } catch { /* ignore */ }
      }

      // (b) Above the band — occasional lineup leakage: 2 small blocks, slight displacement
      if (bandTop > 20) {
        for (let i = 0; i < 2; i++) {
          const blockW = 10 + Math.floor(Math.random() * 50);
          const blockH = 4 + Math.floor(Math.random() * 12);
          const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
          const sy = Math.floor(Math.random() * Math.max(1, bandTop - blockH));
          const dx = sx + (Math.random() - 0.5) * 30;
          const dy = sy + (Math.random() - 0.5) * 8;
          if (!lineupCanvas || lineupCanvas.width === 0 || lineupCanvas.height === 0) continue;
          try {
            const slice = lineupCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
            if (slice) ctx.putImageData(slice, dx, dy);
          } catch { /* ignore */ }
        }
      }

      // (c) Below the band — poster chaos continues
      if (bandBot < h - 20) {
        for (let i = 0; i < 6; i++) {
          const blockW = 15 + Math.floor(Math.random() * 90);
          const blockH = 8 + Math.floor(Math.random() * 25);
          const sx = Math.floor(Math.random() * Math.max(1, w - blockW));
          const sy = Math.floor(bandBot + Math.random() * Math.max(1, h - bandBot - blockH));
          const dx = sx + (Math.random() - 0.5) * 140;
          const dy = sy + (Math.random() - 0.5) * 50;
          if (!posterCanvas || posterCanvas.width === 0 || posterCanvas.height === 0) continue;
          try {
            const slice = posterCanvas.getContext("2d")?.getImageData(sx, sy, blockW, blockH);
            if (slice) ctx.putImageData(slice, dx, dy);
          } catch { /* ignore */ }
        }
      }
    };

    const tick = (now: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = now;
      drawBase(now);
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
