"use client"

// features/dashboard/components/laporan-harian/laporan-harian-client.tsx —
// dua tab untuk dua pertanyaan yang berbeda pada data yang sama.
//
//   • DAFTAR SETORAN — "cari setoran ini". Tabel seluruh baris, bisa dicari,
//     disaring, dan diekspor. Bentuknya sama dengan halaman data lain.
//   • PROGRES HARIAN — "pekerjaan hari ini bagaimana". Per petugas per
//     tanggal, lengkap dengan siapa yang belum menyetor.
//
// Keduanya sengaja TIDAK ditumpuk dalam satu gulungan: yang pertama dibuka
// saat mencari sesuatu yang spesifik, yang kedua dibuka tiap pagi untuk
// menagih pekerjaan. Menaruh keduanya berurutan membuat yang dipakai harian
// terdorong ke bawah tabel 22 ribu baris.
//
// Tab DAFTAR tetap yang pertama: halaman ini sudah lama berupa tabel, dan
// memindahkan orang ke layar lain tanpa diminta hanya membuat mereka
// mencari-cari.

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ambilSatu } from "../../lib/api-client"
import { LaporanHarianGrid } from "../grids/laporan-harian-grid"
import { ProgresHarian } from "./progres-harian"

export function LaporanHarianClient() {
  // Daftar periode dipakai dropdown di tab progres. Diambil di sini, bukan
  // di dalam tab, supaya berpindah tab tidak memicu permintaan ulang.
  const [periodes, setPeriodes] = React.useState<number[]>([])

  React.useEffect(() => {
    let batal = false
    ambilSatu<{ periodes: number[] }>("/laporan-harian/stats", {})
      .then((s) => { if (!batal) setPeriodes(s.periodes) })
      .catch(() => {
        // Tab daftar tetap berfungsi tanpa daftar periode; tab progres yang
        // akan bilang datanya belum ada.
      })
    return () => { batal = true }
  }, [])

  return (
    // flex + min-h-0: tab daftar berisi DataGrid yang mengisi tinggi sisa
    // layar (gulirnya internal), jadi rantai tingginya tidak boleh putus di
    // pembungkus ini.
    <Tabs defaultValue="daftar" className="flex h-full min-h-0 flex-col gap-4">
      <TabsList className="shrink-0">
        <TabsTrigger value="daftar">Daftar setoran</TabsTrigger>
        <TabsTrigger value="progres">Progres harian</TabsTrigger>
      </TabsList>

      <TabsContent value="daftar" className="min-h-0 flex-1">
        <LaporanHarianGrid />
      </TabsContent>

      {/* Tab progres MENGALIR (bukan tinggi tetap): isinya kartu, grafik, dan
          tabel matriks yang panjangnya mengikuti jumlah petugas. */}
      <TabsContent value="progres" className="scrollbar-tipis min-h-0 flex-1 overflow-y-auto">
        <ProgresHarian periodes={periodes} />
      </TabsContent>
    </Tabs>
  )
}
