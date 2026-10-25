// features/dashboard/components/stat-card.tsx — sel angka ringkasan.
//
// Server component. Dirender sebagai SEL di dalam grid hairline (container
// `grid gap-px bg-border/70`, tiap sel `bg-card`).
//
// IKON: menerima ikon Hugeicons (array data) MAUPUN Lucide (komponen). Halaman
// lain yang masih memakai Lucide tidak perlu diubah — `Array.isArray` memilah
// keduanya. HugeiconsIcon tidak memakai hooks, jadi aman di server component.
import type { LucideIcon } from "lucide-react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"

type Nada = "netral" | "perhatian" | "peringatan" | "info" | "sukses"

/// `perhatian` tetap MERAH (dipakai halaman lain), `peringatan` = amber.
const NADA: Record<Nada, { angka: string; ikon: string; bilah: string }> = {
  netral: {
    angka: "text-foreground",
    ikon: "border-border bg-muted/40 text-muted-foreground",
    bilah: "bg-foreground/60",
  },
  perhatian: {
    angka: "text-destructive",
    ikon: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
    bilah: "bg-red-500",
  },
  peringatan: {
    angka: "text-foreground",
    ikon: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    bilah: "bg-amber-500",
  },
  info: {
    angka: "text-foreground",
    ikon: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    bilah: "bg-blue-500",
  },
  sukses: {
    angka: "text-foreground",
    ikon: "border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400",
    bilah: "bg-green-500",
  },
}

function Ikon({ icon, className }: { icon: LucideIcon | IconSvgElement; className?: string }) {
  if (Array.isArray(icon)) {
    return <HugeiconsIcon icon={icon as IconSvgElement} strokeWidth={2} className={className} aria-hidden />
  }
  const Lucide = icon as LucideIcon
  return <Lucide className={className} aria-hidden />
}

export function StatCard({
  label,
  nilai,
  keterangan,
  judulLengkap,
  icon,
  nada = "netral",
  progres,
}: {
  label: string
  /** Sudah diringkas bila berupa uang — lihat formatRupiahRingkas(). */
  nilai: string
  keterangan?: string
  /** Nilai penuh, muncul sebagai tooltip saat kursor menyentuh angka ringkas. */
  judulLengkap?: string
  icon: LucideIcon | IconSvgElement
  nada?: Nada
  /** 0–100. Bila diisi, bilah tipis digambar di dasar sel. */
  progres?: number
}) {
  const n = NADA[nada]
  return (
    <div className="bg-card relative flex items-start justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        {/* tabular-nums: digit selebar sama, angka antar sel tidak "bergoyang". */}
        <p
          title={judulLengkap}
          className={cn("mt-1 truncate font-mono text-xl font-semibold tracking-tight tabular-nums sm:text-2xl", n.angka)}
        >
          {nilai}
        </p>
        {keterangan && <p className="text-muted-foreground mt-0.5 truncate text-xs">{keterangan}</p>}
      </div>
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md border sm:size-8", n.ikon)}>
        <Ikon icon={icon} className="size-4" />
      </div>

      {progres !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={progres}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60"
        >
          <div className={cn("h-full transition-[width] duration-500", n.bilah)} style={{ width: `${progres}%` }} />
        </div>
      )}
    </div>
  )
}