import { cn } from "@/lib/utils" // helper bawaan shadcn untuk menggabungkan class

// Dua kolom pattern (kiri & kanan) memakai class yang hampir sama,
// jadi class dasarnya dipisah dan hanya posisinya yang berbeda.
const basePattern =
  "relative row-span-full row-start-1 border-x border-x-(--pattern-fg) " +
  "bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] " +
  "bg-[size:10px_10px] bg-fixed"

type Props = {
  side: "left" | "right"
}

export function PatternColumn({ side }: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        basePattern,
        // kolom kiri ada di grid kolom 2, kolom kanan di kolom 4
        side === "left" ? "-right-px col-start-2" : "-left-px col-start-4",
      )}
    />
  )
}
