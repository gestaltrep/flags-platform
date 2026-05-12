"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: Date | string;
  fallbackContent?: React.ReactNode;
  onExpire?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function compute(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

export default function Countdown({
  targetDate,
  fallbackContent = null,
  onExpire,
  className,
  style,
}: Props) {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [tl, setTl] = useState<TimeLeft>(() => compute(target));
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const next = compute(target);
      setTl(next);
      if (next.expired && !fired && onExpire) {
        setFired(true);
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target.getTime(), fired, onExpire]);

  if (tl.expired) return <>{fallbackContent}</>;

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={className} style={style}>
      {tl.days}d {pad(tl.hours)}h {pad(tl.minutes)}m {pad(tl.seconds)}s
    </span>
  );
}
