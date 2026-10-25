// src/app/(dashboard)/layout.tsx
// Tugas: membungkus halaman dashboard dengan navbar dan kerangka.
import type { ReactNode } from "react";
import { auth, signOut } from "@/lib/auth";
import { Navbar } from "@/components/layout";
import { TooltipProvider } from "@/components/ui/tooltip";

async function keluar() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function PetaWilayahLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <>
      {/* Navbar fixed; ruang konten mengikuti tinggi dua bar di mobile dan
          satu bar di desktop. */}
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
        <main className="flex min-h-0 flex-1 flex-col pt-[calc(7rem+1px)] lg:pt-[calc(3.5rem+1px)]">
          {children}
        </main>
      </TooltipProvider>
    </>
  );
}
