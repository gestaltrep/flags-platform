"use client";

import { useEffect, useRef } from "react";

interface HlsVideoProps {
  masterUrl: string;
  poster: string | null;
  width: number | null;
  height: number | null;
}

export default function HlsVideo({ masterUrl, poster, width, height }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = masterUrl;
      return;
    }

    let hlsInstance: import("hls.js").default | null = null;

    (async () => {
      const { default: Hls } = await import("hls.js");
      if (!Hls.isSupported()) return;

      hlsInstance = new Hls({ autoStartLoad: false });
      hlsInstance.loadSource(masterUrl);
      hlsInstance.attachMedia(video);

      // Start loading only on first play, then remove the listener
      const onPlay = () => {
        hlsInstance?.startLoad();
        video.removeEventListener("play", onPlay);
      };
      video.addEventListener("play", onPlay);
    })();

    return () => {
      hlsInstance?.destroy();
    };
  }, [masterUrl]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="none"
      poster={poster ?? undefined}
      width={width ?? undefined}
      height={height ?? undefined}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
