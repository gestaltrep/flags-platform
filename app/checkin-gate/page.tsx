"use client";
import { useEffect, useRef } from "react";

export default function CheckinGatePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  function handleEnded() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  function handleClick() {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }

  return (
    <main
      onClick={handleClick}
      style={{
        position: "fixed", inset: 0, background: "black",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", cursor: "none",
      }}
    >
      <style>{`
        @keyframes eerieBreath {
          0%   { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.88) saturate(0.95); }
          25%  { transform: scale(1.006) translate(-0.5px, 0.5px); filter: brightness(0.93) saturate(1.01); }
          50%  { transform: scale(1.010) translate(0px, 0.8px); filter: brightness(0.97) saturate(1.06); }
          75%  { transform: scale(1.005) translate(0.5px, 0.3px); filter: brightness(0.92) saturate(1.02); }
          100% { transform: scale(1.000) translate(0px, 0px); filter: brightness(0.88) saturate(0.95); }
        }
      `}</style>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          animation: "eerieBreath 10s ease-in-out infinite",
          willChange: "transform, filter",
        }}
      >
        <source src="/thislong.mp4" type="video/mp4" />
      </video>
    </main>
  );
}
