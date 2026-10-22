"use client"

// features/dashboard/components/konfigurasi/konfigurasi-dialog.tsx — penyunting
// satu kunci konfigurasi.
//
// KENAPA BARU ADA SEKARANG. Endpoint `PATCH /konfigurasi/:kunci` sudah lama
// ada dan sudah ber-upsert, tapi tidak ada satu pun layar yang memanggilnya —
// halaman Konfigurasi cuma memajang tabel. Akibatnya setiap kunci baru hanya
// bisa disetel lewat panggilan API manual, dan fitur yang bersandar padanya
// (mis. LIBUR_NASIONAL untuk pewarnaan hari di layar Setoran Harian) praktis
// mati sebelum sempat dipakai.
//
// UPSERT, jadi form yang sama melayani UBAH dan TAMBAH. Kunci baru cukup
// diketik namanya — server yang memutuskan membuat atau memperbarui.
//
// NILAI RAHASIA TIDAK PERNAH DIISIKAN KE FORM. Server mengirim "••••••••"
// untuk pemakai non-SUPER_ADMIN, dan menaruh topeng itu ke dalam kotak isian
// berarti menyimpan kembali delapan bulatan sebagai nilai sebenarnya —
// merusak kunci yang tidak pernah dilihat penyuntingnya.

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { kirimJson, ApiError } from "../../lib/api-client"

export interface BarisKonfigurasi {
  kunci: string
  nilai: string
  deskripsi?: string | null
  tipe?: string | null
  isRahasia?: boolean
}

const MASK = "••••••••"

/// Kunci yang dikenal beserta cara mengisinya. Bukan daftar tertutup — kunci
/// apa pun tetap bisa disunting — melainkan bantuan untuk yang bentuk
/// nilainya tidak bisa ditebak dari namanya.
const PETUNJUK: Record<string, string> = {
  LIBUR_NASIONAL:
    "Tanggal merah nasional, format YYYY-MM-DD dipisah koma atau baris baru. Contoh: 2026-08-17, 2026-12-25. Dipakai mewarnai kolom tanggal di Setoran Harian.",
  AMBANG_ANOMALI_PERSEN:
    "Batas penyimpangan pemakaian (%) sebelum sebuah pembacaan disebut anomali. Contoh: 50.",
}

export function KonfigurasiDialog({
  konfigurasi,
  onTutup,
  onTersimpan,
}: {
  /** null = mode TAMBAH kunci baru; berisi baris = mode UBAH. */
  konfigurasi: BarisKonfigurasi | null
  /** true = dialog terbuka untuk menambah kunci baru. */
  tambah?: boolean
  onTutup: () => void
  onTersimpan: () => void
}) {
  const mode = konfigurasi ? "ubah" : "tambah"
  const rahasiaTersamar = konfigurasi?.isRahasia === true && konfigurasi.nilai === MASK

  const [kunci, setKunci] = React.useState(konfigurasi?.kunci ?? "")
  const [nilai, setNilai] = React.useState(rahasiaTersamar ? "" : (konfigurasi?.nilai ?? ""))
  const [deskripsi, setDeskripsi] = React.useState(konfigurasi?.deskripsi ?? "")
  const [menyimpan, setMenyimpan] = React.useState(false)
  const [galat, setGalat] = React.useState<string | null>(null)

  const petunjuk = PETUNJUK[kunci.trim().toUpperCase()]

  async function simpan() {
    const k = kunci.trim().toUpperCase()
    if (k === "") { setGalat("Nama kunci wajib diisi."); return }
    if (nilai.trim() === "") { setGalat("Nilai wajib diisi — server menolak nilai kosong."); return }

    setMenyimpan(true)
    setGalat(null)
    try {
      await kirimJson(`/konfigurasi/${encodeURIComponent(k)}`, "PATCH", {
        nilai: nilai.trim(),
        deskripsi: deskripsi.trim() === "" ? null : deskripsi.trim(),
      })
      onTersimpan()
      onTutup()
    } catch (e) {
      setGalat(
        e instanceof ApiError
          ? e.message
          : "Gagal menyimpan. Perubahan konfigurasi hanya untuk peran Admin ke atas."
      )
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <Dialog open onOpenChange={(buka) => { if (!buka && !menyimpan) onTutup() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "tambah" ? "Tambah kunci konfigurasi" : `Ubah ${konfigurasi?.kunci}`}</DialogTitle>
          <DialogDescription>
            Nilai berlaku langsung tanpa rilis ulang. Kunci yang belum ada akan dibuat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kunci">Kunci</Label>
            <Input
              id="kunci"
              value={kunci}
              // Nama kunci TIDAK bisa diubah pada mode ubah: mengetik nama lain
              // di sini bukan "mengganti nama", melainkan diam-diam membuat
              // kunci kedua dan meninggalkan yang lama apa adanya.
              disabled={mode === "ubah"}
              onChange={(e) => setKunci(e.target.value.toUpperCase())}
              placeholder="LIBUR_NASIONAL"
              className="font-mono"
            />
            {petunjuk && <p className="text-xs text-muted-foreground">{petunjuk}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nilai">Nilai</Label>
            <Textarea
              id="nilai"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              placeholder={kunci.trim().toUpperCase() === "LIBUR_NASIONAL" ? "2026-08-17, 2026-12-25" : ""}
            />
            {rahasiaTersamar && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Kunci ini rahasia dan nilainya disamarkan server. Kotak sengaja dikosongkan —
                mengisinya akan MENIMPA nilai lama.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deskripsi">Keterangan</Label>
            <Input
              id="deskripsi"
              value={deskripsi ?? ""}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Untuk apa kunci ini dipakai"
            />
          </div>

          {galat && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{galat}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onTutup} disabled={menyimpan}>Batal</Button>
          <Button onClick={() => void simpan()} disabled={menyimpan}>
            {menyimpan && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
