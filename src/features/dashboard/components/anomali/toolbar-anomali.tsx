"use client"

// features/dashboard/components/anomali/toolbar-anomali.tsx — bilah penyaring
// daftar sambungan tidak terukur.
//
// Disusun dua baris dengan pembagian yang sama seperti toolbar-verifikasi:
// baris 1 = yang dipakai setiap hari (cari, kategori, wilayah), baris 2 = yang
// dipakai saat menyiapkan kunjungan (urutan, ambang bulan, saringan lanjut).
//
// PENCARIAN ADA DI PALING KIRI DAN PALING LEBAR karena pertanyaan yang paling
// sering dibawa orang ke halaman ini bukan "mana yang paling parah" — itu
// sudah dijawab urutan bawaannya — melainkan "sambungan ini bagaimana".

import * as React from "react"
import { RotateCcw, Search } from "lucide-react"
import {
  KONDISI_ANOMALI, LABEL_KONDISI, SEMUA_KATEGORI, labelKategoriLengkap,
  type KategoriAnomali,
} from "@workspace/domain/anomali"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@workspace/ui/components/select"
import type { FilterAnomali } from "../../actions/anomali"
import { KELAS_ISIAN, KELAS_LEBAR_SARINGAN, UKURAN_KONTROL } from "../kontrol"

export const FILTER_AWAL: FilterAnomali = {
  q: "",
  kategori: "SEMUA",
  kondisi: "",
  hanyaPrioritas: false,
  sembunyikanSudahDikunjungi: false,
  kelurahan: "",
  ambangBulan: 3,
  urutan: "paparan",
  batas: 300,
}

/// Sejajar dengan PILIHAN_UKURAN di toolbar-verifikasi, dipendekkan karena
/// daftar ini tidak dipakai borongan seperti antrean verifikasi.
const PILIHAN_BATAS = [100, 300, 1000, 2000, 5000] as const

/// Ambang bulan MENGUBAH DEFINISI anomali, bukan sekadar menyaring hasilnya:
/// pada ambang 6 sebuah sambungan yang 4 bulan tidak terbaca bukan anomali
/// sama sekali. Karena itu ia diberi label yang menyebut akibatnya.
const PILIHAN_AMBANG = [2, 3, 4, 6, 12] as const

export function ToolbarAnomali({
  filter,
  onGanti,
  kelurahanTersedia,
  jumlahTampil,
  memuat,
}: {
  filter: FilterAnomali
  onGanti: (f: FilterAnomali) => void
  kelurahanTersedia: string[]
  jumlahTampil: number
  memuat: boolean
}) {
  const [cari, setCari] = React.useState(filter.q)

  // Ditunda 350 ms — mengetik 11 digit nomor langganan tidak boleh memicu 11
  // perhitungan ulang daftar di server.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (cari !== filter.q) onGanti({ ...filter, q: cari })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari])

  // Kotak cari ikut dikosongkan bila filter direset dari luar ("Bersihkan
  // saringan"). Disetel SELAGI render — pola resmi React untuk menyesuaikan
  // state terhadap prop yang berubah; lewat effect, kotaknya akan sempat
  // terlihat masih berisi satu frame setelah daftarnya sudah bersih.
  const [qTerakhir, setQTerakhir] = React.useState(filter.q)
  if (filter.q !== qTerakhir) {
    setQTerakhir(filter.q)
    if (filter.q === "") setCari("")
  }

  const set = <K extends keyof FilterAnomali>(k: K, v: FilterAnomali[K]) =>
    onGanti({ ...filter, [k]: v })

  /// Pilihan kondisi mengikuti kategori yang sedang dipilih. Menampilkan
  /// seluruh 15 kondisi saat kategorinya sudah dipersempit hanya menawarkan
  /// kombinasi yang pasti kosong.
  const kondisiTersedia: readonly string[] =
    filter.kategori === "SEMUA"
      ? SEMUA_KATEGORI.flatMap((k) => KONDISI_ANOMALI[k as KategoriAnomali] as readonly string[])
      : (KONDISI_ANOMALI[filter.kategori] as readonly string[])

  const adaFilter =
    filter.q !== "" ||
    filter.kategori !== "SEMUA" ||
    filter.kondisi !== "" ||
    filter.hanyaPrioritas ||
    filter.sembunyikanSudahDikunjungi ||
    filter.kelurahan !== "" ||
    filter.ambangBulan !== FILTER_AWAL.ambangBulan ||
    filter.urutan !== FILTER_AWAL.urutan

  return (
    <div className="flex flex-col gap-2 border border-border/70 bg-card p-2">
      {/* Baris 1 — dipakai setiap hari */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72 sm:shrink-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="cari-anomali"
            autoComplete="off"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari no. langganan, nama, atau alamat…"
            className={`${KELAS_ISIAN} pl-7`}
            aria-label="Cari sambungan"
          />
        </div>

        {/* Kategori DAN kondisi berdampingan, dengan urutan yang menjelaskan
            hubungannya: kategori mengelompokkan menurut tindakan, kondisi
            mempersempit ke satu kode catat di dalamnya. Mengganti kategori
            MENGOSONGKAN kondisi — kalau tidak, "TERKUNCI + RUMAH_KOSONG"
            (kondisi milik kategori lain) menghasilkan daftar kosong yang
            terbaca seperti kerusakan. */}
        <Select
          value={filter.kategori}
          onValueChange={(v) =>
            onGanti({ ...filter, kategori: v as FilterAnomali["kategori"], kondisi: "" })
          }
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-64`} aria-label="Kategori anomali">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua kategori</SelectItem>
            {SEMUA_KATEGORI.map((k) => (
              <SelectItem key={k} value={k}>{labelKategoriLengkap(k)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.kondisi || "SEMUA"}
          onValueChange={(v) => set("kondisi", v === "SEMUA" ? "" : v)}
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-44`} aria-label="Kondisi catat">
            <SelectValue placeholder="Kondisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua kondisi</SelectItem>
            {kondisiTersedia.map((k) => (
              <SelectItem key={k} value={k}>{LABEL_KONDISI[k] ?? k}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filter.kelurahan || "SEMUA"}
          onValueChange={(v) => set("kelurahan", v === "SEMUA" ? "" : v)}
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-48`} aria-label="Kelurahan">
            <SelectValue placeholder="Kelurahan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua kelurahan</SelectItem>
            {kelurahanTersedia.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            {memuat ? "memuat…" : `${jumlahTampil.toLocaleString("id-ID")} sambungan`}
          </Badge>
        </div>
      </div>

      {/* Baris 2 — dipakai saat menyiapkan kunjungan */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filter.urutan}
          onValueChange={(v) => set("urutan", v as FilterAnomali["urutan"])}
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-56`} aria-label="Urutan daftar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paparan">Urut paparan (paling merugikan)</SelectItem>
            {/* Disebut "wilayah", bukan "rute jalan kaki": kolom noUrutRute
                baru terisi untuk segelintir pelanggan, jadi yang benar-benar
                mengelompokkan hari ini adalah kelurahan/RW/RT. Urutan rute
                ikut dipakai begitu datanya ada, tanpa perlu diubah lagi. */}
            <SelectItem value="rute">Urut wilayah (kelurahan → RW → RT)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(filter.ambangBulan)}
          onValueChange={(v) => set("ambangBulan", Number(v))}
        >
          <SelectTrigger size={UKURAN_KONTROL} className={`${KELAS_LEBAR_SARINGAN} sm:w-52`} aria-label="Ambang bulan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PILIHAN_AMBANG.map((n) => (
              <SelectItem key={n} value={String(n)}>
                Minimal {n} bulan tak terbaca
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size={UKURAN_KONTROL}
          variant={filter.hanyaPrioritas ? "default" : "outline"}
          onClick={() => set("hanyaPrioritas", !filter.hanyaPrioritas)}
          aria-pressed={filter.hanyaPrioritas}
        >
          Tanpa tunggakan
        </Button>

        <Button
          size={UKURAN_KONTROL}
          variant={filter.sembunyikanSudahDikunjungi ? "default" : "outline"}
          onClick={() => set("sembunyikanSudahDikunjungi", !filter.sembunyikanSudahDikunjungi)}
          aria-pressed={filter.sembunyikanSudahDikunjungi}
        >
          Sembunyikan yang sudah dikunjungi
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {adaFilter && (
            <Button size={UKURAN_KONTROL} variant="ghost" onClick={() => onGanti(FILTER_AWAL)}>
              <RotateCcw className="size-3.5" aria-hidden /> Bersihkan saringan
            </Button>
          )}
          <Select value={String(filter.batas)} onValueChange={(v) => set("batas", Number(v))}>
            <SelectTrigger size={UKURAN_KONTROL} className="w-36" aria-label="Baris ditampilkan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PILIHAN_BATAS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n.toLocaleString("id-ID")} baris
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
