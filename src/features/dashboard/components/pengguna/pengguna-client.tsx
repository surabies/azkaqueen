"use client"

// features/dashboard/components/pengguna/pengguna-client.tsx — halaman
// Pengguna & akses.
//
// Sebelumnya halaman ini hanya grid BACA-SAJA, padahal server sudah lama
// menyediakan seluruh operasinya: POST /users, PATCH /users/:id, dan endpoint
// terpisah untuk role, status, serta password. Akibatnya akun baru hanya bisa
// dibuat lewat skrip, dan penempatan divisi tidak bisa diperbaiki sama sekali
// dari layar ini.
//
// KLIK BARIS = UBAH. Tidak ada kolom tombol di ujung kanan: barisnya sendiri
// yang jadi sasaran, sehingga tidak perlu digulir mendatar dulu pada tabel
// selebar ini.

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { PenggunaGrid } from "../grids/pengguna-grid"
import { PenggunaDialog, type BarisPengguna } from "./pengguna-dialog"

export function PenggunaClient({
  idSaya,
  roleSaya,
}: {
  idSaya?: string | null
  roleSaya?: string | null
}) {
  /// null = tertutup; { id: "" } = mode tambah; berisi = mode ubah.
  const [dialog, setDialog] = React.useState<BarisPengguna | null | "tambah">(null)
  /// Dinaikkan setelah simpan supaya grid menarik ulang datanya.
  const [refreshKey, setRefreshKey] = React.useState(0)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Klik satu baris untuk mengubah nama, email, username, role, status, atau divisinya.
        </p>
        <Button size="sm" onClick={() => setDialog("tambah")}>
          <Plus className="size-4" aria-hidden /> Tambah pengguna
        </Button>
      </div>

      <PenggunaGrid
        refreshKey={refreshKey}
        onRowClicked={(baris) => setDialog(baris as unknown as BarisPengguna)}
      />

      {dialog != null && (
        <PenggunaDialog
          pengguna={dialog === "tambah" ? null : dialog}
          idSaya={idSaya}
          roleSaya={roleSaya}
          onTutup={() => setDialog(null)}
          onTersimpan={() => setRefreshKey((n) => n + 1)}
        />
      )}
    </div>
  )
}
