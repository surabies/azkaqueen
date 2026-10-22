"use client"

// features/dashboard/components/verifikasi/toolbar-verifikasi.tsx — bilah
// penyaring layar verifikasi.
//
// Disusun dua baris: baris 1 = pencarian + saringan pokok (periode, status,
// petugas), baris 2 = rentang tanggal + pintasan hari + ukuran halaman.
// Pemisahan ini disengaja — yang di baris 1 dipakai tiap hari, yang di baris
// 2 dipakai saat menelusuri.

import * as React from "react"
import { CalendarDays, Filter, RotateCcw, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@workspace/ui/components/select"
import { formatPeriode } from "@/features/public/lib/format"
import { KELAS_ISIAN, KELAS_LEBAR_SARINGAN, UKURAN_KONTROL } from "../kontrol"

export interface FilterVerifikasi {
  q: string
  periode: number | null
  statusVerif: string
  pencatatId: string
  /// Rute baca meter. Berbeda dari `pencatatId`, dan keduanya memang
  /// dibutuhkan: pencatat menjawab "siapa yang menyetor ini", rute menjawab
  /// "wilayah mana yang sedang saya periksa" — satu pencatat bisa memegang
  /// beberapa rute, dan satu rute bisa berpindah tangan di tengah bulan.
  ruteId: string
  tanggalDari: string
  tanggalSampai: string
  hanyaAnomali: boolean
  pageSize: number
}

export const FILTER_AWAL: FilterVerifikasi = {
  q: "",
  periode: null,
  statusVerif: "",
  pencatatId: "",
  ruteId: "",
  tanggalDari: "",
  tanggalSampai: "",
  hanyaAnomali: false,
  pageSize: 100,
}

/// Batas ATAS 5.000 mengikuti aplikasi lama, tapi batas bawahnya diturunkan
/// sampai 50: 500 baris sekaligus membuat tabel terasa berat untuk pekerjaan
/// sehari-hari yang sebenarnya cuma memeriksa selusin baris. Yang butuh
/// borongan tinggal menaikkannya; yang tidak, tidak perlu membayar ongkosnya.
export const PILIHAN_UKURAN = [50, 100, 200, 500, 1000, 2000, 5000] as const

/// Tanggal LOKAL (WIB), bukan `toISOString()`. toISOString memberi tanggal
/// UTC: dibuka pukul 06.00 WIB, pintasan "Hari ini" akan mengisi tanggal
/// KEMARIN dan hasil saringannya terlihat seperti data yang hilang.
const tanggalLokal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const HARI_INI = () => tanggalLokal(new Date())
const MUNDUR = (hari: number) => {
  const d = new Date()
  d.setDate(d.getDate() - hari)
  return tanggalLokal(d)
}

export function ToolbarVerifikasi({
  filter,
  onGanti,
  periodes,
  pencatats,
  rutes,
  jumlahTampil,
  jumlahTotal,
  memuat,
}: {
  filter: FilterVerifikasi
  onGanti: (f: FilterVerifikasi) => void
  periodes: number[]
  pencatats: { id: string; namaLapangan: string }[]
  rutes: { id: string; kode: string }[]
  jumlahTampil: number
  jumlahTotal: number
  memuat: boolean
}) {
  const [cari, setCari] = React.useState(filter.q)

  // Pencarian ditunda 350 ms — mengetik 11 digit nomor langganan tidak boleh
  // memicu 11 permintaan.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (cari !== filter.q) onGanti({ ...filter, q: cari })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari])

  const set = <K extends keyof FilterVerifikasi>(k: K, v: FilterVerifikasi[K]) =>
    onGanti({ ...filter, [k]: v })

  const adaFilter =
    filter.q !== "" || filter.statusVerif !== "" || filter.pencatatId !== "" || filter.ruteId !== "" ||
    filter.tanggalDari !== "" || filter.tanggalSampai !== "" || filter.hanyaAnomali

  return (
    <div className="border-border/70 bg-card flex flex-col gap-2 border p-2">
      {/* Baris 1 — dipakai setiap hari */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Selebar bilah di ponsel, lebar TETAP begitu ada ruang: `flex-1`
            di layar lega membuatnya melar memakan seluruh sisa bilah,
            padahal 11 digit nomor langganan tidak butuh selebar itu. */}
        <div className="relative w-full sm:w-72 sm:shrink-0">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" aria-hidden />
          <Input
            type="search"
            name="cari-verifikasi"
            autoComplete="off"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari no. langganan atau nama…"
            className={`${KELAS_ISIAN} pl-7`}
            aria-label="Cari laporan"
          />
        </div>

        <Select
          value={filter.periode === null ? "SEMUA" : String(filter.periode)}
          onValueChange={(v) => set("periode", v === "SEMUA" ? null : Number(v))}
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-44`} aria-label="Periode">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua periode</SelectItem>
            {periodes.map((p) => (
              <SelectItem key={p} value={String(p)}>{formatPeriode(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.statusVerif || "SEMUA"} onValueChange={(v) => set("statusVerif", v === "SEMUA" ? "" : v)}>
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-40`} aria-label="Status verifikasi">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua status</SelectItem>
            <SelectItem value="MENUNGGU">Menunggu</SelectItem>
            <SelectItem value="DIVERIFIKASI">Resmi (V3)</SelectItem>
            <SelectItem value="DITOLAK">Cek ulang</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter.pencatatId || "SEMUA"} onValueChange={(v) => set("pencatatId", v === "SEMUA" ? "" : v)}>
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-44`} aria-label="Petugas pencatat">
            <SelectValue placeholder="Petugas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua petugas</SelectItem>
            {pencatats.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.namaLapangan}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter.ruteId || "SEMUA"} onValueChange={(v) => set("ruteId", v === "SEMUA" ? "" : v)}>
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-40`} aria-label="Rute baca meter">
            <SelectValue placeholder="Rute" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua rute</SelectItem>
            {rutes.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.kode}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size={UKURAN_KONTROL}
          variant={filter.hanyaAnomali ? "default" : "outline"}
          onClick={() => set("hanyaAnomali", !filter.hanyaAnomali)}
          aria-pressed={filter.hanyaAnomali}
        >
          <Filter className="size-3.5" aria-hidden /> Hanya anomali
        </Button>
      </div>

      {/* Baris 2 — dipakai saat menelusuri */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
          <CalendarDays className="size-3.5" aria-hidden /> Tanggal catat
        </span>
        <Input
          type="date"
          value={filter.tanggalDari}
          onChange={(e) => set("tanggalDari", e.target.value)}
          className={`${KELAS_ISIAN} min-w-0 flex-1 basis-32 sm:w-40 sm:flex-none sm:basis-auto`}
          aria-label="Tanggal catat dari"
        />
        <span className="text-muted-foreground text-xs">s/d</span>
        <Input
          type="date"
          value={filter.tanggalSampai}
          onChange={(e) => set("tanggalSampai", e.target.value)}
          className={`${KELAS_ISIAN} min-w-0 flex-1 basis-32 sm:w-40 sm:flex-none sm:basis-auto`}
          aria-label="Tanggal catat sampai"
        />

        {/* Pintasan rentang — pekerjaan harian tidak perlu memilih tanggal
            dua kali untuk pertanyaan yang selalu sama. */}
        {([
          ["Hari ini", () => onGanti({ ...filter, tanggalDari: HARI_INI(), tanggalSampai: HARI_INI() })],
          ["7 hari", () => onGanti({ ...filter, tanggalDari: MUNDUR(6), tanggalSampai: HARI_INI() })],
          ["30 hari", () => onGanti({ ...filter, tanggalDari: MUNDUR(29), tanggalSampai: HARI_INI() })],
        ] as const).map(([label, aksi]) => (
          <Button key={label} size={UKURAN_KONTROL} variant="ghost" onClick={aksi}>
            {label}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {adaFilter && (
            <Button
              size={UKURAN_KONTROL}
              variant="ghost"
              onClick={() => onGanti({ ...FILTER_AWAL, periode: filter.periode, pageSize: filter.pageSize })}
            >
              <RotateCcw className="size-3.5" aria-hidden /> Bersihkan saringan
            </Button>
          )}
          <Badge variant="outline" className="tabular-nums">
            {memuat ? "memuat…" : `${jumlahTampil.toLocaleString("id-ID")} / ${jumlahTotal.toLocaleString("id-ID")}`}
          </Badge>
          <Select value={String(filter.pageSize)} onValueChange={(v) => set("pageSize", Number(v))}>
            <SelectTrigger size={UKURAN_KONTROL} className="w-32" aria-label="Baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PILIHAN_UKURAN.map((n) => (
                <SelectItem key={n} value={String(n)}>{n.toLocaleString("id-ID")} baris</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
