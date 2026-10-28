"use client"

// Lembar cetak/PDF A4 bergaya laporan modern: pita judul gelap, identitas
// pelanggan, roda angka stand, kartu pemakaian beraksen biru, grafik periode,
// rincian, lalu foto lapangan. Semua data fungsional lama tetap ada (info,
// catat, riwayat, foto) ditambah koordinat lokasi sebagai pengganti peta.
//
// Di layar lembar ini tersembunyi. Saat mencetak, SEMUA isi halaman lain
// disembunyikan dan hanya lembar ini yang tampil — lewat portal ke <body>
// supaya tidak terpengaruh overflow/tinggi layout. Margin @page dibuat 0
// (sekaligus menghilangkan header/footer bawaan Chrome); jarak tepi diatur
// oleh padding lembar. Warna memakai palet tetap (bukan token tema) agar
// hasil cetak sama di mode terang maupun gelap.
import * as React from "react"
import { flushSync, createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { LABEL_KONDISI_CATAT, LABEL_STATUS_PELANGGAN } from "../../lib/label"
import {
  fmtAngka,
  fmtPeriode,
  fmtPeriodeSingkat,
  fmtRupiah,
  fmtTeks,
  fmtWaktu,
} from "./format"
import { bandingkan } from "./panel-pembacaan"
import type { InfoPelanggan } from "./tipe"

const CSS_CETAK = `
.lembar-cetak { display: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; background: #fff !important; }
  body > *:not(.lembar-cetak) { display: none !important; }
  .lembar-cetak { display: block; }
  .lembar-cetak, .lembar-cetak * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .lembar-cetak section { break-inside: avoid; }
}
`

const NADA_STATUS: Record<string, string> = {
  AKTIF: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TUTUP_SEMENTARA: "bg-amber-50 text-amber-700 border-amber-200",
  DISEGEL: "bg-red-50 text-red-700 border-red-200",
  TUTUP_SPT: "bg-red-50 text-red-700 border-red-200",
}

function Chip({ label, nilai }: { label: string; nilai: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{nilai}</span>
    </span>
  )
}

function RodaAngka({ label, nilai }: { label: string; nilai: number | null }) {
  const teks = nilai == null ? null : String(Math.max(0, Math.trunc(nilai))).padStart(5, "0")
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-1.5 text-[10px] text-slate-500">{label}</p>
      {teks ? (
        <div className="flex gap-[1.5px]">
          {[...teks].map((d, i) => (
            <span
              key={i}
              className="flex h-[9mm] w-[6mm] items-center justify-center rounded-[2px] bg-slate-900 font-mono text-[15px] font-medium text-white"
            >
              {d}
            </span>
          ))}
        </div>
      ) : (
        <p className="h-[9mm] text-[15px] text-slate-400">—</p>
      )}
    </div>
  )
}

function BarisRincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1 last:border-b-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{nilai}</dd>
    </div>
  )
}

function KotakFoto({ judul, src }: { judul: string; src: string | null }) {
  return (
    <figure className="min-w-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Foto ${judul}`}
          loading="eager"
          className="aspect-square w-full rounded-md border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
          Foto tidak dikirim
        </div>
      )}
      <figcaption className="mt-1 text-[10px] text-slate-500">{judul}</figcaption>
    </figure>
  )
}

export function LembarCetak({ data }: { data: InfoPelanggan }) {
  // Portal hanya bisa ke document.body setelah mount di klien.
  const klien = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Waktu cetak diperbarui tepat sebelum dialog cetak dibuka.
  const [waktuCetak, setWaktuCetak] = React.useState(() =>
    fmtWaktu(new Date().toISOString())
  )
  React.useEffect(() => {
    const perbarui = () =>
      flushSync(() => setWaktuCetak(fmtWaktu(new Date().toISOString())))
    window.addEventListener("beforeprint", perbarui)
    return () => window.removeEventListener("beforeprint", perbarui)
  }, [])

  if (!klien) return null

  const { pelanggan: p, catat: c, riwayat, lokasi, foto } = data
  const kondisi = c?.kondisi
    ? ((LABEL_KONDISI_CATAT as Record<string, string>)[c.kondisi] ?? c.kondisi)
    : null
  const labelStatus = p.status
    ? ((LABEL_STATUS_PELANGGAN as Record<string, string>)[p.status] ?? p.status)
    : null
  const banding = c ? bandingkan(c, riwayat) : null

  const batang = c
    ? [
        ...[...riwayat].reverse().map((r) => ({
          periode: r.periode,
          nilai: r.pemakaianM3,
          aktif: false,
        })),
        { periode: c.periode, nilai: c.pemakaianM3, aktif: true },
      ]
    : []
  const maks = Math.max(1, ...batang.map((b) => b.nilai ?? 0))

  return createPortal(
    <div
      className="lembar-cetak bg-white text-slate-900"
      style={{ colorScheme: "light" }}
    >
      <style>{CSS_CETAK}</style>

      {/* Pita judul */}
      <header className="flex items-end justify-between bg-slate-900 px-[12mm] pt-[9mm] pb-[7mm] text-white">
        <div>
          <p className="text-[10px] text-slate-300">
            Tirtawening · Laporan pencatatan meter
          </p>
          <h1 className="mt-1.5 text-[26px] leading-none font-semibold tracking-tight">
            Info Pelanggan
          </h1>
        </div>
        <div className="text-right text-[10px] leading-snug text-slate-300">
          <p className="text-[14px] font-semibold text-white">
            {c ? fmtPeriode(c.periode) : "—"}
          </p>
          <p>Dicetak {waktuCetak}</p>
        </div>
      </header>

      <div className="flex flex-col gap-[6mm] px-[12mm] pt-[8mm] pb-[10mm] text-[11px] leading-snug">
        {/* Identitas */}
        <section>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
                {p.nama || "Tanpa nama"}
              </h2>
              {p.alamat && (
                <p className="mt-1 max-w-[115mm] text-[11px] text-slate-600">{p.alamat}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-500">No. Langganan</p>
              <p className="font-mono text-[15px] font-semibold tabular-nums">
                {p.nomorLangganan}
              </p>
              {labelStatus && (
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full border px-2 py-px text-[10px] font-medium",
                    NADA_STATUS[p.status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-700"
                  )}
                >
                  {labelStatus}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.golongan && <Chip label="Golongan" nilai={p.golongan} />}
            {p.nomorMeter && <Chip label="Meter" nilai={p.nomorMeter} />}
            {p.ukuranMeter && <Chip label="Ukuran" nilai={p.ukuranMeter} />}
            {p.noHp && p.noHp !== "0" && <Chip label="Telepon" nilai={p.noHp} />}
          </div>
        </section>

        {/* Stand & pemakaian */}
        <section>
          {c ? (
            <div className="grid grid-cols-[1fr_1fr_1.15fr] gap-3">
              <RodaAngka label="Stand awal" nilai={c.standLalu} />
              <RodaAngka label="Stand akhir" nilai={c.standAkhir} />
              <div className="rounded-lg bg-blue-600 p-3 text-white">
                <p className="text-[10px] text-blue-100">Pemakaian</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-[34px] leading-none font-semibold tracking-tight tabular-nums">
                    {fmtAngka(c.pemakaianM3)}
                  </span>
                  <span className="text-[13px] text-blue-100">m³</span>
                </p>
                {banding && (
                  <p className="mt-1.5 text-[10px] text-blue-100">{banding.teks}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-slate-500">
              Belum ada pencatatan untuk periode ini.
            </p>
          )}
        </section>

        {/* Grafik + rincian */}
        {c && (
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-[11px] font-semibold">
                Pemakaian per periode <span className="font-normal text-slate-500">(m³)</span>
              </p>
              <div className="flex h-[34mm] gap-2.5">
                {batang.map((b) => (
                  <div key={b.periode} className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-h-0 flex-1 items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-[2px]",
                          b.aktif ? "bg-blue-600" : "bg-slate-300"
                        )}
                        style={{
                          height: `${b.nilai == null ? 0 : Math.max(4, (b.nilai / maks) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center leading-tight">
                      <p className={cn("text-[11px] tabular-nums", b.aktif ? "font-semibold" : "font-medium")}>
                        {fmtAngka(b.nilai)}
                      </p>
                      <p className="text-[9px] text-slate-500">{fmtPeriodeSingkat(b.periode)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-1 text-[11px] font-semibold">Rincian pencatatan</p>
              <dl className="text-[10.5px]">
                <BarisRincian label="Periode" nilai={fmtPeriode(c.periode)} />
                {kondisi && <BarisRincian label="Kondisi" nilai={kondisi} />}
                <BarisRincian label="Petugas" nilai={fmtTeks(c.petugas)} />
                <BarisRincian label="Dicatat" nilai={fmtWaktu(c.waktuCatat)} />
                {c.waktuUpload && (
                  <BarisRincian label="Diunggah" nilai={fmtWaktu(c.waktuUpload)} />
                )}
                {c.biaya != null && <BarisRincian label="Biaya" nilai={fmtRupiah(c.biaya)} />}
                {lokasi && (
                  <BarisRincian
                    label="Koordinat"
                    nilai={`${lokasi.lat.toFixed(6)}, ${lokasi.lng.toFixed(6)}`}
                  />
                )}
              </dl>
            </div>
          </section>
        )}

        {/* Foto */}
        <section>
          <h3 className="mb-2 text-[12px] font-semibold">Foto lapangan</h3>
          <div className="grid grid-cols-3 gap-3">
            <KotakFoto judul="Stand meter" src={foto.stand} />
            <KotakFoto judul="Segel" src={foto.segel} />
            <KotakFoto judul="Rumah" src={foto.rumah} />
          </div>
        </section>

        <footer className="flex justify-between border-t border-slate-200 pt-2 text-[9px] text-slate-400">
          <span>
            Tirtawening · Info Pelanggan {p.nomorLangganan}
            {c ? ` · ${c.periode}` : ""}
          </span>
          <span>Dicetak otomatis dari sistem</span>
        </footer>
      </div>
    </div>,
    document.body
  )
}