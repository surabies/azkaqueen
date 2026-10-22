// features/beranda/components/site-footer.tsx — footer bersama seluruh
// permukaan publik. Hanya memuat tautan yang benar-benar ada (tidak ada
// kolom "Karier/Blog/Press" palsu) dan kontak yang bisa dipertanggung-
// jawabkan: alamat kantor pusat PERUMDA Tirtawening.
//
// `variant="beranda"` — sama seperti site-header.tsx, HANYA dipakai
// app/page.tsx untuk showcase obsidian/glass. Default tidak berubah.
import Link from "next/link"
import { AppLogo } from "@/components/app-logo"
import { TombolPasang } from "@/components/pwa/tombol-pasang"
import { NAV_LAYANAN } from "./nav-links"

export function SiteFooter({ variant = "default" }: { variant?: "default" | "beranda" }) {
  const gelap = variant === "beranda"

  return (
    <footer className={gelap ? "border-t border-white/10 bg-tirta" : "bg-background"}>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 md:grid-cols-12 md:px-8">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-5">
          <div className="flex items-center gap-2.5">
            <AppLogo className="size-7" />
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
          </div>
          <p className={"max-w-sm text-sm leading-relaxed " + (gelap ? "text-slate-400" : "text-muted-foreground")}>
            Perusahaan Umum Daerah Air Minum Kota Bandung. Layanan digital ini terbuka 24 jam
            untuk seluruh warga — pelanggan maupun bukan.
          </p>
        </div>

        <nav aria-label="Tautan layanan" className="md:col-span-3">
          <h2
            className={
              "text-[11px] font-semibold tracking-widest uppercase " +
              (gelap ? "text-slate-500" : "text-muted-foreground")
            }
          >
            Layanan
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV_LAYANAN.map((item) => (
              <li key={item.href}>
                {item.nonaktif ? (
                  <span
                    aria-disabled="true"
                    title="Sementara tidak tersedia"
                    className={"cursor-not-allowed text-sm " + (gelap ? "text-slate-600" : "text-foreground/40")}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={
                      "text-sm underline-offset-4 transition-colors hover:underline " +
                      (gelap ? "text-slate-300 hover:text-white" : "text-foreground/80 hover:text-foreground")
                    }
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2
            className={
              "text-[11px] font-semibold tracking-widest uppercase " +
              (gelap ? "text-slate-500" : "text-muted-foreground")
            }
          >
            Kantor Pelayanan
          </h2>
          <address className={"mt-4 text-sm leading-relaxed not-italic " + (gelap ? "text-slate-400" : "text-muted-foreground")}>
            Jl. Badaksinga No. 10
            <br />
            Kota Bandung, Jawa Barat
          </address>
          <p className={"mt-3 text-sm leading-relaxed " + (gelap ? "text-slate-400" : "text-muted-foreground")}>
            Loket: Senin–Jumat, jam kerja.
            <br />
            Layanan daring: 24 jam.
          </p>
        </div>
      </div>

      <div className={gelap ? "border-t border-white/10" : "border-t border-border/70"}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 md:px-8">
          <p className={"text-xs " + (gelap ? "text-slate-500" : "text-muted-foreground")}>
            © {new Date().getFullYear()} PERUMDA Tirtawening Kota Bandung
          </p>
          <div className="flex items-center gap-4">
            {/* Tempat orang mencari saat sudah menutup dialog ajakan dan
                melewatkan tombol di header. */}
            <TombolPasang
              bentuk="tautan"
              className={gelap ? "text-slate-500 hover:text-white" : undefined}
            />
            <Link
              href="/login"
              className={
                "text-xs underline-offset-4 transition-colors hover:underline " +
                (gelap ? "text-slate-500 hover:text-white" : "text-muted-foreground hover:text-foreground")
              }
            >
              Masuk sebagai petugas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
