"use client"

// features/dashboard/components/anomali/panel-detail-sambungan.tsx
//
// Panel yang terbuka saat satu baris daftar anomali diklik.
//
// KENAPA ADA: tabel induk hanya sanggup memuat satu sel per sambungan
// ("periode · hasil"). Padahal yang dikirim petugas dari lapangan jauh lebih
// banyak — TIGA foto bukti, kondisi segel, titik GPS, angka meter yang
// ditemukan, dan catatannya. Tanpa panel ini semua itu masuk database dan
// tidak pernah terlihat siapa pun, yang membuat kewajiban memotretnya jadi
// pekerjaan sia-sia.
//
// URUTAN ISINYA disengaja: KUNJUNGAN dulu, baru RIWAYAT PEMBACAAN. Pertanyaan
// yang membawa orang membuka panel ini selalu "apa yang ditemukan petugas di
// sana?", bukan "berapa angka meternya setahun terakhir".

import * as React from "react"
import { MapPin, Camera, StickyNote, Gauge, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react"
import { LABEL_HASIL, LABEL_KATEGORI, LABEL_KONDISI } from "@workspace/domain/anomali"
import { Badge } from "@workspace/ui/components/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ambilRiwayatSambunganAction,
  type HasilRiwayat,
  type RiwayatSambungan,
} from "../../actions/anomali"

const angka = (x: number) => x.toLocaleString("id-ID")

function labelPeriode(thbl: number): string {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  return `${bulan[(thbl % 100) - 1] ?? "?"} ${Math.floor(thbl / 100)}`
}

function tanggal(nilai: string | Date): string {
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

/// Satu foto bukti. Dibungkus <a> supaya bisa dibuka ukuran penuh — angka
/// meter di foto kecil kerap tidak terbaca, dan itu justru gunanya.
function FotoBukti({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-lg border transition hover:border-primary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL berasal dari
          penyimpanan berkas eksternal (Cloudinary) yang host-nya tidak
          didaftarkan di next.config; <img> polos menghindari proxy optimasi
          yang akan menolaknya. */}
      <img src={url} alt={`Foto ${label}`} className="aspect-[4/3] w-full bg-muted object-contain" />
      <p className="border-t px-2 py-1 text-center text-[11px] text-muted-foreground group-hover:text-foreground">
        {label}
      </p>
    </a>
  )
}

/// Segel punya TIGA keadaan, bukan dua: null berarti tidak diperiksa (mis.
/// meter tidak terjangkau), yang sama sekali berbeda maknanya dari "putus".
function StatusSegel({ isSegel }: { isSegel: boolean | null }) {
  if (isSegel === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <ShieldQuestion className="h-3.5 w-3.5" />
        Segel tidak diperiksa
      </span>
    )
  }
  return isSegel ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-600">
      <ShieldCheck className="h-3.5 w-3.5" />
      Segel utuh
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-amber-600">
      <ShieldAlert className="h-3.5 w-3.5" />
      Segel tidak utuh
    </span>
  )
}

function KartuKunjungan({ k }: { k: RiwayatSambungan["kunjungan"][number] }) {
  const foto = [
    { url: k.fotoUrl, label: "Stand meter" },
    { url: k.fotoSegelUrl, label: "Segel" },
    { url: k.fotoRumahUrl, label: "Rumah" },
  ].filter((f): f is { url: string; label: string } => f.url != null && f.url.length > 0)

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{LABEL_HASIL[k.hasil] ?? k.hasil}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {labelPeriode(k.periode)} · {tanggal(k.dikunjungiAt)}
            {k.pencatat?.namaLapangan ? ` · ${k.pencatat.namaLapangan}` : ""}
          </p>
        </div>
        <Badge variant="outline">{LABEL_KATEGORI[k.kategori] ?? k.kategori}</Badge>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Saat dikunjungi: {k.bulanBerturut} bulan tidak terbaca · {angka(k.m3TanpaDasar)} m³ ditagih
        tanpa dasar
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {k.standDitemukan !== null && (
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
            Stand ditemukan: <strong className="tabular-nums">{angka(k.standDitemukan)}</strong>
          </span>
        )}
        <StatusSegel isSegel={k.isSegel} />
        {k.latitude !== null && k.longitude !== null && (
          <a
            href={`https://www.google.com/maps?q=${k.latitude},${k.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" />
            Titik kunjungan
          </a>
        )}
      </div>

      {k.catatan && (
        <div className="mt-3 flex gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="leading-relaxed">{k.catatan}</p>
        </div>
      )}

      {foto.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {foto.map((f) => (
            <FotoBukti key={f.label} url={f.url} label={f.label} />
          ))}
        </div>
      ) : (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          Tidak ada foto bukti pada kunjungan ini.
        </p>
      )}
    </div>
  )
}

/// Laporan yang datang lewat jalur PENCATATAN RUTIN, bukan kunjungan anomali.
/// Bentuknya sengaja mirip kartu kunjungan — bagi pembaca, keduanya menjawab
/// pertanyaan yang sama ("apa yang ditemukan petugas di sana?"), dan yang
/// membedakan hanya lewat pintu mana ia masuk. Itu ditandai lencana, bukan
/// dengan tata letak yang berbeda.
function KartuLaporanLapangan({ l }: { l: RiwayatSambungan["laporanLapangan"][number] }) {
  const foto = [
    { url: l.fotoStandUrl, label: "Stand meter" },
    { url: l.fotoSegelUrl, label: "Segel" },
    { url: l.fotoRumahUrl, label: "Rumah" },
  ].filter((f): f is { url: string; label: string } => f.url != null && f.url.length > 0)

  return (
    <div className="rounded-xl border border-dashed p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {LABEL_KONDISI[l.kondisi] ?? l.kondisi} · stand {angka(l.standAkhir)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {labelPeriode(l.periode)}
            {l.tanggalCatat ? ` · ${tanggal(l.tanggalCatat)}` : ""}
            {l.pencatat?.namaLapangan ? ` · ${l.pencatat.namaLapangan}` : ""}
          </p>
        </div>
        {/* Status verifikasi ADALAH informasinya: angka yang belum diperiksa
            tidak boleh dibaca sebagai fakta yang sudah tegak. */}
        <Badge variant={l.isVerified ? "secondary" : "outline"}>
          {l.isVerified ? "Terverifikasi" : "Menunggu verifikasi"}
        </Badge>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Dari pencatatan rutin ({l.kategori}) — {angka(l.standAwal)} → {angka(l.standAkhir)},
        pemakaian {angka(l.pemakaian)} m³
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        <StatusSegel isSegel={l.isSegel} />
        {l.latCatat !== null && l.longCatat !== null && (
          <a
            href={`https://www.google.com/maps?q=${l.latCatat},${l.longCatat}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" />
            Titik pencatatan
          </a>
        )}
      </div>

      {foto.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {foto.map((f) => (
            <FotoBukti key={f.label} url={f.url} label={f.label} />
          ))}
        </div>
      ) : (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          Tidak ada foto bukti pada laporan ini.
        </p>
      )}
    </div>
  )
}

function IsiPanel({ hasil }: { hasil: HasilRiwayat }) {
  if (hasil.status === "tidak-berwenang") {
    return <p className="p-1 text-sm text-muted-foreground">Anda tidak berwenang membuka data ini.</p>
  }
  if (hasil.status === "tidak-ditemukan") {
    return <p className="p-1 text-sm text-muted-foreground">Sambungan tidak ditemukan.</p>
  }
  if (hasil.status === "galat") {
    return <p className="p-1 text-sm text-destructive">{hasil.pesan}</p>
  }

  const { pelanggan, tunggakan, pembacaan, kunjungan, laporanLapangan } = hasil.data

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sambungan
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Rute</dt>
            <dd>{pelanggan.rute?.kode ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>{pelanggan.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kelurahan</dt>
            <dd>{pelanggan.kelurahan?.nama ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tunggakan</dt>
            <dd>
              {tunggakan.jumlahRekening === 0
                ? "rutin bayar"
                : `${tunggakan.jumlahRekening} rek · Rp ${angka(tunggakan.nominal)}`}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kunjungan ({kunjungan.length})
        </p>
        {kunjungan.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Belum ada kunjungan anomali khusus untuk sambungan ini.
            {laporanLapangan.length > 0 && " Tapi petugas sudah mendatanginya lewat pencatatan rutin — lihat di bawah."}
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {kunjungan.map((k) => (
              <KartuKunjungan key={k.id} k={k} />
            ))}
          </div>
        )}
      </section>

      {laporanLapangan.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Laporan dari pencatatan rutin ({laporanLapangan.length})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dikirim dari layar catat lapangan, bukan lewat kunjungan anomali — karena itu tidak
            terhitung di kolom &ldquo;kunjungan terakhir&rdquo;.
          </p>
          <div className="mt-2 space-y-3">
            {laporanLapangan.map((l) => (
              <KartuLaporanLapangan key={l.id} l={l} />
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Riwayat pembacaan
        </p>
        {pembacaan.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Belum ada pembacaan tercatat.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Periode</th>
                  <th className="pb-2 font-medium">Kondisi</th>
                  <th className="pb-2 text-right font-medium">Stand</th>
                  <th className="pb-2 text-right font-medium">m³</th>
                </tr>
              </thead>
              <tbody>
                {pembacaan.map((p) => (
                  <tr key={p.periode} className="border-b last:border-0">
                    <td className="py-2">{labelPeriode(p.periode)}</td>
                    <td className="py-2 text-xs">
                      {LABEL_KONDISI[p.kondisi] ?? p.kondisi}
                      {/* Taksiran ditandai: angkanya ADA tapi bukan hasil baca,
                          dan membedakannya itulah inti seluruh modul ini. */}
                      {p.alasanTaksir && (
                        <span className="ml-1 text-muted-foreground">(taksir)</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{angka(p.standAkhir ?? 0)}</td>
                    <td className="py-2 text-right tabular-nums">{angka(p.pemakaianM3 ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export function PanelDetailSambungan({
  pelangganId,
  nomorLangganan,
  nama,
  alamat,
  onTutup,
}: {
  /// null = panel tertutup. Dikendalikan induk supaya baris tabel tetap jadi
  /// satu-satunya pemicu, tanpa menyalin state buka/tutup ke tiap baris.
  pelangganId: string | null
  nomorLangganan: string
  nama: string
  alamat: string | null
  onTutup: () => void
}) {
  // Hasil disimpan BERSAMA id yang melahirkannya, bukan sendirian. Panel bisa
  // berpindah sambungan sebelum permintaan sebelumnya selesai; dengan id ikut
  // tersimpan, jawaban milik baris yang sudah ditinggalkan tidak pernah cocok
  // dan otomatis terbaca sebagai "masih memuat" — tanpa perlu mereset state di
  // dalam effect, yang justru memicu render berantai.
  const [muat, setMuat] = React.useState<{ id: string; hasil: HasilRiwayat } | null>(null)
  const hasil = muat != null && muat.id === pelangganId ? muat.hasil : null

  React.useEffect(() => {
    if (pelangganId == null) return
    let aktif = true
    void ambilRiwayatSambunganAction(pelangganId).then((r) => {
      if (aktif) setMuat({ id: pelangganId, hasil: r })
    })
    return () => {
      aktif = false
    }
  }, [pelangganId])

  return (
    <Sheet open={pelangganId != null} onOpenChange={(buka) => !buka && onTutup()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm font-normal text-muted-foreground">
            {nomorLangganan}
          </SheetTitle>
          <SheetDescription asChild>
            <div>
              <p className="text-base font-semibold text-foreground">{nama}</p>
              {alamat && <p className="text-sm text-muted-foreground">{alamat}</p>}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {hasil == null ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <IsiPanel hasil={hasil} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
