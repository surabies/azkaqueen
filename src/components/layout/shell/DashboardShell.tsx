// components/layout/shell/DashboardShell.tsx
// Kerangka halaman dashboard: sidebar tetap di kiri, pita garis miring kiri/kanan,
// konten utama, lalu footer. Navbar TIDAK dirender di sini (ada di root layout).
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { SidebarNav } from "../navigation/SidebarNav"
import { DashboardFooter, type DashboardFooterProps } from "./DashboardFooter"
import { PatternStrip } from "./Pattern"

export const MAIN_CONTENT_ID = "konten-utama"

type DashboardShellProps = {
  children: ReactNode
  footer: DashboardFooterProps
}

export function DashboardShell({ children, footer }: DashboardShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-dvh bg-background pt-(--navbar-h)",
        // Tinggi navbar. Mobile = bar utama (h-14) + NavbarMobileBar (h-14) = 7rem.
        // Jika tinggi bar di navbar berubah, sesuaikan angka ini.
        "[--navbar-h:3.5rem] max-lg:[--navbar-h:7rem]",
        "[--sidebar-w:17.5rem]",
      )}
    >
      {/* Lompat ke konten: muncul hanya saat menerima fokus keyboard */}
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className={cn(
          "sr-only focus-visible:not-sr-only",
          "focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50",
          "focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2",
          "focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-md",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
      >
        Lewati ke konten utama
      </a>

      {/* Sidebar desktop: menempel di kiri dan di-scroll sendiri.
          SidebarNav merender <nav aria-label="Menu utama">. */}
      <aside
        aria-label="Navigasi modul"
        className="fixed top-(--navbar-h) bottom-0 left-0 hidden w-(--sidebar-w) overflow-y-auto overscroll-contain px-6 py-8 lg:block"
      >
        <SidebarNav />
      </aside>

      <div className="flex min-h-[calc(100dvh-var(--navbar-h))] flex-col lg:pl-(--sidebar-w)">
        {/* Pita garis miring | konten | pita garis miring */}
        <div className="grid flex-1 grid-cols-[1rem_minmax(0,1fr)_1rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_2.5rem]">
          <PatternStrip aria-hidden="true" />

          <div className="flex min-w-0 flex-col">
            <main
              id={MAIN_CONTENT_ID}
              tabIndex={-1}
              className="flex min-w-0 flex-1 flex-col focus:outline-none"
            >
              {children}
            </main>
            <DashboardFooter {...footer} />
          </div>

          {/* <PatternStrip aria-hidden="true" /> */}
        </div>
      </div>
    </div>
  )
}