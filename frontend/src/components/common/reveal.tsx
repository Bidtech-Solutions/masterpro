"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Jeda (ms) sebelum muncul — untuk efek berurutan antar elemen. */
  delay?: number;
  className?: string;
}

/**
 * Memunculkan konten dengan fade + geser naik saat masuk viewport (sekali saja).
 * Gaya ada di globals.css (`[data-reveal]`); otomatis tampil tanpa animasi bila
 * JavaScript mati atau pengguna memilih `prefers-reduced-motion`.
 */
export function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={shown ? "shown" : ""}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={className}
    >
      {children}
    </div>
  );
}
