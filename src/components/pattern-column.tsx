import { cn } from "@/lib/utils"

type Props = {
  side: "left" | "right"
}

export function PatternColumn({ side }: Props) {
  return (
    <div
      aria-hidden="true" // dekoratif, disembunyikan dari screen reader
      className={cn(
        // Tahap 1: lebar tetap 1.5rem, tidak boleh menyusut, hanya tampil di layar besar
        "hidden w-6 shrink-0 lg:block",
        // Tahap 2: pattern miring (utility dari globals.css)
        "bg-diagonal-pattern",
        // Tahap 3: garis vertikal hanya di sisi yang menghadap konten
        side === "left" ? "border-r" : "border-l",
        // Tahap 4: warna border mengikuti variabel pattern
        "border-(--pattern-fg)",
      )}
    />
  )
}
