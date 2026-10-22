// features/beranda/components/cta-band.tsx — ajakan penutup sebelum footer.
// Dua jalur nyata: buat pengaduan baru, atau lacak tiket yang sudah ada.
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BackgroundBeams } from "./motion/background-beams"
import { Reveal } from "./motion/reveal"
import { ShimmerButton } from "./motion/shimmer-button"

export function CtaBand() {
  return (
    <section aria-labelledby="cta-judul" className="relative overflow-hidden border-b border-white/10 bg-tirta">
      <BackgroundBeams />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
        <Reveal className="flex flex-col items-start justify-center gap-5 px-5 py-12 md:px-8 lg:py-16">
          <h2 id="cta-judul" className="text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
            Ada kendala air di lingkungan Anda?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Pipa bocor di jalan pun boleh dilaporkan siapa saja — Anda tidak harus pelanggan.
            Laporan kebocoran otomatis masuk antrean prioritas tinggi.
          </p>
          <ShimmerButton asChild>
            <Link href="/pengaduan">
              Buat pengaduan
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ShimmerButton>
        </Reveal>

        <Reveal
          delay={0.1}
          className="flex flex-col items-start justify-center gap-3 border-t border-white/10 bg-white/2 px-5 py-12 backdrop-blur-xl md:px-8 lg:border-t-0 lg:border-l lg:py-16"
        >
          <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Sudah pernah melapor?
          </p>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Pantau perkembangan penanganan dengan nomor tiket yang Anda terima —
            dari diterima, ditugaskan ke petugas, hingga selesai.
          </p>
          <Link
            href="/pengaduan"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-white underline-offset-4 hover:underline"
          >
            Lacak tiket pengaduan
            <ArrowRight className="size-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
