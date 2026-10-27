// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman peta wilayah dengan navbar dan footer.
// Tanpa sidebar dan pita garis miring, supaya area peta memakai lebar penuh.
import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { auth, signOut } from "@/lib/auth"
import { getFooterProps } from "@/lib/footer-props"
import { Navbar } from "@/components/layout"
import { DashboardFooter } from "@/components/layout/shell/DashboardFooter"
import { TooltipProvider } from "@/components/ui/tooltip"

async function keluar() {
  "use server"
  await signOut({ redirectTo: "/login" })
}

export default async function PetaWilayahLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  // Padding atas `main` mengandaikan navbar selalu ada, jadi tanpa sesi alihkan ke login.
  if (!session?.user) redirect("/login")

  const { user } = session
  const footer = await getFooterProps()

  return (
    <>
      {/* Navbar fixed; ruang konten mengikuti tinggi dua bar di mobile dan
          satu bar di desktop. */}
      <Navbar
        user={{
          name: user.name ?? null,
          email: user.email ?? "",
          image: user.image ?? null,
          role: user.role,
        }}
        onKeluar={keluar}
      />

      <TooltipProvider delayDuration={100}>
        <main className="flex min-h-0 flex-1 flex-col pt-[calc(7rem+1px)] lg:pt-[calc(3.5rem+1px)]">
          {children}
        </main>
        <DashboardFooter {...footer} />
      </TooltipProvider>
    </>
  )
}