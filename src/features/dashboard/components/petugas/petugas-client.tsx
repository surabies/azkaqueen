"use client"

// features/dashboard/components/petugas/petugas-client.tsx
//
// PETUGAS LAPANGAN — dipisahkan dari halaman Organisasi.
//
// Sebelumnya Pencatat menumpang sebagai tab keempat di /dashboard/organisasi,
// bersama Divisi/Bagian/Sub-bagian. Itu menyatukan dua hal yang berbeda
// jenisnya: tiga yang pertama adalah STRUKTUR JABATAN kantor, sedangkan
// Pencatat adalah ORANG YANG BEKERJA DI LAPANGAN — jembatan nama di berkas
// sumber ke akun sistem, dengan rute dan jenis tugasnya sendiri. Menaruhnya
// di satu halaman membuat orang mencari penyetelan petugas di menu struktur
// organisasi, dan itu memang membingungkan.
//
// Halaman ini menjawab satu pertanyaan: SIAPA bekerja di lapangan, dan
// mengerjakan APA.

import * as React from "react"
import { Gauge, ScanSearch, Link2, Loader2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ambilList, kirimJson, ApiError } from "../../lib/api-client"

type JenisTugas = "PENCATAT_METER" | "PENYELIA_ANOMALI"

interface Pencatat {
  id: string
  namaLapangan: string
  namaLengkap: string | null
  nip: string | null
  jenisTugas: JenisTugas
  isAktif: boolean
  user: { id: string; name: string | null; email: string | null } | null
  _count?: { penugasanRute: number }
}

const JENIS: {
  nilai: JenisTugas
  label: string
  ikon: React.ComponentType<{ className?: string }>
  jelas: string
}[] = [
  {
    nilai: "PENCATAT_METER",
    label: "Pencatat meter",
    ikon: Gauge,
    jelas: "Membaca meter pada rute yang ditugaskan. Datanya dibatasi rutenya.",
  },
  {
    nilai: "PENYELIA_ANOMALI",
    label: "Penyelia anomali",
    ikon: ScanSearch,
    jelas:
      "Mendatangi sambungan yang meternya berbulan-bulan tidak terbaca. Menerima daftar SELURUH wilayah, bukan satu rute, dan memilih sendiri mana yang didatangi.",
  },
]

export function PetugasClient({ bolehUbah }: { bolehUbah: boolean }) {
  const [baris, setBaris] = React.useState<Pencatat[] | null>(null)
  const [cari, setCari] = React.useState("")
  const [galat, setGalat] = React.useState<string | null>(null)
  const [menyimpan, setMenyimpan] = React.useState<string | null>(null)

  const muat = React.useCallback(async () => {
    setGalat(null)
    try {
      const hasil = await ambilList<Pencatat>("/pencatat", { perPage: "200" })
      setBaris(hasil.rows)
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : "Gagal memuat daftar petugas.")
    }
  }, [])

  React.useEffect(() => {
    void muat()
  }, [muat])

  async function ubahJenis(p: Pencatat, jenis: JenisTugas) {
    if (p.jenisTugas === jenis || !bolehUbah) return
    setMenyimpan(p.id)
    setGalat(null)
    // Diperbarui optimistis: perubahan ini kecil dan sering, dan menunggu
    // perjalanan jaringan untuk melihat tombol berpindah membuatnya terasa
    // rusak. Bila gagal, nilainya dikembalikan dan alasannya ditampilkan.
    const sebelum = p.jenisTugas
    setBaris((v) => v?.map((x) => (x.id === p.id ? { ...x, jenisTugas: jenis } : x)) ?? null)
    try {
      await kirimJson(`/pencatat/${p.id}`, "PATCH", { jenisTugas: jenis })
    } catch (e) {
      setBaris((v) => v?.map((x) => (x.id === p.id ? { ...x, jenisTugas: sebelum } : x)) ?? null)
      setGalat(e instanceof ApiError ? e.message : "Gagal menyimpan perubahan.")
    } finally {
      setMenyimpan(null)
    }
  }

  const terlihat = (baris ?? []).filter((p) => {
    const q = cari.trim().toLowerCase()
    if (!q) return true
    return (
      p.namaLapangan.toLowerCase().includes(q) ||
      (p.namaLengkap ?? "").toLowerCase().includes(q) ||
      (p.nip ?? "").toLowerCase().includes(q)
    )
  })

  const jumlahPenyelia = (baris ?? []).filter((p) => p.jenisTugas === "PENYELIA_ANOMALI").length

  return (
    <div className="space-y-4">
      {galat && (
        <Alert variant="destructive">
          <AlertDescription>{galat}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {JENIS.map((j) => {
          const Ikon = j.ikon
          const jml = (baris ?? []).filter((p) => p.jenisTugas === j.nilai).length
          return (
            <div key={j.nilai} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Ikon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{j.label}</span>
                <span className="ml-auto text-lg font-semibold tabular-nums">{jml}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{j.jelas}</p>
            </div>
          )
        })}
      </div>

      {jumlahPenyelia === 0 && baris !== null && (
        <Alert>
          <AlertDescription>
            Belum ada petugas bertugas sebagai <strong>penyelia anomali</strong>. Selama belum ada,
            daftar sambungan tidak terukur tidak akan pernah didatangi siapa pun.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-base font-semibold">Petugas lapangan</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Peran akun tetap <span className="font-mono">PELAKSANA</span>; yang diatur di sini
              adalah pekerjaan dan cakupan datanya.
            </p>
          </div>
          <Input
            autoComplete="off"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau NIP…"
            className="h-9 w-full max-w-xs rounded-xl"
          />
        </div>

        {baris === null ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
          </div>
        ) : terlihat.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Tidak ada petugas yang cocok.
          </p>
        ) : (
          <ul className="divide-y">
            {terlihat.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.namaLapangan}</span>
                    {!p.isAktif && <Badge variant="secondary">non-aktif</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.namaLengkap ?? "—"}
                    {p.nip ? ` · NIP ${p.nip}` : ""}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    {p.user ? (p.user.name ?? p.user.email) : "belum tertaut akun"}
                    {p.jenisTugas === "PENCATAT_METER" && (
                      <span className="ml-2">· {p._count?.penugasanRute ?? 0} rute</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-xl border p-1">
                  {JENIS.map((j) => {
                    const aktif = p.jenisTugas === j.nilai
                    const Ikon = j.ikon
                    return (
                      <button
                        key={j.nilai}
                        onClick={() => ubahJenis(p, j.nilai)}
                        disabled={!bolehUbah || menyimpan === p.id}
                        title={bolehUbah ? j.jelas : "Perlu wewenang supervisor ke atas"}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          aktif
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted disabled:hover:bg-transparent"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {menyimpan === p.id && aktif ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Ikon className="h-3.5 w-3.5" />
                        )}
                        {j.label}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
