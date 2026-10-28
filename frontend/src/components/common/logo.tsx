import Image from "next/image";

import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** Logo MasterPro. Varian `white` untuk latar gelap (DESIGN.md §1.2). */
export function Logo({
  variant = "color",
  className,
  priority,
}: {
  variant?: "color" | "white";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "white" ? site.logoWhite : site.logo}
      alt={site.name}
      width={800}
      height={592}
      priority={priority}
      sizes="120px"
      className={cn("h-11 w-auto", className)}
    />
  );
}
