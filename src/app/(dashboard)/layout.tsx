// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan navbar dan kerangka.
import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { auth, signOut } from "@/lib/auth"
import { getSystemStatus } from "@/lib/system-status"
import { DashboardShell, Navbar } from "@/components/layout"
import pkg from "../../../package.json"

const ORGANIZATION = "Perumda Tirtawening Kota Bandung"

async function keluar() {
  "use server"
  await signOut({ redirectTo: "/login" })
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  // Navbar `fixed` dan `pt-(--navbar-h)` di shell selalu berpasangan,
  // jadi tanpa sesi halaman tidak boleh dirender.
  if (!session?.user) redirect("/login")

  const { user } = session
  const status = await getSystemStatus()

  return (
    <>
      <Navbar
        user={{
          name: user.name ?? null,
          email: user.email ?? "",
          image: user.image ?? null,
          role: user.role,
        }}
        onKeluar={keluar}
      />

      <DashboardShell
        footer={{
          status,
          // Isi dengan waktu sinkron nyata (ISO 8601) bila prosesnya ada.
          // Selama null, segmen "Sinkron terakhir" otomatis tidak ditampilkan.
          syncedAt: null,
          version: pkg.version,
          organization: ORGANIZATION,
        }}
      >
        {children}
      </DashboardShell>
    </>
  )
}