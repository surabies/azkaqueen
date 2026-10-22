// components/layout/shell/DashboardShell.tsx
// Tugas: kerangka halaman dashboard ala dokumentasi Tailwind:
// sidebar tetap di kiri + pita garis miring kiri/kanan + garis & footer di bawah.
// Navbar TIDAK dirender di sini (diasumsikan sudah ada di root layout).
import type { ReactNode } from "react"
import { PatternStrip, patternVars } from "./Pattern"
import { SidebarNav } from "../navigation/SidebarNav"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative min-h-dvh bg-background pt-(--navbar-h)",
        // Tinggi navbar. Mobile = bar utama (h-14) + NavbarMobileBar (h-14) = 7rem.
        // Kalau tinggi bar di navbar diubah, sesuaikan angka ini.
        "[--navbar-h:3.5rem] max-lg:[--navbar-h:7rem]",
        "[--sidebar-w:17.5rem]",
        patternVars,
      )}
    >
      {/* Sidebar desktop: menempel di kiri, bisa di-scroll sendiri */}
      <aside className="fixed top-(--navbar-h) bottom-0 left-0 hidden w-(--sidebar-w) overflow-y-auto overscroll-contain px-6 py-8 lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-h-[calc(100dvh-var(--navbar-h))] flex-col lg:pl-(--sidebar-w)">
        {/* Pita garis miring | konten | pita garis miring */}
        <div className="grid flex-1 grid-cols-[1rem_minmax(0,1fr)_1rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_2.5rem]">
          <PatternStrip />
          <main className="min-w-0">{children}</main>
          <PatternStrip />
        </div>

        {/* Footer: garis memanjang menyeberangi pita garis miring */}
        <footer className="border-t border-(--pattern-fg) px-6 py-8 text-sm/6 text-muted-foreground sm:px-12">
          Perumda Tirtawening Kota Bandung &middot; Sistem Informasi
          Terintegrasi
        </footer>
      </div>
    </div>
  )
}
