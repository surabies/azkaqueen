// features/beranda/components/hero.tsx — hero showcase beranda: obsidian +
// glassmorphism + neon (lihat plan "Beranda showcase — redesain
// ultra-modern"). Fixed dark (tidak ikut toggle tema situs) — vinyet kanan
// tetap konten ASLI (pratinjau rekening), cuma dibungkus TiltCard + gaya
// glass; sparkline bar tumbuh masuk saat termuat, bukan dekorasi statis.
import { BadgeCheck, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { CekCepatForm } from "./cek-cepat-form"
import { Reveal } from "./motion/reveal"
import { ShimmerButton } from "./motion/shimmer-button"
import { TextReveal } from "./motion/text-reveal"
import { TiltCard } from "./motion/tilt-card"
import { WaterFlowField } from "./motion/water-flow-field"
import { WaterRipple } from "./motion/water-ripple"
import { SparkBars } from "./sparkbars"

export function Hero() {
  return (
    <section
      aria-labelledby="hero-judul"
      className="relative overflow-hidden border-b border-emerald-950/50 bg-[#071b16] text-slate-100"
      style={{
        backgroundImage: "url('/images/hero.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {/* Sebelumnya ada GridBackground (pola crosshatch statis) menumpuk
         di sini — dibuang, feedback pemilik produk: terlihat seperti motif
         kemeja kotak-kotak template generik, tidak relevan untuk
         perusahaan air minum. WaterFlowField (partikel mengalir bertema
         air) sudah cukup jadi latar sendiri, tanpa perlu ditumpuk grid.
         Saat prefers-reduced-motion, WaterFlowField tidak merender apa
         pun — latarnya jatuh ke glow gradasi statis di bawah saja, itu
         sudah tenang & bersih sebagai fallback, tidak butuh grid pula. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,14,0.9)_0%,rgba(3,24,18,0.78)_38%,rgba(3,18,14,0.3)_72%,rgba(3,18,14,0.45)_100%)]"
      />
      {/* Ambient glow di belakang konten — dekoratif murni, tidak menyentuh kontras teks. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-emerald-950/30"
      />
      <WaterFlowField />
      <WaterRipple />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 pt-16 pb-14 md:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-24 lg:pb-20">
        <div className="flex flex-col justify-center lg:col-span-7">
          <Reveal>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-slate-300 backdrop-blur-xl">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Layanan Aktif · 24 Jam
            </span>
          </Reveal>

          <h1 id="hero-judul" className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            <TextReveal
              text="Urusan air rumah Anda,"
              className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent"
            />
            <br />
            <TextReveal text="selesai dari genggaman." className="text-slate-400" />
          </h1>

          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
              Cek tagihan, laporkan angka meter dengan foto bukti, dan sampaikan gangguan air —
              tanpa antre, tanpa akun. Setiap laporan diverifikasi petugas PERUMDA Tirtawening
              sebelum memengaruhi tagihan Anda.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-8">
              <CekCepatForm />
              <p className="mt-2.5 text-xs text-slate-500">
                Gratis, langsung, tanpa mendaftar. Nomor langganan tertera di rekening air Anda.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ShimmerButton asChild>
                <Link href="/pengaduan">
                  Laporkan gangguan air
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </ShimmerButton>
              <Link
                href="/lapor-meter"
                className="group inline-flex items-center gap-1 px-2 text-sm font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline"
              >
                Lapor angka meter
                <ArrowUpRight className="size-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Vinyet rekening — dekoratif, disembunyikan dari pembaca layar. */}
        <div aria-hidden="true" className="relative hidden items-center lg:col-span-5 lg:flex">
          <Reveal delay={0.2} className="relative w-full">
            <TiltCard className="relative w-full">
              <div className="absolute -inset-6 rounded-3xl border border-white/10" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_16px_60px_-24px_rgba(34,211,238,0.25)] backdrop-blur-xl">
                <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                      No. Pelanggan
                    </p>
                    <p className="mt-1 font-mono text-base font-bold text-white">004•••••010</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Lunas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-white/10 px-3 pb-3">
                  <div className="rounded-lg bg-tirta/40 px-4 py-3">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Periode</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">Mei 2026</p>
                  </div>
                  <div className="rounded-lg bg-tirta/40 px-4 py-3">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Pemakaian</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
                      23 <span className="font-sans font-normal text-slate-500">m³</span>
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                      Konsumsi 6 bulan
                    </p>
                    <SparkBars />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-white/10 pt-4">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                      Total Tagihan
                    </p>
                    <p className="font-mono text-2xl font-bold tracking-tight text-white">Rp 173.540</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-full border border-white/10 bg-tirta/90 px-3 py-2 shadow-lg backdrop-blur-xl">
                <BadgeCheck className="size-4 text-cyan-300" />
                <span className="text-xs font-medium text-slate-200">Diverifikasi petugas</span>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
