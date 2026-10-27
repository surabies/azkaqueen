// src/app/(dashboard)/layout.tsx
// Layout halaman fluid (verifikasi, peta wilayah): tanpa DashboardShell, tanpa sidebar.
// Bingkai setinggi layar: navbar (fixed) di atas, konten mengisi ruang tengah,
// footer menempel di bawah sebagai pembatas. Dokumen tidak ikut ter-scroll.
import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { auth, signOut } from "@/lib/auth"
import { getFooterProps } from "@/lib/footer-props"
import { Navbar } from "@/components/layout"
import { DashboardFooter } from "@/components/layout/shell/DashboardFooter"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

async function keluar() {
  "use server"
  await signOut({ redirectTo: "/login" })
}

export default async function FluidLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  // Padding atas bingkai mengandaikan navbar selalu ada, jadi tanpa sesi alihkan ke login.
  if (!session?.user) redirect("/login")

  const { user } = session
  const footer = await getFooterProps()

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

      <TooltipProvider delayDuration={100}>
        <div
          className={cn(
            // Tinggi navbar (+1px garis bawah). Mobile = dua bar (7rem), desktop = satu bar (3.5rem).
            "[--navbar-h:calc(3.5rem+1px)] max-lg:[--navbar-h:calc(7rem+1px)]",
            // Bingkai setinggi layar: ruang tengah = layar - navbar - footer.
            "flex h-dvh flex-col overflow-hidden pt-(--navbar-h)",
          )}
        >
          {/* Ruang tengah. Halaman yang mengatur tinggi sendiri cukup memakai
              `flex-1 min-h-0`; jika kontennya lebih panjang, hanya area ini yang
              ter-scroll dan footer tetap terlihat. */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>

          <DashboardFooter {...footer} className="shrink-0 bg-background" />
        </div>
      </TooltipProvider>
    </>
  )
}