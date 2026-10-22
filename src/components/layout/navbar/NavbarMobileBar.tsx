// components/layout/navbar/NavbarMobileBar.tsx
// Tugas: bar kedua di mobile: tombol hamburger + breadcrumb + panel menu.
"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { findActiveNav } from "@/config/navigation"
import { MobileSidebar } from "../navigation/MobileSidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function NavbarMobileBar() {
  // Tahap 1: state buka/tutup dipegang di sini (induk dari tombol DAN panel)
  const [open, setOpen] = React.useState(false)

  // useCallback: menjaga `closeSidebar` tetap sama antar render,
  // supaya useEffect di MobileSidebar tidak dipasang ulang terus-menerus
  const closeSidebar = React.useCallback(() => setOpen(false), [])

  // Tahap 2: cari grup & menu aktif untuk breadcrumb
  const pathname = usePathname()
  const active = findActiveNav(pathname)

  return (
    <div className="flex h-14 items-center gap-4 border-t px-4 sm:px-6 lg:hidden">
      {/* Tahap 3: hamburger membalik nilai open (true <-> false) */}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="-ml-1.5"
        aria-label="Buka atau tutup menu navigasi"
        aria-expanded={open} // memberi tahu screen reader status panel
        onClick={() => setOpen((prev) => !prev)}
      >
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-4" />
      </Button>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={active?.group.items[0].href ?? "/dashboard"}
              className="text-muted-foreground"
            >
              {active?.group.title ?? "Tirtawening"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{active?.item.title ?? "Dashboard"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Tahap 4: panel ikut berada di dalam <header> fixed, jadi menempel di bawahnya */}
      <MobileSidebar open={open} onClose={closeSidebar} />
    </div>
  )
}
