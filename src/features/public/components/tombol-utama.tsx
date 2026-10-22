// features/public/components/tombol-utama.tsx — CTA utama halaman publik
// gelap: gradasi cyan->emerald + cincin gradien berputar, bahasa visual yang
// SAMA dengan ShimmerButton di hero ("Laporkan gangguan air") dan bingkai
// KartuBerbingkai. SATU definisi dipakai di seluruh CTA utama publik ("Kirim
// laporan", "Kirim pengaduan", "Cek tagihan", "Cek status laporan saya")
// supaya "senada di semua halaman" berarti benar-benar satu sumber, bukan
// classNames yang disalin manual ke tiap form dan lambat laun menyimpang —
// persis kenapa InputNomorLangganan diekstrak sebelumnya.
//
// Server component murni presentasional (tidak butuh "use client" — cuma
// Button + Slot di baliknya).
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

export function TombolUtama({
  className,
  children,
  nonaktif = false,
  ...props
}: ComponentProps<typeof Button> & {
  /** Terkunci oleh ATURAN BISNIS (mis. "sudah lapor bulan ini"), BUKAN
   *  sekadar form belum lengkap/sedang mengirim — kasus terakhir itu cukup
   *  `disabled`, cincinnya tetap tampil (dtombol memang akan bisa ditekan
   *  begitu formnya lengkap). `nonaktif` menghapus cincinnya SEPENUHNYA
   *  supaya kilau tidak menyiratkan tombol ini bisa ditekan padahal terkunci
   *  untuk alasan lain, bukan cuma menunggu input. */
  nonaktif?: boolean
}) {
  if (nonaktif) {
    return (
      <Button disabled className={className} {...props}>
        {children}
      </Button>
    )
  }

  return (
    <span className="relative block overflow-hidden rounded-xl p-px">
      <span
        aria-hidden="true"
        className="absolute inset-[-1000%] animate-shimmer-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#e8c170_50%,#22d3ee_100%)] motion-reduce:animate-none"
      />
      <Button
        className={cn(
          "relative rounded-xl bg-linear-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-[0_8px_30px_-8px_rgba(20,184,166,0.45)] hover:from-cyan-400 hover:to-teal-400 disabled:opacity-90",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </span>
  )
}
