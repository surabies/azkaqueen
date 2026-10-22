// components/layout/shell/Pattern.tsx
// Tugas: pola garis miring ala dashboard Tailwind.
// Diadaptasi dari sample Tailwind Play (pattern.html) agar jalan di Next.js.
import { cn } from "@/lib/utils"

// Warna garis pola. Pasang di elemen paling luar (lihat DashboardShell),
// lalu anak-anaknya bisa memakai `border-(--pattern-fg)` / `bg-(--pattern-fg)`.
export const patternVars =
  "[--pattern-fg:var(--color-gray-950)]/5 dark:[--pattern-fg:var(--color-white)]/10"

// Pita bergaris miring di sisi kiri/kanan konten.
// `bg-fixed` membuat garis tidak ikut bergeser saat halaman di-scroll.
export function PatternStrip({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "border-x border-x-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed",
        className,
      )}
    />
  )
}

// Garis horizontal tipis seirama dengan pola.
export function PatternRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-(--pattern-fg)", className)}
    />
  )
}
