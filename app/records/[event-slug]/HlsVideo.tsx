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

    // Nothing here is shown to the viewer; it only stops a dead player from
    // being silent in the console too.
    const onVideoError = () => {
      console.error("HlsVideo: video error", video.error?.code, video.error?.message, masterUrl);
    };
    video.addEventListener("error", onVideoError);

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = masterUrl;
      return () => video.removeEventListener("error", onVideoError);
    }

    let hlsInstance: import("hls.js").default | null = null;

    (async () => {
      const { default: Hls } = await import("hls.js");
      if (!Hls.isSupported()) return;

      hlsInstance = new Hls({ autoStartLoad: false });
      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error("HlsVideo: fatal hls.js error", data.type, data.details, data.error ?? "", masterUrl);
        }
      });
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
      video.removeEventListener("error", onVideoError);
      hlsInstance?.destroy();
    };
  }, [masterUrl]);

  return (
    <video
      ref={videoRef}
      // The playlist is ours but its segments are signed Supabase URLs, i.e.
      // cross-origin. Without this the browser fetches them no-CORS, and
      // Chrome's native HLS player refuses to read a segment it got that way:
      // one segment, then MEDIA_ERR_SRC_NOT_SUPPORTED. Supabase answers
      // Access-Control-Allow-Origin: *, so CORS mode is all it takes.
      crossOrigin="anonymous"
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
