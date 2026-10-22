// components/layout/navbar/Navbar.tsx
// Tugas: HANYA merakit komponen-komponen kecil menjadi satu navbar.
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Github01Icon } from "@hugeicons/core-free-icons"
import { NavbarBrand } from "./NavbarBrand"
import { NavbarLinks } from "./NavbarLinks"
import { NavbarPlus } from "./NavbarPlus"
import { NavbarSearch } from "./NavbarSearch"
import { NavbarMobileBar } from "./NavbarMobileBar"
import { MobileMenu } from "./MobileMenu"

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b bg-background">
      {/* ===== Bar utama (tampil di semua ukuran layar) ===== */}
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Kiri: logo + dropdown versi */}
        <NavbarBrand />

        {/* Kanan: isinya berbeda untuk mobile dan desktop */}
        <div className="flex items-center gap-1 lg:gap-6">
          {/* Search: ikon di mobile, pill "Ctrl K" di desktop */}
          <NavbarSearch />

          {/* MOBILE SAJA: ikon titik 3 -> membuka menu layar penuh */}
          <div className="lg:hidden">
            <MobileMenu />
          </div>

          {/* DESKTOP SAJA: link menu, kotak sorot "Bantuan", GitHub */}
          <div className="flex items-center gap-6 max-lg:hidden">
            <NavbarLinks />
            <NavbarPlus />
            <Link
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Github01Icon}
                strokeWidth={2}
                className="size-5"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Bar kedua: hamburger + breadcrumb (khusus mobile) ===== */}
      <NavbarMobileBar />
    </header>
  )
}
