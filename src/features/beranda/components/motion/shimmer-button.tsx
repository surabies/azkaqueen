// features/beranda/components/motion/shimmer-button.tsx — CTA dengan border
// gradient berputar (pola "Moving Border Button" ala Aceternity UI, murni
// CSS + keyframe `--animate-shimmer-spin` dari globals.css, tanpa JS
// tambahan). Membungkus `Button` shadcn yang sudah ada (bukan komponen
// baru dari nol) — cuma menimpa tampilannya lewat className, perilaku
// (asChild/Slot, focus ring, disabled) tetap punya Button.
//
// Warna border SENGAJA cyan → emas (#e8c170) → cyan, BUKAN gradasi tiga
// warna cyan-emerald-violet seperti versi awal — inilah SATU-SATUNYA
// tempat token `emas` (globals.css) boleh muncul selain badge kecil
// sesekali. Lihat aturan palet di globals.css: emas dipakai hemat di
// "titik tanda tangan" seperti ini, bukan disebar ke seluruh halaman.
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

export function ShimmerButton({ className, children, ...props }: ComponentProps<typeof Button>) {
  return (
    <span className="relative inline-flex overflow-hidden rounded-full p-px">
      <span
        aria-hidden="true"
        className="absolute inset-[-1000%] animate-shimmer-spin bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#e8c170_50%,#22d3ee_100%)] motion-reduce:animate-none"
      />
      <Button
        variant="ghost"
        {...props}
        className={cn(
          "relative z-10 h-11 rounded-full border-0 bg-[#0b3328] px-6 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(34,197,94,0.5)] hover:bg-[#124738] hover:text-white",
          className
        )}
      >
        {children}
      </Button>
    </span>
  )
}
