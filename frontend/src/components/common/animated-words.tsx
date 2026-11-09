import { Fragment } from "react";

import { cn } from "@/lib/utils";

interface Props {
  text: string;
  /** Urutan kata pertama — dipakai saat satu judul terdiri dari beberapa potongan teks. */
  startIndex?: number;
  /** Jeda dasar (ms) sebelum kata pertama muncul. */
  baseDelay?: number;
  /** Jeda antar kata (ms). */
  stagger?: number;
  /** Kelas untuk setiap kata (mis. gaya aksen). */
  wordClassName?: string;
}

/**
 * Animasi teks per kata (naik + blur → jelas) murni CSS, aman di Server Component.
 * Setiap kata dibungkus `overflow-hidden` agar terlihat "terbit" dari garis dasar.
 */
export function AnimatedWords({ text, startIndex = 0, baseDelay = 0, stagger = 70, wordClassName }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {/* pr/-mr kecil agar ujung huruf italic tidak terpotong overflow-hidden */}
          <span className="-mr-[0.08em] inline-block overflow-hidden pr-[0.08em] pb-[0.12em] align-bottom">
            <span
              className="inline-block animate-word-rise whitespace-nowrap"
              style={{ animationDelay: `${baseDelay + (startIndex + i) * stagger}ms` }}
            >
              {/* Gaya kata di span terpisah agar animasinya (mis. shimmer) tidak menimpa animasi terbit */}
              <span className={cn("inline-block", wordClassName)}>{word}</span>
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
