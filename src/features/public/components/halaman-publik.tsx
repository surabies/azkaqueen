// features/publik/components/halaman-publik.tsx — kerangka editorial bersama
// halaman layanan publik, meminjam bahasa visual beranda (features/beranda):
// pita judul ber-garis penuh, eyebrow uppercase, rel kiri lengket untuk
// konteks, dan "kartu berbingkai" bergaya vinyet hero untuk area fungsional.
//
// `gelap` — dipakai cek-tagihan/lapor-meter/pengaduan supaya satu tema
// dengan showcase obsidian beranda (permintaan pemilik produk: "satu tema").
// Prop opsional, default TIDAK gelap supaya kalau kelak ada pemakai lain
// yang belum siap dipindah, perilakunya tetap sama seperti sebelumnya.
//
// Server component murni presentasional — boleh diimpor komponen client
// (ikut jadi bundle client di sana, dan itu tidak apa-apa).
import { cn } from "@workspace/ui/lib/utils"
import { WaterFlowField } from "@/features/beranda/components/motion/water-flow-field"
import { WaterRipple } from "@/features/beranda/components/motion/water-ripple"

/** Pita judul + grid konten. `aside` tampil di rel kiri pada desktop dan
 *  PINDAH KE BAWAH form di layar kecil — warga datang untuk menyelesaikan
 *  urusan, bukan membaca panduan dulu. */
export function HalamanPublik({
  eyebrow,
  judul,
  lede,
  aside,
  children,
  gelap = false,
}: {
  eyebrow: string
  judul: string
  lede: string
  aside: React.ReactNode
  children: React.ReactNode
  gelap?: boolean
}) {
  return (
    // `--radius` DITIMPA di sini (bukan di globals.css) hanya untuk tiga
    // halaman "gelap" ini: `--radius: 0` di globals.css sengaja persegi
    // tajam untuk SELURUH aplikasi (lihat catatan di globals.css) — bukan
    // hal yang ingin kita ubah untuk dashboard. Tapi khusus halaman publik
    // obsidian ini permintaan pemilik produk: sudut membulat tipis saja —
    // 0.3rem, preset "terendah" shadcn (bukan 0, itu sudah dipakai global
    // di atas; tetap dibiarkan sedikit membulat sesuai permintaan). Karena
    // semua utility rounded-* (Button, Input, KartuBerbingkai,
    // dst) dibangkitkan lewat `@theme inline` sebagai `var(--radius-*)` yang
    // itu sendiri `calc(var(--radius) * N)`, override SATU custom property
    // ini di leluhur terdekat otomatis mengalir ke SETIAP elemen rounded-*
    // di bawahnya — sama seperti pola `.dark` di atas, tanpa perlu
    // menyentuh satu per satu komponen. (`rounded-full` tidak kena/tidak
    // perlu — itu keyword tetap 9999px, bukan bagian skala --radius, jadi
    // badge/chip bulat tetap bulat seperti sebelumnya.)
    <div style={gelap ? ({ "--radius": "0.3rem" } as React.CSSProperties) : undefined}>
      <section
        className={gelap ? "relative overflow-hidden border-b border-emerald-950/50 bg-[#071b16]" : "border-b border-border/70"}
        style={
          gelap
            ? {
                backgroundImage: "url('/images/hero.jpg')",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        {/* Sama persis dengan hero.tsx beranda — permintaan pemilik produk
           supaya pita judul tiga halaman ini "satu efek visual" dengan
           hero, bukan cuma warna gelap polos. */}
        {gelap && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,18,14,0.9)_0%,rgba(3,24,18,0.74)_46%,rgba(3,18,14,0.4)_100%)]"
          />
        )}
        {gelap && <WaterFlowField />}
        {gelap && <WaterRipple />}
        <div className="relative mx-auto w-full max-w-6xl px-5 py-10 md:px-8 lg:py-14">
          <p className={"text-[11px] font-semibold tracking-[0.2em] uppercase " + (gelap ? "text-cyan-300" : "text-primary")}>
            {eyebrow}
          </p>
          <h1
            className={
              "mt-3 max-w-2xl text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl " +
              (gelap ? "text-white" : "text-foreground")
            }
          >
            {judul}
          </h1>
          <p className={"mt-4 max-w-xl text-sm leading-relaxed sm:text-base " + (gelap ? "text-slate-400" : "text-muted-foreground")}>
            {lede}
          </p>
        </div>
      </section>

      <div className={"mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 py-10 md:px-8 lg:grid-cols-12 lg:gap-8 lg:py-14 " + (gelap ? "bg-tirta" : "")}>
        {/* Konten (form) DULU di DOM — di layar kecil warga langsung ketemu
            formnya; `lg:order-first` memindahkan aside ke rel kiri hanya di
            desktop. */}
        {/* `dark` di sini menutup celah children yang TIDAK dibungkus
           KartuBerbingkai (mis. CekTagihanForm langsung) — lihat catatan
           lengkap alasannya di KartuBerbingkai di bawah.

           `text-foreground` WAJIB menyertai `dark` di sini, bukan opsional:
           `color` bukan custom property — nilai yang DIWARISKAN turunan
           adalah nilai computed di elemen tempat ia terakhir di-set, bukan
           referensi var() yang dievaluasi ulang. `<body>` men-set
           `text-foreground` di app/layout.tsx SEBELUM `.dark` ini ada (ia
           di luar div ini), jadi tanpa deklarasi ulang di sini seluruh teks
           yang TIDAK punya class warna sendiri (Input, Textarea, Label,
           <p> polos, dst) tetap mewarisi warna terang lama walau latarnya
           sudah gelap — persis bug "field/teks tidak kebaca" yang dilaporkan
           setelah tema gelap ini dipasang. Men-declare `text-foreground` di
           sini memaksa `color` dihitung ULANG di titik ini, memakai token
           `--foreground` versi `.dark` yang berlaku di sini. */}
        <div className={cn("lg:col-span-7 lg:col-start-6", gelap && "dark text-foreground")}>{children}</div>
        <aside className="lg:order-first lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col gap-8 lg:sticky lg:top-24">{aside}</div>
        </aside>
      </div>
    </div>
  )
}

/** Blok kecil di rel kiri: micro-label uppercase + isi. */
export function AsideBlok({ label, children, gelap = false }: { label: string; children: React.ReactNode; gelap?: boolean }) {
  return (
    <div>
      <h2 className={"text-[11px] font-semibold tracking-widest uppercase " + (gelap ? "text-slate-500" : "text-muted-foreground")}>
        {label}
      </h2>
      <div className={"mt-3 text-sm leading-relaxed " + (gelap ? "text-slate-400" : "text-muted-foreground")}>{children}</div>
    </div>
  )
}

/** Linimasa langkah bernomor — grammar yang sama dengan vinyet pengaduan
 *  di beranda. */
export function LangkahList({
  langkah,
  gelap = false,
}: {
  langkah: readonly { judul: string; detail: string }[]
  gelap?: boolean
}) {
  return (
    <ol className="space-y-0">
      {langkah.map((l, i, arr) => (
        <li key={l.judul} className="relative flex gap-4 pb-6 last:pb-0">
          {i < arr.length - 1 && (
            <span
              aria-hidden="true"
              className={"absolute top-7 left-[11px] h-full w-px " + (gelap ? "bg-white/10" : "bg-border")}
            />
          )}
          <span
            className={
              "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold " +
              (gelap ? "border-white/10 bg-white/5 text-white" : "border-border bg-card text-foreground")
            }
          >
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span className={"text-sm font-medium " + (gelap ? "text-white" : "text-foreground")}>{l.judul}</span>
            <span className={"text-xs leading-relaxed " + (gelap ? "text-slate-400" : "text-muted-foreground")}>{l.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Kartu fungsional berbingkai ganda — tanda tangan visual beranda (bingkai
 *  offset di belakang kartu). Pakai HANYA pada satu kartu utama per halaman
 *  supaya tetap terasa istimewa. */
export function KartuBerbingkai({
  label,
  chip,
  className,
  children,
  gelap = false,
}: {
  label?: string
  chip?: string
  className?: string
  children: React.ReactNode
  gelap?: boolean
}) {
  return (
    // `--radius` diulang di sini juga (bukan cuma di wrapper HalamanPublik)
    // dengan alasan sama seperti `dark text-foreground` di bawah: supaya
    // kartu ini tetap benar dipakai berdiri sendiri di luar HalamanPublik.
    // Lihat catatan lengkap di HalamanPublik di atas.
    <div className="relative" style={gelap ? ({ "--radius": "0.3rem" } as React.CSSProperties) : undefined}>
      <div
        aria-hidden="true"
        className={"absolute -inset-3 hidden sm:block md:-inset-4 " + (gelap ? "rounded-3xl border border-white/10" : "border border-border/50")}
      />
      <div
        className={
          gelap
            // `p-px` + span gradient di dalamnya = "moving border button" ala
            // ShimmerButton (features/beranda/components/motion/shimmer-button.tsx,
            // dipakai CTA "Laporkan gangguan air" di hero) diterapkan ke KARTU,
            // bukan cuma tombol — permintaan produk: bingkai formulir tiga
            // halaman publik ini "sama kerennya" dengan CTA hero. `overflow-hidden`
            // yang memotong gradien (yang sengaja jauh lebih besar dari kartu,
            // `inset-[-1000%]`) jadi cincin 1px mengikuti `rounded-2xl` —
            // lihat span di bawah.
            ? "relative overflow-hidden rounded-2xl p-px"
            : "relative border border-border bg-card shadow-[0_1px_0_rgb(0,0,0,0.03),0_16px_40px_-24px_rgb(0,0,0,0.25)]"
        }
      >
        {gelap && (
          <span
            aria-hidden="true"
            // Sama seperti ShimmerButton, tapi jauh diperlambat
            // (--animate-shimmer-spin-slow, globals.css): putaran 2,5 dtk yang
            // pas untuk tombol kecil terasa mengganggu di tepi area sebesar
            // kartu penuh yang dipandangi warga selama mengisi formulir.
            className="absolute inset-[-1000%] animate-shimmer-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#e8c170_50%,#22d3ee_100%)] motion-reduce:animate-none"
          />
        )}
        <div className={gelap ? "relative rounded-2xl bg-tirta/95 backdrop-blur-xl" : ""}>
          {label && (
            <div
              className={
                "flex items-center justify-between gap-3 border-b px-5 py-3 " +
                (gelap ? "border-white/10" : "border-border/70")
              }
            >
              <span className={"text-[10px] font-semibold tracking-widest uppercase " + (gelap ? "text-slate-500" : "text-muted-foreground")}>
                {label}
              </span>
              {chip && (
                <span
                  className={
                    "px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase " +
                    (gelap
                      ? "rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border border-primary/40 bg-primary/10 text-primary")
                  }
                >
                  {chip}
                </span>
              )}
            </div>
          )}
          {/* `gelap`: bungkus isi form dengan class "dark" bawaan Tailwind —
           mengaktifkan token OKLCH gelap yang SUDAH ADA di globals.css
           (dipakai dashboard) untuk SELURUH komponen di dalamnya (Input,
           Button, Alert, Field, dst) TANPA menyentuh satu pun file form
           yang kompleks (lapor-meter-form.tsx, pengaduan-form.tsx, dll).
           Sengaja BUKAN palet obsidian custom "tirta" persis sama — beda
           tipis (tirta lebih pekat/biru), tapi keduanya gelap & sudah
           teruji aksesibel, jauh lebih aman & cepat daripada menulis ulang
           setiap className token satu per satu di form yang panjang.

           `text-foreground` menyertai `dark` di sini juga (bukan cuma di
           wrapper HalamanPublik) supaya kartu ini tetap benar dipakai
           berdiri sendiri di luar HalamanPublik pula — lihat catatan
           lengkap soal KENAPA di wrapper `lg:col-span-7` pada
           HalamanPublik di atas: `color` yang diwarisi elemen tanpa class
           warna sendiri (Input, Textarea, Label) adalah nilai computed,
           bukan var() yang dievaluasi ulang di titik pemakaian. */}
          <div className={cn("p-5", gelap && "dark text-foreground", className)}>{children}</div>
        </div>
      </div>
    </div>
  )
}
