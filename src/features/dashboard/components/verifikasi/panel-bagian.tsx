"use client"

// features/dashboard/components/verifikasi/panel-bagian.tsx — potongan kecil
// yang dipakai kedua panel verifikasi (lapangan & mandiri): micro-label
// bagian, grid stand 3 kolom, badge status, dan empty state panel.
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GAYA_TAHAP } from "./warna-ring"

export function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{judul}</p>
      {children}
    </div>
  )
}

/// Kelas kolom ditulis utuh, bukan dirangkai (`grid-cols-${n}`) — Tailwind
/// memindai source secara statis, kelas hasil interpolasi tidak ikut ter-generate.
const KOLOM_GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

export interface SelStand {
  label: string
  nilai: number
}

/// Murni penampil angka — panel detail tidak punya aksi; koreksi/verifikasi
/// dipicu dari menu klik kanan pada baris tabel.
export function GridStand({ sel }: { sel: SelStand[] }) {
  return (
    <div className={cn("grid gap-px border border-border/70 bg-border/70", KOLOM_GRID[sel.length] ?? "grid-cols-3")}>
      {sel.map((s) => (
        <div key={s.label} className="bg-muted/30 px-2.5 py-2" title={s.nilai.toLocaleString("id-ID")}>
          <p className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">{s.label}</p>
          <p className="mt-0.5 truncate font-mono text-sm font-bold tabular-nums text-foreground">
            {s.nilai.toLocaleString("id-ID")}
          </p>
        </div>
      ))}
    </div>
  )
}

/// Nada warna sama dengan selStatus di grids/sel.tsx supaya panel dan tabel
/// membaca status dengan bahasa visual yang identik.
const BADGE_STATUS: Record<string, { label: string; kelas: string }> = {
  MENUNGGU:     { label: "Menunggu",      kelas: GAYA_TAHAP.MENUNGGU.lencana },
  MENUNGGU_V1:  { label: "Menunggu V1",   kelas: GAYA_TAHAP.MENUNGGU.lencana },
  MENUNGGU_V2:  { label: "Menunggu V2",   kelas: GAYA_TAHAP.V1.lencana },
  MENUNGGU_V3:  { label: "Menunggu V3",   kelas: GAYA_TAHAP.V2.lencana },
  RESMI:        { label: "Resmi",         kelas: GAYA_TAHAP.V3.lencana },
  DIVERIFIKASI: { label: "Terverifikasi", kelas: GAYA_TAHAP.V3.lencana },
  DIGUNAKAN:    { label: "Digunakan",     kelas: GAYA_TAHAP.V3.lencana },
  DITOLAK:      { label: "Cek ulang",     kelas: GAYA_TAHAP.DITOLAK.lencana },
}

export function BadgeStatusVerif({ status }: { status: string }) {
  const cfg = BADGE_STATUS[status] ?? { label: status, kelas: "border-border bg-muted text-muted-foreground" }
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.kelas)}>
      {cfg.label}
    </span>
  )
}

export function PanelKosong({ icon: Icon, pesan }: { icon: LucideIcon; pesan: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
      <Icon className="size-5 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{pesan}</p>
    </div>
  )
}