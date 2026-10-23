// features/beranda/components/bento-keandalan.tsx — grid bento "di balik
// layar", gaya glass+spotlight di atas obsidian. Setiap sel menceritakan
// mekanisme yang BENAR-BENAR ada di sistem ini (verifikasi laporan,
// penyamaran alamat, penamaan arsip foto, PostGIS, jadwal giliran) — bukan
// klaim pemasaran kosong. Kalau menambah sel, pakai aturan yang sama: hanya
// tulis yang bisa ditunjuk kodenya.
//
// SENGAJA bentuk grid (bukan alur/timeline) — atas permintaan eksplisit
// pemilik produk untuk mengembalikan bentuk aslinya persis, sesudah sempat
// dicoba versi alur bergaris. Tetap dalam tema obsidian yang sama dengan
// seluruh beranda lain (bukan tema terang aslinya) — satu sel tiba-tiba
// terang di tengah halaman gelap akan terlihat patah/rusak.
import { ShieldCheck, MapPinned, Timer, FileCheck2, EyeOff } from "@/components/ui/hugeicons-compat"
import { Reveal } from "./motion/reveal"
import { SpotlightCard } from "./motion/spotlight-card"

function SelJudul({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold tracking-tight text-white">{children}</h3>
}

function SelTeks({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
}

export function BentoKeandalan() {
  return (
    <section aria-labelledby="bento-judul" className="border-b border-white/10 bg-tirta">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 lg:py-20">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-300 uppercase">Di balik layar</p>
          <h2 id="bento-judul" className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white">
            Setiap angka melewati tangan petugas sebelum menjadi tagihan.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-6">
          {/* Sel besar: alur verifikasi — jantung sistemnya. */}
          <Reveal delay={0} className="md:col-span-4">
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4.5 text-cyan-300" aria-hidden="true" />
                <SelJudul>Laporan warga tidak langsung mengubah tagihan</SelJudul>
              </div>
              <SelTeks>
                Angka meter yang Anda kirim berstatus <span className="font-medium text-white">menunggu</span> sampai
                petugas memeriksa foto buktinya. Baru setelah lolos verifikasi, angka itu menjadi pencatatan resmi dan
                dihitung sebagai tagihan — laporan keliru atau iseng berhenti di meja petugas.
              </SelTeks>
              <ol aria-hidden="true" className="mt-6 flex flex-wrap items-center gap-y-3">
                {["Laporan masuk", "Menunggu", "Diverifikasi petugas", "Pencatatan resmi", "Tagihan"].map((t, i, arr) => (
                  <li key={t} className="flex items-center">
                    <span
                      className={
                        "rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase " +
                        (i === 2
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-white/5 text-slate-400")
                      }
                    >
                      {t}
                    </span>
                    {i < arr.length - 1 && <span className="mx-1.5 h-px w-3 bg-white/10 sm:w-5" />}
                  </li>
                ))}
              </ol>
            </SpotlightCard>
          </Reveal>

          {/* Arsip foto tertata. */}
          <Reveal delay={0.06} className="md:col-span-2">
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="size-4.5 text-cyan-300" aria-hidden="true" />
                <SelJudul>Bukti foto terarsip rapi</SelJudul>
              </div>
              <SelTeks>
                Isi berkas diperiksa server (bukan sekadar nama filenya), lalu disimpan dengan penamaan baku per periode
                sehingga selalu bisa ditelusuri ulang:
              </SelTeks>
              <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] break-all text-slate-400">
                202607_stand_00401700010.jpg
              </p>
            </SpotlightCard>
          </Reveal>

          {/* Privasi. */}
          <Reveal delay={0.12} className="md:col-span-2">
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2.5">
                <EyeOff className="size-4.5 text-cyan-300" aria-hidden="true" />
                <SelJudul>Data seperlunya saja</SelJudul>
              </div>
              <SelTeks>
                Halaman publik hanya menampilkan yang perlu Anda lihat: alamat disamarkan sebagian, dan setiap permintaan
                dibatasi lajunya untuk menghalangi pengambilan data massal.
              </SelTeks>
              <p aria-hidden="true" className="mt-4 font-mono text-sm text-slate-400">
                ASMI NO.<span className="text-white">************</span>
              </p>
            </SpotlightCard>
          </Reveal>

          {/* Peta / GIS. */}
          <Reveal delay={0.18} className="md:col-span-2">
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2.5">
                <MapPinned className="size-4.5 text-cyan-300" aria-hidden="true" />
                <SelJudul>Berbasis peta sungguhan</SelJudul>
              </div>
              <SelTeks>
                Setiap sambungan, batas kelurahan, dan lokasi pengaduan tersimpan sebagai koordinat geografis — laporan
                kebocoran Anda tiba di petugas lengkap dengan titik kejadiannya.
              </SelTeks>
            </SpotlightCard>
          </Reveal>

          {/* Giliran air. */}
          <Reveal delay={0.24} className="md:col-span-2">
            <SpotlightCard className="h-full p-6">
              <div className="flex items-center gap-2.5">
                <Timer className="size-4.5 text-cyan-300" aria-hidden="true" />
                <SelJudul>Jadwal giliran tercatat</SelJudul>
              </div>
              <SelTeks>
                Sambungan dengan pasokan bergilir dicatat jam alirnya per hari, sehingga petugas membedakan
                &ldquo;gangguan&rdquo; dari &ldquo;memang belum jadwalnya&rdquo; saat menangani laporan Anda.
              </SelTeks>
              <div aria-hidden="true" className="mt-4 flex gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-400 uppercase">
                  Penuh · 24 jam
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-cyan-300 uppercase">
                  Bergilir · 04.00–09.00
                </span>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
