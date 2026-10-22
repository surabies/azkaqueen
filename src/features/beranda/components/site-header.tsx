// features/beranda/components/site-header.tsx — header bersama seluruh
// permukaan publik (landing + cek-tagihan/lapor-meter/pengaduan), supaya
// warga merasakan satu situs, bukan kumpulan halaman lepas.
//
// Server component; satu-satunya bagian interaktif (menu mobile) diisolasi
// di MobileNav. `sesiPetugas` dihitung pemanggil (layout/page yang membaca
// auth()) — header sendiri tidak menyentuh sesi supaya tetap murni tampilan.
//
// `variant="beranda"` — HANYA dipakai app/page.tsx untuk showcase obsidian/
// glass (lihat plan "Beranda showcase — redesain ultra-modern"). Default
// TIDAK berubah sama sekali, dipakai (public)/layout.tsx untuk tiga
// halaman publik lain apa adanya. ThemeToggle disembunyikan di varian
// beranda karena halaman itu fixed-dark (toggle tidak berefek apa pun di
// sana — menampilkannya cuma membingungkan).
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { TombolPasang } from "@/components/pwa/tombol-pasang";
import { NAV_LAYANAN } from "./nav-links";
import { MobileNav } from "./mobile-nav";

export function SiteHeader({
  sesiPetugas = false,
  variant = "default",
}: {
  sesiPetugas?: boolean;
  variant?: "default" | "beranda";
}) {
  const cta = sesiPetugas
    ? { href: "/dashboard", label: "Buka Dasbor" }
    : { href: "/login", label: "Masuk Petugas" };
  const gelap = variant === "beranda";

  return (
    <header
      className={
        gelap
          ? "sticky top-0 z-40 border-b border-white/10 bg-tirta/70 backdrop-blur-xl"
          : "sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70"
      }
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Beranda PERUMDA Tirtawening"
        >
          {/* Menggunakan utility baru yang sudah kita buat di globals.css */}
          <AppLogo className="size-7 group-hover:animate-bounce-subtle" />

          <span className="flex flex-col leading-none">
            <span className={"text-sm font-semibold tracking-tight " + (gelap ? "text-white" : "text-foreground")}>
              PERUMDA Tirtawening
            </span>
            <span
              className={
                "mt-0.5 text-[10px] font-medium tracking-widest uppercase " +
                (gelap ? "text-slate-500" : "text-muted-foreground")
              }
            >
              Kota Bandung
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LAYANAN.map((item) =>
            item.nonaktif ? (
              <span
                key={item.href}
                aria-disabled="true"
                title="Sementara tidak tersedia"
                className={
                  "cursor-not-allowed px-3 py-2 text-sm font-medium " +
                  (gelap ? "text-slate-600" : "text-muted-foreground/50")
                }
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "px-3 py-2 text-sm font-medium transition-colors " +
                  (gelap ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Menyembunyikan diri sendiri bila aplikasi sudah terpasang. */}
          <TombolPasang className={gelap ? "rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" : undefined} />
          {!gelap && <ThemeToggle />}
          <div
            aria-hidden="true"
            className={"hidden h-5 w-px md:block " + (gelap ? "bg-white/10" : "bg-border")}
          />
          {gelap ? (
            <span className="relative hidden overflow-hidden rounded-xl p-px md:inline-flex">
              <span
                aria-hidden="true"
                className="absolute inset-[-1000%] animate-shimmer-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#e8c170_50%,#22d3ee_100%)] motion-reduce:animate-none"
              />
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="relative z-10 rounded-[calc(var(--radius-xl)-1px)] bg-[#0b3328] text-white hover:bg-[#124738] hover:text-white"
              >
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            </span>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )}
          <MobileNav ctaHref={cta.href} ctaLabel={cta.label} gelap={gelap} />
        </div>
      </div>
    </header>
  );
}
