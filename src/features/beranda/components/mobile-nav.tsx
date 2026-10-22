"use client"

// features/beranda/components/mobile-nav.tsx — menu layar kecil untuk
// SiteHeader. Satu-satunya bagian header yang butuh client (state buka/
// tutup sheet); sisanya tetap server component.
//
// `gelap` — diteruskan dari SiteHeader HANYA saat variant="beranda".
// BUG yang diperbaiki di sini: tombol pemicu (ikon hamburger) sebelumnya
// TIDAK punya warna eksplisit, jadi mewarisi `text-foreground` dari body
// (token tema situs, gelap di tema terang) — di atas header obsidian
// beranda, ikonnya nyaris tidak terlihat. Sheet yang terbuka juga direskin
// kaca gelap saat `gelap` supaya tidak jadi popup terang yang nyasar di
// tengah halaman obsidian.
import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { TombolPasang } from "@/components/pwa/tombol-pasang"
import { NAV_LAYANAN } from "./nav-links"

export function MobileNav({
  ctaHref,
  ctaLabel,
  gelap = false,
}: {
  ctaHref: string
  ctaLabel: string
  gelap?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={"md:hidden " + (gelap ? "rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" : "")}
          aria-label="Buka menu navigasi"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={
          gelap
            ? "w-80 gap-0 border-white/10 bg-tirta/95 p-0 text-white backdrop-blur-xl [&_[data-slot=sheet-close]]:text-slate-400 [&_[data-slot=sheet-close]]:hover:text-white"
            : "w-80 gap-0 p-0"
        }
      >
        <SheetHeader className={gelap ? "border-b border-white/10 px-5 py-4" : "border-b border-border px-5 py-4"}>
          <SheetTitle className={"text-sm font-semibold " + (gelap ? "text-white" : "")}>
            PERUMDA Tirtawening
          </SheetTitle>
          <SheetDescription className={"text-xs " + (gelap ? "text-slate-400" : "")}>
            Layanan pelanggan air minum Kota Bandung
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Navigasi layanan" className="flex flex-col px-2 py-3">
          {NAV_LAYANAN.map((item) =>
            item.nonaktif ? (
              <span
                key={item.href}
                aria-disabled="true"
                title="Sementara tidak tersedia"
                className="flex cursor-not-allowed flex-col gap-0.5 px-3 py-3 opacity-50"
              >
                <span className={"text-sm font-medium " + (gelap ? "text-white" : "text-foreground")}>
                  {item.label}
                </span>
                <span className={"text-xs " + (gelap ? "text-slate-500" : "text-muted-foreground")}>
                  Sementara tidak tersedia
                </span>
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "group flex flex-col gap-0.5 rounded-lg px-3 py-3 transition-colors " +
                  (gelap ? "hover:bg-white/5" : "hover:bg-accent")
                }
              >
                <span className={"text-sm font-medium " + (gelap ? "text-white" : "text-foreground")}>
                  {item.label}
                </span>
                <span className={"text-xs " + (gelap ? "text-slate-500" : "text-muted-foreground")}>
                  {item.deskripsi}
                </span>
              </Link>
            )
          )}
        </nav>

        {/* Pintu masuk utama di layar kecil — di sinilah warga paling mungkin
            mencarinya setelah menutup dialog ajakan. Sheet ikut ditutup supaya
            dialognya tidak tertimbun di baliknya. */}
        <div className={gelap ? "border-t border-white/10 px-2 py-2" : "border-t border-border px-2 py-2"}>
          <TombolPasang
            bentuk="menu"
            onSesudah={() => setOpen(false)}
            className={gelap ? "rounded-lg text-slate-300 hover:bg-white/5 [&_span:first-child]:text-white [&_span:last-child]:text-slate-500" : undefined}
          />
        </div>

        <div className={gelap ? "mt-auto border-t border-white/10 px-5 py-4" : "mt-auto border-t border-border px-5 py-4"}>
          <Button
            asChild
            className={
              gelap
                ? "h-10 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-tirta hover:from-cyan-300 hover:to-teal-300"
                : "h-10 w-full"
            }
          >
            <Link href={ctaHref} onClick={() => setOpen(false)}>
              {ctaLabel}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
