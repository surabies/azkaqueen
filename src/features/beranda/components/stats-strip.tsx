// features/beranda/components/stats-strip.tsx — baris angka nyata dari
// database (features/beranda/lib/stats.ts). Async server component; dirender
// di dalam <Suspense> dari app/page.tsx supaya hero tidak menunggu query.
// Angka dianimasikan lewat <AnimatedNumber> (client leaf) — komponen ini
// sendiri TETAP server component, cuma mengoper angka mentah.
//
// Kalau database kosong (deploy baru), seluruh strip disembunyikan — angka
// nol besar-besar lebih merusak kepercayaan daripada tidak ada angka.
import { getStatsBeranda } from "../lib/stats";
import { formatPeriode } from "@/features/public/lib/format";
import { AnimatedNumber } from "./motion/animated-number";
import { Reveal } from "./motion/reveal";

export async function StatsStrip() {
  const stats = await getStatsBeranda();
  if (stats.pelangganAktif === 0) return null;

  const items = [
    { nilai: stats.pelangganAktif, label: "Pelanggan aktif terlayani" },
    { nilai: stats.kelurahanTerlayani, label: "Kelurahan dalam cakupan" },
    { nilai: stats.kecamatanTerlayani, label: "Kecamatan di Kota Bandung" },
    ...(stats.periodeTerakhir
      ? [
          {
            nilai: stats.tagihanPeriodeTerakhir,
            label: `Rekening diterbitkan · ${formatPeriode(stats.periodeTerakhir)}`,
          },
        ]
      : []),
  ];

  return (
    <section aria-label="Statistik pelayanan" className="border-b border-white/10 bg-tirta">
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-white/5 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.06} className="bg-tirta px-5 py-7 md:px-8">
            <dd className="order-1 font-mono text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
              <AnimatedNumber value={item.nilai} />
            </dd>
            <dt className="order-2 mt-1 text-[11px] font-medium tracking-wide text-slate-400">{item.label}</dt>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

export function StatsStripSkeleton() {
  return (
    <section aria-hidden="true" className="border-b border-white/10 bg-tirta">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-white/5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-tirta px-5 py-7 md:px-8">
            <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </section>
  );
}
