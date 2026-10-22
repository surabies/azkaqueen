// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan navbar dan kerangka.
import type { ReactNode } from "react"
import { DashboardShell, Navbar } from "@/components/layout"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Navbar bersifat `fixed`, jadi urutannya tidak memengaruhi posisi.
          Ruang di bawahnya sudah disediakan oleh DashboardShell (pt-(--navbar-h)). */}
      <Navbar />
      <DashboardShell>{children}</DashboardShell>
    </>
  )
}
