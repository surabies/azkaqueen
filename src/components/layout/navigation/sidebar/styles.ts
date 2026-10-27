// components/layout/navigation/sidebar/styles.ts
// Kelas Tailwind yang dipakai bersama. Warna semuanya berasal dari token di
// globals.css (--sidebar-*), jadi tema terang/gelap otomatis ikut.
//
// Skema ala Vercel:
//   normal : teks abu (--sidebar-foreground)
//   hover  : latar --sidebar-hover (gray-100), teks gelap
//   aktif  : latar --sidebar-accent (gray-200), teks gelap, TANPA garis tepi

/** Cincin fokus — hanya muncul untuk navigasi keyboard (bukan klik mouse). */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"

/** Dasar semua baris yang bisa diklik. */
export const ROW_BASE =
  "flex w-full items-center rounded-lg text-left transition-colors"

/** Label seksi kecil huruf kapital ("MENU UTAMA", nama folder). */
export const SECTION_LABEL =
  "px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/70"

/** Gaya baris halaman (level menu) per status. */
export const ITEM_ACTIVE = "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
export const ITEM_IDLE =
  "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-accent-foreground"
