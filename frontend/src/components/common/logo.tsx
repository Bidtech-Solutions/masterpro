import Image from "next/image";

import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** Logo MasterPro. Varian `color` memakai Maspro-03 (header terang), `white` untuk latar gelap (DESIGN.md §1.2). */
export function Logo({
  variant = "color",
  className,
  priority,
}: {
  variant?: "color" | "white";
  className?: string;
  priority?: boolean;
}) {
  const isWhite = variant === "white";
  return (
    <Image
      src={isWhite ? site.logoWhite : site.logo}
      alt={site.name}
      width={isWhite ? 1640 : 1048}
      height={isWhite ? 500 : 863}
      priority={priority}
      sizes="(max-width: 640px) 140px, 180px"
      className={cn(
        isWhite ? "h-11 w-auto object-contain sm:h-12" : "h-12 w-auto object-contain sm:h-14",
        className,
      )}
    />
  );
}
