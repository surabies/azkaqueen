"use client"

// features/dashboard/components/anomali/anomali-client.tsx
//
// Layar pemantauan sambungan tidak terukur. DUA TAB, karena keduanya melayani
// pekerjaan yang berbeda dan alat yang berbeda:
//
//   1. RINGKASAN & TREN — menilai. Satu-satunya angka yang mengukur
//      keberhasilan modul ini; tidak ada target kunjungan, yang dinilai
//      apakah garisnya turun. Ditemani penjelasan tiap kategori.
//   2. DAFTAR KUNJUNGAN — mengerjakan. Bilah penyaring + tabel: rumah mana
//      yang didatangi, di wilayah mana.
//
// Sebelumnya keduanya satu gulungan panjang, sehingga tabel kerja terdorong
// jauh ke bawah kartu penjelasan yang cuma perlu dibaca sesekali.
//
// RINGKASAN tetap jadi tab bawaan. Alasannya sama dengan kenapa tren dulu
// ditaruh paling atas: membuka daftar lebih dulu membuat orang menghitung
// kesibukan ("berapa yang dikunjungi bulan ini") alih-alih hasil ("apakah
// anomalinya berkurang").

import * as React from "react"
import { AlertTriangle, DoorClosed, House, Wrench, TrendingDown, TrendingUp, Minus } from "lucide-react"
import {
  LABEL_HASIL,
  LABEL_KATEGORI,
  PENJELASAN_KATEGORI,
  RISIKO_KATEGORI,
  SEMUA_KATEGORI,
  type KategoriAnomali,
} from "@workspace/domain/anomali"
import { Badge } from "@workspace/ui/components/badge"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
// Peta label yang SAMA dengan layar verifikasi — TTB, DK, dan BMK/BMB tetap
// tampil sebagai kode yang dipakai pencatat sehari-hari, hanya yang bertele-tele
// yang dipanjangkan. Dua halaman yang membaca kolom sama tidak boleh menyebutnya
// dengan dua cara.
import { LABEL_KONDISI_CATAT } from "../../lib/label"
import { cariAnomaliAction, type FilterAnomali, type HasilDaftar } from "../../actions/anomali"
import { PanelDetailSambungan } from "./panel-detail-sambungan"
import { FILTER_AWAL, ToolbarAnomali } from "./toolbar-anomali"

const IKON: Record<KategoriAnomali, React.ComponentType<{ className?: string }>> = {
  TERKUNCI: DoorClosed,
  DIDUGA_KOSONG: House,
  METER_RUSAK: Wrench,
}

export interface BarisAnomaliTampilan {
  pelangganId: string
  nomorLangganan: string
  nama: string
  alamat: string | null
  kategori: KategoriAnomali
  kondisiTerakhir: string
  bulanBerturut: number
  m3TanpaDasar: number
  skor: number
  jumlahRekTunggak: number
  prioritas: boolean
  ruteKode: string | null
  kelurahan: string | null
  rt: string | null
  rw: string | null
  noUrutRute: number | null
  kunjunganTerakhir: { periode: number; hasil: string; dikunjungiAt: string | Date } | null
}

export interface TitikTrenTampilan {
  periode: number
  TERKUNCI: number
  DIDUGA_KOSONG: number
  METER_RUSAK: number
  total: number
  dikunjungi: number
  cukupData: boolean
  berjalan: boolean
}

export interface DataAnomali {
  ambangBulan: number
  total: number
  prioritas: number
  perKategori: Record<KategoriAnomali, number>
  baris: BarisAnomaliTampilan[]
  kelurahanTersedia: string[]
  tren: TitikTrenTampilan[]
}

const angka = (x: number) => x.toLocaleString("id-ID")

function labelPeriode(thbl: number): string {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  return `${bulan[(thbl % 100) - 1] ?? "?"} ${Math.floor(thbl / 100)}`
}

function Penjelasan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{judul}</p>
      <p className="mt-1 text-sm leading-relaxed">{isi}</p>
    </div>
  )
}

type Tab = "ringkasan" | "daftar"

export function AnomaliClient({ data }: { data: DataAnomali }) {
  /// Bawaannya RINGKASAN, bukan daftar — alasan yang sama seperti kenapa tren
  /// dulu ditaruh paling atas (lihat catatan di kepala berkas): yang dibuka
  /// lebih dulu ikut menentukan pertanyaan apa yang orang bawa ke halaman ini.
  const [tab, setTab] = React.useState<Tab>("ringkasan")
  const [filter, setFilter] = React.useState<FilterAnomali>({
    ...FILTER_AWAL,
    ambangBulan: data.ambangBulan,
  })
  /// Baris yang panel detailnya sedang terbuka. Menyimpan barisnya (bukan
  /// id-nya saja) supaya judul panel bisa langsung terisi sementara isinya
  /// masih dimuat — nomor dan nama sudah ada di tangan, tak perlu ditunggu.
  const [dibuka, setDibuka] = React.useState<BarisAnomaliTampilan | null>(null)

  /// Hasil disimpan BERSAMA objek filter yang melahirkannya. `setFilter`
  /// selalu menghasilkan objek baru, jadi perbandingan identitas cukup untuk
  /// tahu apakah hasil di tangan masih menjawab pertanyaan yang sedang
  /// ditanyakan — dan "sedang memuat" jadi turunan dari itu, bukan state
  /// terpisah yang harus disetel di dalam effect.
  const [dariServer, setDariServer] = React.useState<{
    untuk: FilterAnomali
    hasil: HasilDaftar
  } | null>(null)

  const belumDisaring =
    filter.q === "" &&
    filter.kategori === "SEMUA" &&
    !filter.hanyaPrioritas &&
    !filter.sembunyikanSudahDikunjungi &&
    filter.kelurahan === "" &&
    filter.ambangBulan === data.ambangBulan &&
    filter.urutan === "paparan" &&
    // Muatan awal dari server juga dipotong 300, jadi selama batasnya masih
    // 300 data itu masih menjawab — begitu diubah, harus diambil ulang.
    filter.batas === FILTER_AWAL.batas

  React.useEffect(() => {
    if (belumDisaring) return
    let aktif = true
    void cariAnomaliAction(filter).then((r) => {
      if (aktif) setDariServer({ untuk: filter, hasil: r })
    })
    return () => {
      aktif = false
    }
  }, [filter, belumDisaring])

  const hasilAktif =
    !belumDisaring && dariServer?.untuk === filter ? dariServer.hasil : null
  const memuat = !belumDisaring && hasilAktif == null
  const terlihat: BarisAnomaliTampilan[] =
    hasilAktif?.status === "ok" ? hasilAktif.baris : belumDisaring ? data.baris : []
  const total = hasilAktif?.status === "ok" ? hasilAktif.total : data.total
  const prioritas = hasilAktif?.status === "ok" ? hasilAktif.prioritas : data.prioritas
  const perKategori = hasilAktif?.status === "ok" ? hasilAktif.perKategori : data.perKategori
  const galat = hasilAktif != null && hasilAktif.status !== "ok" ? hasilAktif : null
  // Berlaku untuk KEDUA sumber: muatan awal server maupun hasil saring, sama-
  // sama dipotong `batas`. Yang menentukan bukan dari mana datanya datang,
  // melainkan apakah yang tampil lebih sedikit dari yang cocok.
  const dipotong = !memuat && terlihat.length < total

  // Perbandingan hanya sah antar titik yang riwayatnya sama-sama cukup —
  // membandingkan dengan periode yang datanya belum lengkap menghasilkan
  // "turun drastis" yang palsu. Bulan BERJALAN ikut dikecualikan dengan alasan
  // yang sama: totalnya masih menyalin bulan lalu karena belum di-closing,
  // jadi selisihnya akan selalu nol dan terbaca "Tetap" secara menyesatkan.
  const trenSah = data.tren.filter((t) => t.cukupData && !t.berjalan)
  const terakhir = trenSah.at(-1)
  const sebelum = trenSah.at(-2)
  const selisih = terakhir && sebelum ? terakhir.total - sebelum.total : null

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-6">
      {/* Dua pekerjaan yang berbeda, jadi dua permukaan yang berbeda:
          MENILAI (apakah keadaannya membaik) dan MENGERJAKAN (rumah mana yang
          didatangi). Sebelumnya keduanya bertumpuk di satu gulungan panjang,
          sehingga tabel daftar terdorong jauh ke bawah kartu-kartu penjelasan
          yang hanya perlu dibaca sesekali. */}
      <TabsList>
        <TabsTrigger value="ringkasan">Ringkasan &amp; tren</TabsTrigger>
        <TabsTrigger value="daftar">
          Daftar kunjungan
          <span className="ml-1.5 tabular-nums text-muted-foreground">{angka(total)}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ringkasan" className="space-y-6">
        {/* ── TREN ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Tren anomali</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ukuran keberhasilan modul ini. Tidak ada target kunjungan — yang dinilai apakah
                angkanya turun dari bulan ke bulan.
              </p>
            </div>
            {selisih !== null && (
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                {selisih < 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                ) : selisih > 0 ? (
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {selisih < 0 ? `Turun ${angka(-selisih)}` : selisih > 0 ? `Naik ${angka(selisih)}` : "Tetap"}
                </span>
                <span className="text-xs text-muted-foreground">dari bulan lalu</span>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Periode</th>
                  {SEMUA_KATEGORI.map((k) => (
                    <th key={k} className="pb-2 text-right font-medium">
                      {LABEL_KATEGORI[k]}
                    </th>
                  ))}
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="pb-2 text-right font-medium">Dikunjungi</th>
                </tr>
              </thead>
              <tbody>
                {data.tren.map((t) => (
                  <tr key={t.periode} className="border-b last:border-0">
                    <td className="py-2 font-medium">
                      {labelPeriode(t.periode)}
                      {/* Bulan berjalan belum di-closing, jadi totalnya masih
                          menyalin bulan sebelumnya. Tanpa penanda ini barisnya
                          terbaca sebagai "anomali berhenti berkurang". */}
                      {t.berjalan && (
                        <span className="ml-1.5 font-normal text-muted-foreground">berjalan</span>
                      )}
                    </td>
                    {t.cukupData ? (
                      <>
                        {SEMUA_KATEGORI.map((k) => (
                          <td key={k} className="py-2 text-right tabular-nums">
                            {angka(t[k])}
                          </td>
                        ))}
                        <td className="py-2 text-right font-semibold tabular-nums">{angka(t.total)}</td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">
                          {t.dikunjungi > 0 ? angka(t.dikunjungi) : "—"}
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="py-2 text-right text-xs text-muted-foreground">
                        riwayat belum cukup {data.ambangBulan} bulan untuk dinilai
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── RINGKASAN KATEGORI ───────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-3">
          {SEMUA_KATEGORI.map((k) => {
            const Ikon = IKON[k]
            const aktif = filter.kategori === k
            return (
              <button
                key={k}
                // Ubin ini SEKALIGUS penyaring: angkanya dan isi daftar di bawah
                // kini berasal dari perhitungan yang sama, jadi tidak mungkin
                // lagi tertulis 1.200 tapi yang tampil cuma 300.
                onClick={() => setFilter((f) => ({ ...f, kategori: aktif ? "SEMUA" : k }))}
                aria-pressed={aktif}
                className={`rounded-2xl border p-4 text-left transition ${aktif ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center gap-2">
                  <Ikon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{LABEL_KATEGORI[k]}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{angka(perKategori[k] ?? 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{RISIKO_KATEGORI[k]}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                  {aktif ? "Klik lagi untuk menampilkan semua" : "Klik untuk menyaring & lihat penjelasan"}
                </p>
              </button>
            )
          })}
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sambungan di daftar ini ditagih berdasarkan <strong>taksiran</strong>, bukan angka meter
            yang terbaca. Makin lama dibiarkan, makin besar selisih yang menumpuk — dan saat meternya
            akhirnya terbaca, selisih itu mendarat sebagai satu tagihan besar yang sulit dijelaskan
            ke pelanggan.
          </AlertDescription>
        </Alert>

        {/* PENJELASAN KATEGORI — ditulis untuk dibacakan saat presentasi.
            Muncul saat sebuah kategori dipilih di atas, karena menampilkan
            ketiganya sekaligus membuat halaman jadi dinding teks yang justru
            tidak dibaca. */}
        {filter.kategori !== "SEMUA" && (
          <section className="rounded-2xl border bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              {React.createElement(IKON[filter.kategori], { className: "mt-0.5 h-5 w-5 shrink-0" })}
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{LABEL_KATEGORI[filter.kategori]}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {angka(perKategori[filter.kategori] ?? 0)} sambungan
                  </p>
                </div>

                <Penjelasan judul="Apa yang terjadi" isi={PENJELASAN_KATEGORI[filter.kategori].apa} />
                <Penjelasan
                  judul="Kenapa ini merugikan"
                  isi={PENJELASAN_KATEGORI[filter.kategori].kenapaPenting}
                />
                <Penjelasan
                  judul="Tindakan petugas"
                  isi={PENJELASAN_KATEGORI[filter.kategori].tindakan}
                />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kondisi catat yang termasuk
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PENJELASAN_KATEGORI[filter.kategori].kondisi.map((k) => (
                      <Badge key={k} variant="outline" className="font-mono text-[11px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Istilah di atas diambil persis dari kolom <span className="font-mono">Nm_Kel</span>{" "}
                    berkas pencatatan — sama dengan yang dipakai petugas sehari-hari.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </TabsContent>

      {/* ── DAFTAR ───────────────────────────────────────────── */}
      <TabsContent value="daftar" className="space-y-4">
        <ToolbarAnomali
          filter={filter}
          onGanti={setFilter}
          kelurahanTersedia={data.kelurahanTersedia}
          jumlahTampil={total}
          memuat={memuat}
        />

        <section className="rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-base font-semibold">
                Daftar kunjungan
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {angka(terlihat.length)}
                  {dipotong ? ` teratas dari ${angka(total)}` : ` dari ${angka(total)}`}
                </span>
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filter.urutan === "rute"
                  ? "Dikelompokkan menurut wilayah: kelurahan → RW → RT, lalu urutan rute bila terisi."
                  : "Diurutkan menurut paparan: lama tidak terbaca × m³ yang ditagih tanpa dasar."}
                {" "}
                {angka(prioritas)} di antaranya tanpa tunggakan.
              </p>
            </div>
          </div>

          {galat != null ? (
            <p className="p-8 text-center text-sm text-destructive">
              {galat.status === "tidak-berwenang"
                ? "Anda tidak berwenang membuka data ini."
                : galat.pesan}
            </p>
          ) : memuat && terlihat.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Memuat…</p>
          ) : terlihat.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada sambungan yang cocok dengan penyaring ini.
            </p>
          ) : (
            <div className="scrollbar-tipis relative max-h-[70vh] min-w-0 overflow-auto">
              {/* Pola tabel disamakan dengan tabel-verifikasi: `w-max min-w-full`
                  (tumbuh mengikuti isi, minimal selebar wadah) di dalam wadah
                  `min-w-0 overflow-auto`. `w-full` polos memerintahkan tabel MUAT
                  ke lebar wadah, sehingga kolom saling menghimpit sampai tak
                  terbaca dan gulir mendatar tidak pernah muncul.
                  Kepala tabel dipatok supaya judul kolom tidak hilang saat
                  menggulir ribuan baris. */}
              <table className="w-max min-w-full border-collapse text-sm [&_td]:px-3 [&_td]:py-2.5">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-muted/95 text-muted-foreground supports-[backdrop-filter]:bg-muted/85 [&>th]:border-border/70 [&>th]:border-b [&>th]:px-3 [&>th]:py-3 [&>th]:text-left [&>th]:text-xs [&>th]:font-semibold [&>th]:whitespace-nowrap [&>th]:backdrop-blur">
                    <th style={{ minWidth: 132 }}>Id Pelanggan</th>
                    <th style={{ minWidth: 220 }}>Nama</th>
                    <th style={{ minWidth: 300 }}>Alamat</th>
                    {/* Keterangan catat, BUKAN kategori. Kategori ("Meter Tidak
                        Bisa Dibaca") hanyalah pengelompokan dari kondisi yang
                        sudah tampil di sebelahnya — dua kolom yang mengatakan
                        hal sama, dan yang lebih kabur justru yang lebih besar.
                        Kategori tetap hidup sebagai penyaring di toolbar dan
                        ubin, tempat pengelompokan memang berguna. */}
                    <th style={{ minWidth: 150 }}>Keterangan catat</th>
                    <th className="text-right" style={{ minWidth: 84 }}>Bulan</th>
                    <th className="text-right" style={{ minWidth: 96 }}>M3</th>
                    <th className="text-right" style={{ minWidth: 120 }}>Tunggakan</th>
                    <th style={{ minWidth: 104 }}>Rute</th>
                    <th style={{ minWidth: 200 }}>Kunjungan</th>
                  </tr>
                </thead>
                <tbody>
                  {terlihat.map((b) => (
                    <tr
                      key={b.pelangganId}
                      // Seluruh baris jadi pemicu, bukan tombol kecil di ujung:
                      // sasaran kliknya besar dan tidak perlu dicari-cari.
                      onClick={() => setDibuka(b)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setDibuka(b)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Lihat detail ${b.nomorLangganan} — ${b.nama}`}
                      className="border-border/70 cursor-pointer border-b hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <td className="font-mono text-xs whitespace-nowrap">{b.nomorLangganan}</td>
                      <td className="font-medium">{b.nama}</td>
                      <td className="text-muted-foreground">{b.alamat ?? "—"}</td>
                      <td className="whitespace-nowrap">
                        {LABEL_KONDISI_CATAT[b.kondisiTerakhir] ?? b.kondisiTerakhir}
                      </td>
                      <td className="text-right tabular-nums">{b.bulanBerturut}</td>
                      <td className="text-right font-medium tabular-nums">{angka(b.m3TanpaDasar)}</td>
                      <td className="text-right whitespace-nowrap tabular-nums">
                        {b.jumlahRekTunggak === 0 ? (
                          <span className="text-muted-foreground">rutin bayar</span>
                        ) : (
                          `${b.jumlahRekTunggak} rek`
                        )}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap">{b.ruteKode ?? "—"}</td>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {b.kunjunganTerakhir
                          ? `${labelPeriode(b.kunjunganTerakhir.periode)} · ${LABEL_HASIL[b.kunjunganTerakhir.hasil] ?? b.kunjunganTerakhir.hasil}`
                          : "belum pernah"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {dipotong && (
            <p className="border-t p-3 text-center text-xs text-muted-foreground">
              Menampilkan {angka(terlihat.length)} teratas dari {angka(total)} yang cocok.
              Perbesar &ldquo;baris&rdquo; di toolbar, atau persempit dengan pencarian dan
              penyaring — semuanya dihitung di server, bukan disaring dari potongan ini.
            </p>
          )}
        </section>
      </TabsContent>

      {/* Di LUAR TabsContent: panel detail dibuka dari daftar, tapi menutupnya
          tidak boleh bergantung pada tab mana yang sedang aktif. */}
      <PanelDetailSambungan
        pelangganId={dibuka?.pelangganId ?? null}
        nomorLangganan={dibuka?.nomorLangganan ?? ""}
        nama={dibuka?.nama ?? ""}
        alamat={dibuka?.alamat ?? null}
        onTutup={() => setDibuka(null)}
      />
    </Tabs>
  )
}
