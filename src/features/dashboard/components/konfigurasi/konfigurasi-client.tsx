"use client"

// features/dashboard/components/konfigurasi/konfigurasi-client.tsx — tabel
// konfigurasi + penyuntingnya.
//
// Sebelumnya halaman ini hanya tabel. Endpoint upsert-nya sudah ada, tapi
// tanpa pintu di layar — jadi setiap kunci baru menuntut panggilan API
// manual, dan fitur yang bergantung padanya berhenti sebelum mulai.
//
// Klik baris = ubah; tombol "Tambah kunci" = buat baru. Keduanya lewat
// dialog yang sama, karena servernya memang satu endpoint upsert.

import * as React from "react"
import type { ColDef } from "ag-grid-community"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { DataGrid } from "../data-grid"
import { UKURAN_KONTROL } from "../kontrol"
import { selBool, fmtBool, fmtTanggal, KELAS_MONO } from "../grids/sel"
import { KonfigurasiDialog, type BarisKonfigurasi } from "./konfigurasi-dialog"

const KOLOM: ColDef[] = [
  { field: "kunci", headerName: "Kunci", minWidth: 180, cellClass: KELAS_MONO, sortable: true },
  { field: "nilai", headerName: "Nilai", minWidth: 200, flex: 2, cellClass: KELAS_MONO },
  { field: "tipe", headerName: "Tipe", minWidth: 90, maxWidth: 110, sortable: true },
  {
    field: "isRahasia",
    headerName: "Sifat",
    minWidth: 110,
    maxWidth: 130,
    sortable: true,
    cellRenderer: selBool("Rahasia", "Publik", "amber", "netral"),
    valueFormatter: fmtBool("Rahasia", "Publik"),
  },
  { field: "deskripsi", headerName: "Keterangan", minWidth: 200, flex: 2 },
  { field: "updatedAt", headerName: "Diubah", minWidth: 120, sortable: true, valueFormatter: fmtTanggal },
]

export function KonfigurasiClient() {
  const [sunting, setSunting] = React.useState<BarisKonfigurasi | null>(null)
  const [buka, setBuka] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Klik satu baris untuk mengubah nilainya. Perubahan berlaku langsung, tanpa rilis ulang.
        </p>
        <Button
          size={UKURAN_KONTROL}
          variant="outline"
          onClick={() => { setSunting(null); setBuka(true) }}
        >
          <Plus className="size-3.5" aria-hidden /> Tambah kunci
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <DataGrid
          judul="Konfigurasi Sistem"
          endpoint="/konfigurasi"
          columnDefs={KOLOM}
          searchParam="q"
          searchPlaceholder="Cari kunci…"
          refreshKey={refreshKey}
          onRowClicked={(d) => {
            setSunting(d as unknown as BarisKonfigurasi)
            setBuka(true)
          }}
        />
      </div>

      {buka && (
        <KonfigurasiDialog
          konfigurasi={sunting}
          onTutup={() => setBuka(false)}
          onTersimpan={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
