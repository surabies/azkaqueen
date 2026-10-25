// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan navbar dan kerangka.
import type { ReactNode } from "react"
import { auth, signOut } from "@/lib/auth"
import { Navbar } from "@/components/layout"
import { TooltipProvider } from "@/components/ui/tooltip"

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

  return (
    <>
      {/* Navbar bersifat `fixed`, jadi urutannya tidak memengaruhi posisi.
          Ruang di bawahnya sudah disediakan oleh DashboardShell (pt-(--navbar-h)). */}
      {session?.user && (
        <Navbar
          user={{
            name: session.user.name ?? null,
            email: session.user.email ?? "",
            image: session.user.image ?? null,
            role: session.user.role,
          }}
          onKeluar={keluar}
        />
      )}
      <TooltipProvider delayDuration={100}>
      <main className="flex min-h-0 flex-1 flex-col pt-14">
      {children}
      </main>
      </TooltipProvider>
    </>
  )
}
