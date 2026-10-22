// features/dashboard/components/stat-card.tsx — sel angka ringkasan.
//
// Server component. Dirender sebagai SEL di dalam grid "menyatu" (lihat
// page.tsx: container grid gap-px bg-border/70, tiap sel bg-card) — pola
// hairline yang sama dengan StatsStrip di beranda, bukan kartu-kartu
// terpisah yang mengambang.
import type { LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export function StatCard({
  label,
  nilai,
  keterangan,
  judulLengkap,
  icon: Icon,
  nada = "netral",
}: {
  label: string
  /** Sudah diringkas bila berupa uang — lihat formatRupiahRingkas(). */
  nilai: string
  keterangan?: string
  /** Nilai penuh, muncul sebagai tooltip saat kursor menyentuh angka ringkas. */
  judulLengkap?: string
  icon: LucideIcon
  /** `perhatian` untuk angka yang menuntut tindakan (tunggakan, aduan darurat). */
  nada?: "netral" | "perhatian"
}) {
  return (
    // Jarak & ukuran angka menyusut di ponsel: sel ini berbagi lebar layar
    // berdua (grid dua kolom), jadi 20px padding + angka 24px membuat nilai
    // seperti "Rp 1,2 M" terpotong sebelum sempat terbaca.
    <div className="flex items-start justify-between gap-2 bg-card px-4 py-4 sm:gap-3 sm:px-5 sm:py-5">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
        {/* tabular-nums: digit selebar sama, jadi angka antar sel sejajar dan
            tidak "bergoyang" saat nilainya berubah.
            `title`: nilai penuh tetap bisa dilihat — versi ringkas ada demi
            muat, bukan untuk menyembunyikan angkanya. */}
        <p
          title={judulLengkap}
          className={cn(
            "mt-1.5 truncate font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
            nada === "perhatian" ? "text-destructive" : "text-foreground"
          )}
        >
          {nilai}
        </p>
        {keterangan && <p className="mt-1 truncate text-xs text-muted-foreground">{keterangan}</p>}
      </div>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center border sm:size-8",
          nada === "perhatian"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-muted/40 text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </div>
    </div>
  )
}
