"use client"

// features/dashboard/components/laporan-harian/progres-harian.tsx —
// PEMANTAUAN SETORAN HARIAN PER PETUGAS.
//
// Tabel setoran menjawab "apa yang masuk". Layar ini menjawab pertanyaan
// penyelia yang justru tidak bisa dijawab tabel itu: hari mana yang kosong,
// siapa yang tidak menyetor di hari kerja, dan sejauh mana daftar kerjanya
// terkejar. Sesuatu yang TIDAK ADA tidak punya baris di tabel — ia hanya
// terlihat kalau seluruh tanggal periode digambar, termasuk yang nol.
//
// KOSONGNYA HARI DIBACA LEWAT JENIS HARINYA. Nol di hari Minggu adalah
// kabar baik; nol di hari Selasa adalah pekerjaan yang tidak dikerjakan.
// Karena itu kolom tanggal diwarnai menurut jenis harinya (hijau kerja,
// merah akhir pekan, oranye tanggal merah, biru lembur) dan hanya sel nol di
// HARI KERJA yang ditandai merah muda. Tanpa pembedaan itu, tabel sebulan
// akan dipenuhi tanda peringatan yang delapan-sembilan di antaranya cuma
// menandai akhir pekan.
//
// Jenis hari & ambang "diam" ditentukan server (lihat progres-pencatat di
// laporan-harian.router.ts) supaya aturannya tidak ditulis dua kali.

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { CalendarCheck, ClipboardList, UserCheck, UserX } from "lucide-react"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { NativeSelect } from "@workspace/ui/components/native-select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { formatPeriode } from "@/features/public/lib/format"
import { ambilSatu, ApiError } from "../../lib/api-client"
import { UKURAN_KONTROL } from "../kontrol"
import { Panel } from "../panel"
import { StatCard } from "../stat-card"

type Status = "selesai" | "jalan" | "diam" | "belum"
type JenisHari = "kerja" | "akhirpekan" | "libur" | "lembur"

interface BarisPencatat {
  id: string
  nama: string
  target: number
  tersetor: number
  terakhirSetor: string | null
  hariDiam: number | null
  status: Status
  perTanggal: Record<string, number>
}

interface Progres {
  periode: number
  tanggalAcuan: string | null
  ambangDiamHari: number
  hari: { tanggal: string; jenis: JenisHari }[]
  tanggal: string[]
  totalPerTanggal: { tanggal: string; jumlah: number }[]
  pencatat: BarisPencatat[]
}

const angka = (n: number) => n.toLocaleString("id-ID")

/// "2026-08-05" → "5 Agu".
function tanggalPendek(iso: string): string {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  const [, b, t] = iso.split("-")
  return `${Number(t)} ${bulan[Number(b) - 1] ?? ""}`
}

/// Warna JENIS HARI — kosakata status, bukan warna deret data: tiap warna
/// punya arti tetap dan selalu ditemani label (lihat Legenda di bawah), jadi
/// tidak ada informasi yang hanya dibawa warna.
///
/// Semuanya lewat opasitas token (`/15`, `/25`), bukan warna 50/100 yang
/// hanya benar di tema terang — di tema gelap warna itu jadi bercak pucat
/// yang menelan angkanya.
const GAYA_HARI: Record<JenisHari, { kepala: string; teks: string; label: string }> = {
  kerja: {
    kepala: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    teks: "text-emerald-700 dark:text-emerald-400",
    label: "Hari kerja",
  },
  akhirpekan: {
    kepala: "bg-red-500/15 text-red-800 dark:text-red-300",
    teks: "text-red-700 dark:text-red-400",
    label: "Sabtu/Minggu",
  },
  libur: {
    kepala: "bg-orange-500/20 text-orange-900 dark:text-orange-300",
    teks: "text-orange-700 dark:text-orange-400",
    label: "Libur nasional",
  },
  lembur: {
    kepala: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    teks: "text-sky-700 dark:text-sky-400",
    label: "Lembur (menyetor di hari libur)",
  },
}

/// Warna batang grafik per jenis hari — sengaja SAMA dengan warna kepala
/// kolom tabel. Dua bagian layar yang bicara soal hari yang sama tidak boleh
/// memakai dua kosakata warna.
const WARNA_BATANG: Record<JenisHari, string> = {
  kerja: "var(--color-kerja)",
  akhirpekan: "var(--color-akhirpekan)",
  libur: "var(--color-libur)",
  lembur: "var(--color-lembur)",
}

const KONFIG_GRAFIK = {
  jumlah: { label: "Setoran" },
  kerja: { label: "Hari kerja", color: "var(--chart-2)" },
  akhirpekan: { label: "Sabtu/Minggu", color: "oklch(0.62 0.19 25)" },
  libur: { label: "Libur nasional", color: "oklch(0.68 0.16 55)" },
  lembur: { label: "Lembur", color: "oklch(0.62 0.14 240)" },
} satisfies ChartConfig

const GAYA_STATUS: Record<Status, { label: string; kelas: string }> = {
  selesai: { label: "Selesai", kelas: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  jalan: { label: "Jalan", kelas: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  diam: { label: "Diam", kelas: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  belum: { label: "Belum mulai", kelas: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400" },
}

function Lencana({ status }: { status: Status }) {
  const g = GAYA_STATUS[status]
  return (
    <span className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${g.kelas}`}>
      {g.label}
    </span>
  )
}

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      {(Object.keys(GAYA_HARI) as JenisHari[]).map((j) => (
        <span key={j} className="inline-flex items-center gap-1.5">
          <span className={`inline-block size-2.5 border border-border/70 ${GAYA_HARI[j].kepala}`} />
          {GAYA_HARI[j].label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 border border-red-500/40 bg-red-500/20" />
        Tidak menyetor di hari kerja
      </span>
    </div>
  )
}

export function ProgresHarian({ periodes }: { periodes: number[] }) {
  const [periode, setPeriode] = React.useState<number | null>(null)
  const [data, setData] = React.useState<Progres | null>(null)
  const [galat, setGalat] = React.useState<string | null>(null)

  // Periode bawaan = yang terbaru punya setoran. Dipilih saat render (bukan
  // effect) supaya tidak ada satu putaran permintaan dengan periode kosong.
  const [periodeAwal, setPeriodeAwal] = React.useState<number | null>(null)
  if (periodes.length > 0 && periodeAwal !== periodes[0]) {
    setPeriodeAwal(periodes[0]!)
    if (periode === null) setPeriode(periodes[0]!)
  }

  React.useEffect(() => {
    if (periode === null) return
    let batal = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null)
    setGalat(null)
    ambilSatu<Progres>("/laporan-harian/progres-pencatat", { periode })
      .then((d) => { if (!batal) setData(d) })
      .catch((e) => {
        if (!batal) setGalat(e instanceof ApiError ? e.message : "Progres gagal dimuat.")
      })
    return () => { batal = true }
  }, [periode])

  const jenisPer = React.useMemo(
    () => new Map((data?.hari ?? []).map((h) => [h.tanggal, h.jenis])),
    [data]
  )

  const ringkas = React.useMemo(() => {
    if (!data) return null
    const acuan = data.tanggalAcuan
    const setorAcuan = acuan ? data.pencatat.reduce((n, p) => n + (p.perTanggal[acuan] ?? 0), 0) : 0
    const orangAcuan = acuan ? data.pencatat.filter((p) => (p.perTanggal[acuan] ?? 0) > 0).length : 0
    const target = data.pencatat.reduce((n, p) => n + p.target, 0)
    const tersetor = data.pencatat.reduce((n, p) => n + p.tersetor, 0)
    const belumJalan = data.pencatat.filter((p) => p.status === "belum" || p.status === "diam").length
    return { setorAcuan, orangAcuan, target, tersetor, belumJalan }
  }, [data])

  const grafik = React.useMemo(
    () =>
      (data?.totalPerTanggal ?? []).map((t) => ({
        ...t,
        jenis: jenisPer.get(t.tanggal) ?? ("kerja" as JenisHari),
      })),
    [data, jenisPer]
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Periode
        </span>
        <NativeSelect
          aria-label="Periode"
          size={UKURAN_KONTROL}
          value={periode ?? ""}
          onChange={(e) => setPeriode(Number(e.currentTarget.value))}
          className="w-auto min-w-36"
        >
          {periodes.map((p) => (
            <option key={p} value={p}>{formatPeriode(p)}</option>
          ))}
        </NativeSelect>
        {data?.tanggalAcuan && (
          <span className="text-xs text-muted-foreground">
            Setoran terakhir masuk {tanggalPendek(data.tanggalAcuan)}
          </span>
        )}
      </div>

      {galat && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{galat}</AlertDescription>
        </Alert>
      )}

      {!data && !galat && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {data && ringkas && (
        data.tanggal.length === 0 ? (
          <Alert>
            <AlertDescription className="text-xs">
              Periode {formatPeriode(data.periode)} belum punya satu pun tanggal untuk ditampilkan.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-border/70 bg-border/70 xl:grid-cols-4">
              <StatCard
                label="Setoran hari terakhir"
                nilai={angka(ringkas.setorAcuan)}
                keterangan={data.tanggalAcuan ? tanggalPendek(data.tanggalAcuan) : "Belum ada setoran"}
                icon={CalendarCheck}
              />
              <StatCard
                label="Petugas menyetor"
                nilai={`${ringkas.orangAcuan}/${data.pencatat.length}`}
                keterangan="Pada hari terakhir yang ada setorannya"
                icon={UserCheck}
              />
              <StatCard
                label="Belum menyetor"
                nilai={angka(ringkas.belumJalan)}
                keterangan={`Belum mulai, atau diam ≥ ${data.ambangDiamHari} hari`}
                icon={UserX}
                nada={ringkas.belumJalan > 0 ? "perhatian" : "netral"}
              />
              <StatCard
                label="Capaian periode"
                nilai={ringkas.target > 0 ? `${Math.round((ringkas.tersetor / ringkas.target) * 100)}%` : "—"}
                keterangan={`${angka(ringkas.tersetor)} dari ${angka(ringkas.target)} daftar kerja`}
                icon={ClipboardList}
              />
            </div>

            <Panel
              label="Setoran per Tanggal"
              chip={`${data.tanggal.length} Hari`}
              deskripsi="Seluruh tanggal periode digambar, termasuk yang nol — hari kosong adalah kabarnya, bukan ketiadaan data."
            >
              <div className="flex flex-col gap-3">
                <ChartContainer config={KONFIG_GRAFIK} className="h-44 w-full sm:h-56">
                  <BarChart data={grafik} margin={{ left: 0, right: 8, top: 4 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="tanggal"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      // Hanya tanggalnya; bulannya sudah disebut di kepala.
                      tickFormatter={(v: string) => String(Number(v.slice(-2)))}
                      interval="preserveStartEnd"
                      minTickGap={8}
                    />
                    <YAxis tickLine={false} axisLine={false} width={44} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v) => {
                            const t = String(v)
                            return `${tanggalPendek(t)} · ${GAYA_HARI[jenisPer.get(t) ?? "kerja"].label}`
                          }}
                          formatter={(v) => ` ${angka(Number(v))} setoran`}
                        />
                      }
                    />
                    {/* Ujung membulat 4px menempel garis dasar; tidak ada
                        angka di atas tiap batang — nilainya dibaca lewat
                        tooltip atau tabel di bawah. */}
                    <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} maxBarSize={26}>
                      {grafik.map((g) => (
                        <Cell key={g.tanggal} fill={WARNA_BATANG[g.jenis]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <Legenda />
              </div>
            </Panel>

            {/* TABEL MATRIKS — pertanyaan "berapa setoran si A tanggal 12"
                hanya bisa dijawab bentuk ini.
                • Kolom nama DIPATOK KIRI: dengan sampai 31 kolom tanggal,
                  menggulir ke kanan tanpa itu membuat orang kehilangan jejak
                  baris siapa yang dilihat.
                • Setor/Target/% DI UJUNG KANAN, sesudah deret tanggal —
                  angka rangkuman dibaca setelah rinciannya, dan menaruhnya
                  di depan mendorong tanggal 1 keluar dari pandangan pertama. */}
            <Panel
              label="Rincian per Petugas per Tanggal"
              chip={`${data.pencatat.length} Petugas`}
              deskripsi="Angka = jumlah setoran hari itu. Sel merah muda = tidak menyetor pada hari kerja."
              className="p-0"
            >
              <div className="scrollbar-tipis w-full overflow-x-auto">
                {/* border-collapse + border di tiap sel = grid penuh. Pada
                    tabel matriks, garis vertikal BUKAN hiasan: tanpa itu mata
                    kehilangan kolom tanggal saat menyusuri baris ke kanan. */}
                <table className="w-max min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="[&>th]:border [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-1.5 [&>th]:text-[10px] [&>th]:font-semibold [&>th]:tracking-wide [&>th]:uppercase">
                      <th
                        className="sticky left-0 z-10 bg-muted/95 text-left backdrop-blur"
                        style={{ minWidth: 170 }}
                      >
                        Petugas
                      </th>
                      {data.hari.map((h) => (
                        <th
                          key={h.tanggal}
                          className={`text-center tabular-nums ${GAYA_HARI[h.jenis].kepala}`}
                          title={`${tanggalPendek(h.tanggal)} · ${GAYA_HARI[h.jenis].label}`}
                          style={{ minWidth: 40 }}
                        >
                          {Number(h.tanggal.slice(-2))}
                        </th>
                      ))}
                      <th className="bg-muted/60 text-right" style={{ minWidth: 80 }}>Setor</th>
                      <th className="bg-muted/60 text-right" style={{ minWidth: 80 }}>Target</th>
                      <th className="bg-muted/60 text-right" style={{ minWidth: 60 }}>%</th>
                      <th className="bg-muted/60 text-left" style={{ minWidth: 96 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pencatat.map((p) => {
                      const persen = p.target > 0 ? Math.round((p.tersetor / p.target) * 100) : null
                      return (
                        <tr
                          key={p.id}
                          className="[&>td]:border [&>td]:border-border/70 [&>td]:px-2 [&>td]:py-1.5 [&>td]:whitespace-nowrap"
                        >
                          <td className="sticky left-0 z-10 bg-card px-3! font-medium">{p.nama}</td>
                          {data.hari.map((h) => {
                            const n = p.perTanggal[h.tanggal] ?? 0
                            // Nol yang PERLU dilihat hanya nol di hari kerja.
                            const bolong = n === 0 && h.jenis === "kerja"
                            return (
                              <td
                                key={h.tanggal}
                                className={
                                  "text-center font-mono tabular-nums " +
                                  (bolong
                                    ? "bg-red-500/20 text-red-700 dark:text-red-300"
                                    : n === 0
                                      ? "text-muted-foreground/40"
                                      : GAYA_HARI[h.jenis].teks)
                                }
                                title={
                                  bolong
                                    ? `${p.nama} tidak menyetor ${tanggalPendek(h.tanggal)} (hari kerja)`
                                    : `${p.nama} · ${tanggalPendek(h.tanggal)} · ${angka(n)} setoran`
                                }
                              >
                                {n === 0 ? (bolong ? "0" : "·") : angka(n)}
                              </td>
                            )
                          })}
                          <td className="bg-muted/30 text-right font-mono font-medium tabular-nums">
                            {angka(p.tersetor)}
                          </td>
                          <td className="bg-muted/30 text-right font-mono text-muted-foreground tabular-nums">
                            {angka(p.target)}
                          </td>
                          <td className="bg-muted/30 text-right font-mono tabular-nums">
                            {persen === null ? "—" : `${persen}%`}
                          </td>
                          <td className="bg-muted/30"><Lencana status={p.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="[&>td]:border [&>td]:border-border/70 [&>td]:bg-muted/60 [&>td]:px-2 [&>td]:py-1.5 [&>td]:font-semibold [&>td]:whitespace-nowrap">
                      <td className="sticky left-0 z-10 bg-muted/95 px-3! backdrop-blur">Total</td>
                      {data.totalPerTanggal.map((t) => (
                        <td key={t.tanggal} className="text-center font-mono tabular-nums">
                          {t.jumlah === 0 ? "·" : angka(t.jumlah)}
                        </td>
                      ))}
                      <td className="text-right font-mono tabular-nums">{angka(ringkas.tersetor)}</td>
                      <td className="text-right font-mono tabular-nums">{angka(ringkas.target)}</td>
                      <td className="text-right font-mono tabular-nums">
                        {ringkas.target > 0 ? `${Math.round((ringkas.tersetor / ringkas.target) * 100)}%` : "—"}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="border-t border-border/70 px-4 py-3">
                <Legenda />
              </div>
            </Panel>
          </>
        )
      )}
    </div>
  )
}
