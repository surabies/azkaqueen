// Showcase "Melayani Kota Bandung": judul menempel di kiri, di kanan kartu angka bergaya bento.
// Kartu utama (pelanggan aktif) punya gelombang air yang naik saat di-hover; kartu lain punya
// ilustrasi kecil yang menyala bergantian saat masuk layar. Angka menghitung naik dari 0.
// Data dari SHOWCASE (content.ts).
import { HugeiconsIcon } from "@hugeicons/react"
import { DropletIcon, Invoice01Icon } from "@hugeicons/core-free-icons"

import { KartuStat } from "@/components/landing/showcase-kartu"
import { SectionHeading, SectionShell } from "@/components/landing/section-heading"
import { SHOWCASE, type ItemShowcase } from "@/lib/landing/content"

/*
  TAHAP 1 — Gelombang air di dasar kartu utama.
  Dua lapis gelombang bergerak berlawanan arah. Lebar SVG 200% dari kartu dan digeser -50%
  (tepat 2 periode) sehingga putarannya mulus. Saat kartu di-hover, seluruh blok naik
  (translate-y-6 → 0) seperti permukaan air yang terisi.
*/
const GELOMBANG = "M0 60C100 20 200 20 300 60S500 100 600 60S800 20 900 60S1100 100 1200 60V120H0Z"

function Gelombang() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 translate-y-6 transition-transform duration-700 ease-out group-hover:translate-y-0 motion-reduce:transition-none"
    >
      <style>{`
        @keyframes sc-geser { to { transform: translateX(-50%) } }
        .sc-g1 { animation: sc-geser 14s linear infinite }
        .sc-g2 { animation: sc-geser 20s linear infinite reverse }
        @media (prefers-reduced-motion: reduce) { .sc-g1, .sc-g2 { animation: none } }
      `}</style>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="sc-g2 absolute bottom-0 h-full w-[200%]">
        <path d={GELOMBANG} fill="var(--primary)" fillOpacity="0.07" />
      </svg>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="sc-g1 absolute bottom-0 h-[85%] w-[200%]">
        <path d={GELOMBANG} fill="var(--primary)" fillOpacity="0.1" />
      </svg>
    </div>
  )
}

// Titik kecil yang berubah dari abu ke warna utama bergiliran (delay naik per titik)
const titik =
  "bg-border transition-colors duration-500 group-data-[terlihat]:bg-primary motion-reduce:transition-none"

// 21 titik (7 × 3) untuk kartu kelurahan
function TitikKelurahan({ jumlah }: { jumlah: number }) {
  return (
    <div aria-hidden className="grid w-fit grid-cols-7 gap-2">
      {Array.from({ length: jumlah }, (_, i) => (
        <span key={i} className={`size-2 rounded-full ${titik}`} style={{ transitionDelay: `${i * 60}ms` }} />
      ))}
    </div>
  )
}

// 7 segmen untuk kartu kecamatan
function SegmenKecamatan({ jumlah }: { jumlah: number }) {
  return (
    <div aria-hidden className="flex w-full max-w-40 gap-1.5">
      {Array.from({ length: jumlah }, (_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-full ${titik}`} style={{ transitionDelay: `${i * 120}ms` }} />
      ))}
    </div>
  )
}

export function ShowcaseSection() {
  // SHOWCASE memakai "as const"; dipetakan ke tipe ItemShowcase[] agar properti opsional (catatan) bisa dibaca
  const daftar: readonly ItemShowcase[] = SHOWCASE.item

  return (
    <SectionShell>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-12">
        {/* Judul menempel di kiri saat kartu di kanan di-scroll (layar lg) */}
        <SectionHeading className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">{SHOWCASE.judul}</SectionHeading>

        {/*
          TAHAP 2 — Grid bento di kanan.
          lg: 3 kolom → kartu utama selebar penuh, 3 kartu kecil di bawahnya.
          sm: 2 kolom → kartu "rekening" (terakhir) selebar penuh agar tidak sendirian.
        */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          {daftar.map((s) => {
            switch (s.jenis) {
              case "pelanggan":
                return (
                  <KartuStat
                    key={s.jenis}
                    besar
                    nilai={s.nilai}
                    label={s.label}
                    className="min-h-72 sm:col-span-2 lg:col-span-3"
                    latar={<Gelombang />}
                    atas={<HugeiconsIcon icon={DropletIcon} size={28} strokeWidth={1.5} aria-hidden className="text-primary" />}
                  />
                )
              case "kelurahan":
                return (
                  <KartuStat
                    key={s.jenis}
                    nilai={s.nilai}
                    label={s.label}
                    className="min-h-60"
                    atas={<TitikKelurahan jumlah={s.nilai} />}
                  />
                )
              case "kecamatan":
                return (
                  <KartuStat
                    key={s.jenis}
                    nilai={s.nilai}
                    label={s.label}
                    className="min-h-60"
                    atas={<SegmenKecamatan jumlah={s.nilai} />}
                  />
                )
              case "rekening":
                return (
                  <KartuStat
                    key={s.jenis}
                    nilai={s.nilai}
                    label={s.label}
                    className="min-h-60 sm:col-span-2 lg:col-span-1"
                    atas={
                      <div className="flex items-start justify-between gap-3">
                        <HugeiconsIcon icon={Invoice01Icon} size={28} strokeWidth={1.5} aria-hidden className="text-foreground" />
                        {s.catatan ? (
                          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                            {s.catatan}
                          </span>
                        ) : null}
                      </div>
                    }
                  />
                )
            }
          })}
        </div>
      </div>
    </SectionShell>
  )
}