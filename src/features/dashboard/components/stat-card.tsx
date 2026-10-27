// features/dashboard/components/stat-card.tsx — sel angka ringkasan + kerangkanya.
//
// Server component (tanpa hooks). Dua bagian:
//   <StatGrid>  kerangka: bingkai tipis + garis pemisah antar sel. Pakai ini di
//               SEMUA halaman supaya bingkai, radius, dan garisnya seragam.
//   <StatCard>  satu sel angka. Tidak punya border sendiri (garis dari StatGrid),
//               jadi tetap cocok juga di kerangka lama `grid gap-px bg-border/70`.
//
// Prinsip tampilan: warna HANYA untuk status. Ikon selalu netral; status
// ditandai titik kecil di samping label (+ bilah progres dan, untuk `perhatian`,
// angka merah). Angka memakai `num-display` dari globals.css (KPI: bobot 500,
// tabular, tracking rapat).
import type { LucideIcon } from "lucide-react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"

type Nada = "netral" | "perhatian" | "peringatan" | "info" | "sukses"

// `perhatian` tetap MERAH (dipakai halaman lain), `peringatan` = amber.
// titik: penanda status di samping label (netral = tanpa titik).
const NADA: Record<Nada, { angka: string; titik?: string; bilah: string }> = {
  netral: { angka: "text-foreground", bilah: "bg-foreground/60" },
  perhatian: { angka: "text-destructive", titik: "bg-red-500", bilah: "bg-red-500" },
  peringatan: { angka: "text-foreground", titik: "bg-amber-500", bilah: "bg-amber-500" },
  info: { angka: "text-foreground", titik: "bg-blue-500", bilah: "bg-blue-500" },
  sukses: { angka: "text-foreground", titik: "bg-green-500", bilah: "bg-green-500" },
}

// Ikon Hugeicons (array data) MAUPUN Lucide (komponen). `Array.isArray` memilah
// keduanya, jadi halaman lain yang masih Lucide tidak perlu diubah.
// strokeWidth disamakan (1.6) dengan ikon sidebar supaya garisnya seirama.
function Ikon({ icon, className }: { icon: LucideIcon | IconSvgElement; className?: string }) {
  if (Array.isArray(icon)) {
    return <HugeiconsIcon icon={icon as IconSvgElement} strokeWidth={1.6} className={className} aria-hidden />
  }
  const Lucide = icon as LucideIcon
  return <Lucide strokeWidth={1.6} className={className} aria-hidden />
}

// ----------------------------------------------------------------------------
// StatGrid — kerangka
// ----------------------------------------------------------------------------
// Kelas ditulis lengkap (bukan dirangkai) karena Tailwind hanya mengenali
// nama kelas utuh.
const KOLOM = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const

export function StatGrid({
  children,
  kolom = 4,
  className,
}: {
  children: React.ReactNode
  kolom?: keyof typeof KOLOM
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      {/* Tiap sel menggambar garis atas & kiri sendiri (`*:border-t *:border-l`).
          -mt-px / -ml-px menggeser grid 1px sehingga garis baris & kolom
          pertama tersembunyi di balik bingkai: tidak ada garis ganda, dan
          jumlah sel ganjil tidak meninggalkan kotak abu-abu kosong. */}
      <div className={cn("-mt-px -ml-px grid *:border-t *:border-l *:border-border", KOLOM[kolom])}>
        {children}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// StatCard — satu sel
// ----------------------------------------------------------------------------
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
  // Jaga di 0–100 supaya bilah tidak meluber bila data di luar rentang.
  const persen = progres === undefined ? undefined : Math.min(100, Math.max(0, progres))

  return (
    <div className="bg-card relative flex flex-col gap-2 px-4 py-4 sm:px-5">
      {/* Baris atas: [titik status] label ........ ikon netral */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs font-medium">
          {n.titik && (
            <>
              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", n.titik)} />
              {/* Titik tidak terbaca pembaca layar, jadi statusnya ditulis. */}
              <span className="sr-only">({nada})</span>
            </>
          )}
          <span className="truncate">{label}</span>
        </p>
        <Ikon icon={icon} className="text-muted-foreground/70 size-4 shrink-0" />
      </div>

      {/* Angka + keterangan */}
      <div className="min-w-0">
        <p
          title={judulLengkap}
          className={cn("num-display truncate text-xl leading-8 sm:text-2xl", n.angka)}
        >
          {nilai}
        </p>
        {keterangan && <p className="text-muted-foreground mt-0.5 truncate text-xs">{keterangan}</p>}
      </div>

      {persen !== undefined && (
        <div
          role="progressbar"
          aria-label={`Progres ${label}`}
          aria-valuenow={persen}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-border/60 absolute inset-x-0 bottom-0 h-0.5"
        >
          <div className={cn("h-full transition-[width] duration-500", n.bilah)} style={{ width: `${persen}%` }} />
        </div>
      )}
    </div>
  )
}