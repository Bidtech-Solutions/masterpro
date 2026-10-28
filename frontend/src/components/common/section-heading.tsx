import { cn } from "@/lib/utils";

/** Judul section dengan kata aksen Playfair italic (DESIGN.md §0). */
export function SectionHeading({
  title,
  accent,
  as: Tag = "h2",
  className,
  align = "left",
}: {
  title: string;
  accent?: string;
  as?: "h1" | "h2";
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-h2 font-extrabold tracking-tight text-navy-900 md:text-h1",
        align === "center" && "text-center",
        className,
      )}
    >
      {title}
      {accent ? (
        <>
          {" "}
          <span className="font-accent font-normal text-blue-600 italic">{accent}</span>
        </>
      ) : null}
    </Tag>
  );
}
