// components/layout/navigation/SidebarNav.tsx
// Tugas: daftar menu sidebar (grup + item) dengan penanda halaman aktif.
// Dipakai di sidebar desktop; sidebar mobile bisa memakainya juga lewat
// `onNavigate` (untuk menutup menu setelah link diklik).
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { allNavItems, navGroups } from "@/config/navigation"

export function SidebarNav({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()

  // Item aktif = href terpanjang yang cocok, supaya "/pelanggan" tidak ikut
  // menyala saat kita berada di "/pelanggan/mutasi".
  const activeHref = allNavItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <nav aria-label="Menu utama" className={cn("space-y-8", className)}>
      {navGroups.map((group) => (
        <div key={group.id}>
          <h2 className="mb-3 font-mono text-xs/6 font-medium tracking-widest text-muted-foreground uppercase">
            {group.title}
          </h2>

          {/* Garis vertikal di kiri, item aktif menimpanya dengan warna sky */}
          <ul className="border-l border-border">
            {group.items.map((item) => {
              const isActive = item.href === activeHref
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "-ml-px block border-l py-1.5 pl-4 text-sm/6 transition-colors",
                      isActive
                        ? "border-sky-500 font-medium text-sky-700 dark:border-sky-400 dark:text-sky-300"
                        : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
