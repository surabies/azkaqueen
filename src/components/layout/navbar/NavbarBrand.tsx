// components/layout/navbar/NavbarBrand.tsx
// Tugas: menampilkan logo, nama brand, dan dropdown versi.
// Tidak butuh "use client" karena tidak memakai state/hook sendiri
// (DropdownMenu dari shadcn sudah menangani client-nya).
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { versions } from "@/config/navigation"
import { BRAND } from "@/lib/landing/content"

export function NavbarBrand() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src={BRAND.logo} alt="LOGO" width={32} height={32} priority unoptimized className="size-8 object-contain" />
        <span className="text-lg font-semibold">Tirtawening</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 rounded-2xl px-2.5 text-xs tabular-nums"
            aria-label="Pilih versi aplikasi"
          >
            {versions[0]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {/* map(): ubah array versi menjadi daftar item, tanpa menulis satu-satu */}
          {versions.map((version) => (
            <DropdownMenuItem key={version}>{version}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
