"use client";

import { useEffect, useState } from "react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  display_order: number;
}

export default function SponsorSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/sponsors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setSponsors(d.sponsors ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Render nothing until loaded AND we know there's at least one sponsor.
  // Critical: no empty container, no leftover spacing — invisible when empty.
  if (!loaded || sponsors.length === 0) return null;

  return (
    <section
      style={{
        maxWidth: "350px",
        margin: "36px auto",
        fontFamily: '"Courier New", monospace',
        textAlign: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#888",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "14px",
          fontWeight: 300,
        }}
      >
        Supported by
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {sponsors.map((s) => {
          const img = (
            <img
              src={s.logo_url}
              alt={s.name}
              style={{
                maxHeight: "48px",
                maxWidth: "120px",
                objectFit: "contain",
                filter: "grayscale(1) brightness(1.1)",
              }}
            />
          );
          return s.link_url ? (
            <a
              key={s.id}
              href={s.link_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex" }}
            >
              {img}
            </a>
          ) : (
            <span key={s.id} style={{ display: "inline-flex" }}>
              {img}
            </span>
          );
        })}
      </div>
    </section>
  );
}
