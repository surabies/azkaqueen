"use client"

// features/dashboard/components/data-grid.tsx — SATU-SATUNYA pembungkus
// AG Grid Community untuk seluruh tabel dashboard. Semua halaman memakai ini
// supaya tema, toolbar, dan perilaku pagination konsisten — jangan merender
// <AgGridReact> langsung di tempat lain.
//
// Model baris: INFINITE. Tabel terbesar (pelanggan/tagihan/pembacaan) berisi
// >22.000 baris — memuat semuanya ke browser berarti ~MB JSON per kunjungan.
// Infinite model meminta per blok 50 baris ke /api/v1 (yang paginasinya
// memang berbentuk page/pageSize, lihat server/lib/pagination.ts).
//
// SORTING: server-side. Kolom yang diberi `sortable: true` di colDef HARUS
// ada di whitelist `sortQuery([...])` endpoint-nya (colId/field = nama kolom
// Prisma) — grid mengirim sortBy/sortDir dan AG Grid otomatis meminta ulang
// blok saat urutan berubah. Kolom di luar whitelist biarkan tanpa sortable.
//
// EKSPOR EXCEL: menarik SELURUH baris (mengikuti pencarian/filter/sort yang
// sedang aktif) per blok 1000 lewat endpoint yang sama, lalu menulis .xlsx
// di browser — bukan mengekspor 50 baris yang kebetulan termuat.
//
// PONSEL: tabel berkolom belasan tidak bisa dipaksa muat di layar 360px —
// menggulir mendatar untuk membaca satu baris adalah pekerjaan, bukan
// tampilan. Di bawah breakpoint md grid ini berganti bentuk: satu kolom
// selebar layar berisi KARTU per baris (lihat kolomKartu), header kolom
// disembunyikan, dan pengurutan pindah ke dropdown "Urutkan" di bilah alat
// karena tidak ada lagi kepala kolom yang bisa diklik.
import * as React from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type IDatasource,
  type GridApi,
  type ValueGetterParams,
  type ValueFormatterParams,
} from "ag-grid-community"
import { ArrowDownUp, CalendarDays, Columns3, FileSpreadsheet, RotateCcw, Search } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { ambilList, ApiError } from "../lib/api-client"
import { KELAS_ISIAN, KELAS_LEBAR_SARINGAN, UKURAN_KONTROL } from "./kontrol"

ModuleRegistry.registerModules([AllCommunityModule])

/// Tema dipetakan ke token CSS proyek (bukan warna hardcode) — dark mode
/// ikut benar otomatis karena nilai var berubah saat class `dark` menempel.
///
/// Yang dibenahi soal "tabelnya kurang enak dilihat": baris dinaikkan ke 40px
/// (13px teks di baris 28px terasa berdesakan), garis vertikal antar kolom
/// dimatikan — pemisah antar baris sudah cukup dan grid berjeruji membuat
/// halaman ramai, latar baris genap ditipiskan sebagai pemandu mata pada
/// tabel selebar layar, dan bingkai luar dilepas karena <section> pembungkus
/// sudah punya bingkai sendiri (dulu keduanya bertumpuk jadi garis ganda).
const temaGrid = themeQuartz.withParams({
  accentColor: "var(--primary)",
  backgroundColor: "var(--card)",
  foregroundColor: "var(--foreground)",
  borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
  headerBackgroundColor: "color-mix(in srgb, var(--muted) 45%, transparent)",
  headerTextColor: "var(--muted-foreground)",
  headerFontWeight: 600,
  fontFamily: "inherit",
  fontSize: 13,
  headerFontSize: 11,
  borderRadius: 0,
  wrapperBorderRadius: 0,
  wrapperBorder: false,
  columnBorder: false,
  rowHeight: 40,
  cellHorizontalPadding: 14,
  oddRowBackgroundColor: "color-mix(in srgb, var(--muted) 20%, transparent)",
  rowHoverColor: "color-mix(in srgb, var(--accent) 55%, transparent)",
  selectedRowBackgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
  browserColorScheme: "inherit",
})

/// Tinggi baris mode kartu — muat tiga baris teks + sepasang pasangan
/// label/nilai. Tetap (bukan autoHeight) karena model INFINITE mengukur
/// tinggi sebelum datanya tiba; tinggi yang berubah-ubah membuat gulir
/// meloncat saat blok berikutnya masuk.
const TINGGI_KARTU = 96

export interface FilterSelect {
  /** Nama query param di endpoint, mis. "status". */
  param: string
  label: string
  opsi: { value: string; label: string }[]
}

/** Penyaring rentang tanggal (dua kotak date + pintasan). Nilainya ikut
 *  `filterNilai` seperti dropdown biasa — tanggal kosong tidak terkirim
 *  karena api-client membuang param bernilai "". */
export interface FilterTanggal {
  /** Param batas bawah, mis. "tanggalDari". */
  paramDari: string
  /** Param batas atas, mis. "tanggalSampai". */
  paramSampai: string
  /** Tanggal apa yang disaring, mis. "Tanggal catat" / "Masuk". */
  label: string
}

/// Tanggal (YYYY-MM-DD) menurut WIB, bukan UTC dan bukan zona mesin.
/// `toISOString()` polos memberi tanggal UTC: pukul 06:00 WIB masih tanggal
/// KEMARIN di UTC, sehingga pintasan "Hari ini" akan menyaring hari yang
/// salah persis pada jam petugas mulai menyetor catatan. Server menafsirkan
/// tanggal ini sebagai hari WIB juga (server/lib/rentang-tanggal.ts).
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000
const TANGGAL_WIB = (mundurHari = 0) =>
  new Date(Date.now() + OFFSET_WIB_MS - mundurHari * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

const PAGE_SIZE = 50
const EKSPOR_BLOK = 1000
const EKSPOR_MAKS_BLOK = 100 // pagar keselamatan: maks 100rb baris per file

/** Nilai satu sel untuk ekspor: valueGetter/field, lalu valueFormatter —
 *  KECUALI kolom angka (cellClass tabular-nums): diekspor sebagai angka
 *  mentah supaya bisa di-SUM di Excel, bukan teks "Rp 173.540". */
function nilaiEkspor(c: ColDef, row: Record<string, unknown>): unknown {
  let v: unknown
  if (typeof c.valueGetter === "function") v = c.valueGetter({ data: row } as ValueGetterParams)
  else if (c.field) v = row[c.field]

  const kolomAngka = typeof c.cellClass === "string" && c.cellClass.includes("tabular-nums")
  if (typeof v === "number" && kolomAngka) return v
  if (typeof c.valueFormatter === "function") {
    return c.valueFormatter({ value: v, data: row } as ValueFormatterParams)
  }
  if (v === null || v === undefined) return ""
  if (typeof v === "object") return ""
  return v
}

/** Nilai satu sel sebagai TEKS siap tampil (mode kartu di ponsel). Sengaja
 *  lewat valueGetter/valueFormatter yang sudah ada di tiap colDef, bukan lewat
 *  cellRenderer-nya: renderer ditulis untuk sel setinggi 40px (titik status,
 *  lencana) dan hasilnya tidak selalu waras ditumpuk di dalam kartu. */
function teksSel(c: ColDef, row: Record<string, unknown>): string {
  let v: unknown
  if (typeof c.valueGetter === "function") v = c.valueGetter({ data: row } as ValueGetterParams)
  else if (c.field) v = row[c.field]

  if (typeof c.valueFormatter === "function") {
    const hasil = c.valueFormatter({ value: v, data: row } as ValueFormatterParams)
    return typeof hasil === "string" ? hasil : ""
  }
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") return v.toLocaleString("id-ID")
  if (typeof v === "object") return "—"
  return String(v)
}

/// Satu kolom selebar layar berisi kartu per baris — bentuk tabel di ponsel.
/// Urutan colDef dipakai apa adanya sebagai urutan kepentingan (kolom pertama
/// memang selalu identitas baris: nomor langganan, nomor tiket, kode), jadi
/// tiap grid dapat kartu yang masuk akal TANPA harus mendaftarkan tata letak
/// kartunya sendiri — 20 halaman tidak perlu disentuh satu per satu.
function kolomKartu(defs: ColDef[]): ColDef {
  const [c0, c1, c2, ...sisa] = defs
  const rinci = sisa.slice(0, 4)

  return {
    colId: "kartu",
    headerName: "",
    flex: 1,
    minWidth: 0,
    sortable: false,
    resizable: false,
    cellClass: "kartu-baris",
    cellRenderer: (p: ICellRendererParams) => {
      const row = p.data as Record<string, unknown> | undefined
      if (!row) return null
      return (
        <div className="flex h-full flex-col justify-center gap-1 overflow-hidden py-2">
          <div className="flex items-baseline gap-2">
            {c0 && (
              <span className="shrink-0 font-mono text-[12px] font-semibold tracking-tight text-primary">
                {teksSel(c0, row)}
              </span>
            )}
            {c1 && (
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {teksSel(c1, row)}
              </span>
            )}
          </div>
          {c2 && <p className="truncate text-xs text-muted-foreground">{teksSel(c2, row)}</p>}
          {rinci.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 overflow-hidden text-[11px] leading-tight">
              {rinci.map((c) => (
                <span key={c.colId ?? c.field ?? c.headerName} className="text-muted-foreground">
                  <span className="tracking-wide uppercase opacity-70">{c.headerName} </span>
                  <span className="font-medium text-foreground">{teksSel(c, row)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )
    },
  }
}

export function DataGrid({
  judul,
  endpoint,
  columnDefs,
  searchParam,
  searchPlaceholder = "Cari…",
  initialSearch = "",
  filters = [],
  filterTanggal,
  extraParams,
  tinggiClassName = "flex-1 min-h-96",
  onRowClicked,
  onRowContextMenu,
  idTerpilih,
  refreshKey,
}: {
  /** Micro-label strip header panel, mis. "Daftar Pelanggan". */
  judul: string
  /** Path list di bawah /api/v1, mis. "/pelanggan". */
  endpoint: string
  columnDefs: ColDef[]
  /** Nama param pencarian bila endpoint mendukung (biasanya "q"). Tanpa ini kotak cari disembunyikan. */
  searchParam?: string
  searchPlaceholder?: string
  initialSearch?: string
  filters?: FilterSelect[]
  /** Penyaring rentang tanggal; endpoint harus menerima kedua paramnya. */
  filterTanggal?: FilterTanggal
  /** Param tetap yang selalu ikut terkirim. */
  extraParams?: Record<string, string>
  tinggiClassName?: string
  /** Klik baris (pola master-detail, mis. halaman verifikasi). */
  onRowClicked?: (data: Record<string, unknown>) => void
  /** Klik kanan baris — pemicu menu aksi kontekstual (halaman verifikasi).
   *  Menyediakan koordinat viewport kursor; menu default browser ditekan. */
  onRowContextMenu?: (data: Record<string, unknown>, posisi: { x: number; y: number }) => void
  /** id baris yang sedang dipilih — disorot sinkron dengan panel detail. */
  idTerpilih?: string | null
  /** Naikkan nilainya untuk memaksa muat ulang data (setelah aksi verifikasi). */
  refreshKey?: number
}) {
  const apiRef = React.useRef<GridApi | null>(null)
  const mobil = useIsMobile()
  const [cari, setCari] = React.useState(initialSearch)
  const [filterNilai, setFilterNilai] = React.useState<Record<string, string>>({})
  // Urutan pilihan pengguna di mode kartu ("kolom:arah"). Di layar lega ini
  // selalu "" — di sana yang berlaku sortModel dari kepala kolom.
  const [urutKartu, setUrutKartu] = React.useState("")
  const [total, setTotal] = React.useState<number | null>(null)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [mengekspor, setMengekspor] = React.useState(false)
  // Kolom yang disembunyikan pengguna lewat picker "Kolom" di toolbar —
  // kunci = colId/field/headerName. Ekspor Excel ikut menghormatinya
  // (yang diekspor = yang terlihat).
  const [kolomSembunyi, setKolomSembunyi] = React.useState<Set<string>>(new Set())

  const kunciKolom = (c: ColDef) => c.colId ?? c.field ?? c.headerName ?? ""
  const defsTampil = React.useMemo(
    () => columnDefs.map((c) => ({ ...c, hide: kolomSembunyi.has(kunciKolom(c)) })),
    [columnDefs, kolomSembunyi]
  )
  const kolomTampil = React.useMemo(
    () => columnDefs.filter((c) => c.headerName && !kolomSembunyi.has(kunciKolom(c))),
    [columnDefs, kolomSembunyi]
  )
  // Yang benar-benar diberikan ke grid: kolom asli di layar lega, satu kolom
  // kartu di ponsel.
  const defsGrid = React.useMemo(
    () => (mobil ? [kolomKartu(kolomTampil)] : defsTampil),
    [mobil, kolomTampil, defsTampil]
  )
  /// Kolom yang boleh jadi pilihan "Urutkan" di ponsel = persis kolom yang
  /// sortable, karena hanya itu yang ada di whitelist sortQuery endpoint-nya.
  const kolomUrut = React.useMemo(
    () => columnDefs.filter((c) => c.sortable && c.headerName),
    [columnDefs]
  )

  // Datasource membaca state lewat ref supaya identitasnya stabil — ganti
  // filter cukup purge cache, tidak membangun ulang grid. Ref disinkronkan
  // di effect (bukan saat render — dilarang react-hooks/refs).
  const paramsRef = React.useRef({ cari: initialSearch, filterNilai: {} as Record<string, string> })
  // extraParams ikut lewat ref (bukan closure datasource) supaya parent bisa
  // menggantinya (mis. dropdown periode) tanpa membangun ulang grid — cukup
  // purge, blok diminta ulang dengan nilai terbaru.
  const extraRef = React.useRef(extraParams)
  const extraSerial = JSON.stringify(extraParams ?? {})
  const idTerpilihRef = React.useRef<string | null | undefined>(idTerpilih)
  // Sort terakhir yang dipakai grid — diikutkan saat ekspor supaya urutan
  // file Excel sama dengan yang terlihat di layar.
  const sortRef = React.useRef<{ sortBy?: string; sortDir?: string }>({})
  // Mode kartu tidak punya kepala kolom, jadi sortModel-nya selalu kosong;
  // urutan datang dari dropdown dan dibaca datasource lewat ref ini.
  const urutKartuRef = React.useRef("")

  const datasource = React.useMemo<IDatasource>(
    () => ({
      getRows: async (params) => {
        const { cari, filterNilai } = paramsRef.current
        const sm = params.sortModel?.[0]
        const [kolomUrut, arahUrut] = urutKartuRef.current.split(":")
        sortRef.current = sm
          ? { sortBy: sm.colId, sortDir: sm.sort }
          : kolomUrut
            ? { sortBy: kolomUrut, sortDir: arahUrut ?? "asc" }
            : {}
        try {
          setGalat(null)
          const { rows, total } = await ambilList<Record<string, unknown>>(endpoint, {
            page: Math.floor(params.startRow / PAGE_SIZE) + 1,
            pageSize: PAGE_SIZE,
            ...(searchParam && cari.trim() ? { [searchParam]: cari.trim() } : {}),
            ...filterNilai,
            ...sortRef.current,
            ...extraRef.current,
          })
          setTotal(total)
          params.successCallback(rows, total)
        } catch (err) {
          setGalat(err instanceof ApiError ? err.message : "Gagal memuat data.")
          params.failCallback()
        }
      },
    }),
    [endpoint, searchParam]
  )

  // Sinkronkan ref lalu purge cache (debounce): purge membuang seluruh blok
  // dan meminta ulang dari page 1 dengan param terbaru. Berlaku untuk kotak
  // cari, dropdown filter, extraParams dari parent, dan refreshKey (pemicu
  // muat ulang setelah aksi mutasi di halaman verifikasi).
  const pertama = React.useRef(true)
  React.useEffect(() => {
    paramsRef.current = { cari, filterNilai }
    extraRef.current = extraParams
    // Hanya berlaku di mode kartu: di layar lega urutan datang dari kepala
    // kolom, dan sisa pilihan dropdown ponsel akan jadi urutan "hantu" —
    // datanya terurut tanpa satu pun penanda di layar yang menjelaskannya.
    urutKartuRef.current = mobil ? urutKartu : ""
    if (pertama.current) {
      pertama.current = false
      return
    }
    const t = setTimeout(() => apiRef.current?.purgeInfiniteCache(), 350)
    return () => clearTimeout(t)
    // extraSerial mewakili isi extraParams di deps (identitas objeknya
    // berubah tiap render parent — pakai objeknya langsung akan purge
    // terus-menerus, karena itu extraParams sengaja tidak masuk deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, filterNilai, extraSerial, refreshKey, urutKartu, mobil])

  // Sorot baris terpilih: nilai dibaca getRowClass lewat ref, redraw saat
  // pilihan berubah (infinite model tidak merender ulang sendiri).
  React.useEffect(() => {
    idTerpilihRef.current = idTerpilih
    apiRef.current?.redrawRows()
  }, [idTerpilih])

  function gantiFilter(param: string, value: string) {
    setFilterNilai((lama) => ({ ...lama, [param]: value }))
  }

  /// Pintasan rentang mengganti DUA param sekaligus — lewat satu setState,
  /// bukan dua gantiFilter berurutan, supaya hanya sekali purge (dua kali
  /// berarti permintaan pertama terbuang dengan tanggal setengah terisi).
  function setRentang(dari: string, sampai: string) {
    if (!filterTanggal) return
    setFilterNilai((lama) => ({
      ...lama,
      [filterTanggal.paramDari]: dari,
      [filterTanggal.paramSampai]: sampai,
    }))
  }

  const adaPenyaring =
    cari.trim() !== "" || Object.values(filterNilai).some((v) => v !== "")

  async function eksporExcel() {
    if (mengekspor) return
    setMengekspor(true)
    setGalat(null)
    try {
      const { cari, filterNilai } = paramsRef.current
      const paramsUmum = {
        ...(searchParam && cari.trim() ? { [searchParam]: cari.trim() } : {}),
        ...filterNilai,
        ...sortRef.current,
        ...extraParams,
      }

      const semua: Record<string, unknown>[] = []
      for (let page = 1; page <= EKSPOR_MAKS_BLOK; page++) {
        const { rows, total } = await ambilList<Record<string, unknown>>(endpoint, {
          page,
          pageSize: EKSPOR_BLOK,
          ...paramsUmum,
        })
        semua.push(...rows)
        if (semua.length >= total || rows.length === 0) break
      }

      const data = semua.map((row) => {
        const o: Record<string, unknown> = {}
        for (const c of kolomTampil) o[c.headerName!] = nilaiEkspor(c, row)
        return o
      })

      // Import dinamis: xlsx (~400 kB) hanya diunduh saat tombol dipakai,
      // bukan membebani setiap kunjungan halaman.
      const XLSX = await import("xlsx")
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Data")
      const slug = judul.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      XLSX.writeFile(wb, `${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      setGalat(err instanceof ApiError ? err.message : "Gagal mengekspor data.")
    } finally {
      setMengekspor(false)
    }
  }

  return (
    // flex h-full flex-col: SEBELUMNYA section ini block biasa tanpa
    // tinggi apa pun, sehingga tinggiClassName="h-full" di grid wrapper
    // di bawah jadi referensi melingkar (section menunggu tinggi grid,
    // grid menunggu tinggi section) dan resolve ke 0 — AG Grid dapat
    // instruksi tinggi 0px, baris tidak pernah dirender. Sekarang section
    // mewarisi tinggi pasti dari parent-nya, toolbar di atas `shrink-0`,
    // dan grid wrapper `flex-1 min-h-0` benar-benar mengisi sisanya.
    <section className="flex h-full flex-col border border-border/70 bg-card">
      {/* Toolbar dua baris: baris 1 = identitas tabel + aksi (Kolom,
          Ekspor); baris 2 = pencarian + filter. Dipisah supaya deret filter
          panjang tidak berdesakan dengan tombol aksi di layar sempit.
          `min-w-0` + judul yang boleh terpotong: di layar 360px judul panjang
          dulu mendorong tombol aksi keluar baris. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
        <h2 className="min-w-0 truncate text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          {judul}
        </h2>
        {total !== null && (
          <span className="shrink-0 border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {total.toLocaleString("id-ID")}
            <span className="max-sm:hidden"> baris</span>
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size={UKURAN_KONTROL}
                title="Pilih kolom yang ditampilkan"
              >
                <Columns3 className="size-3.5" />
                {/* Label teks menyusut jadi ikon saja di ponsel — dua tombol
                    berlabel penuh tidak muat bersama judul dan cacah baris. */}
                <span className="max-sm:hidden">Kolom</span>
                {kolomSembunyi.size > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({columnDefs.filter((c) => c.headerName).length - kolomSembunyi.size})
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Kolom tampil
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnDefs
                .filter((c) => c.headerName)
                .map((c) => {
                  const kunci = kunciKolom(c)
                  return (
                    <DropdownMenuCheckboxItem
                      key={kunci}
                      checked={!kolomSembunyi.has(kunci)}
                      // preventDefault: menu tetap terbuka agar bisa
                      // mencentang beberapa kolom sekaligus.
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(tampil) =>
                        setKolomSembunyi((lama) => {
                          const baru = new Set(lama)
                          if (tampil) baru.delete(kunci)
                          else baru.add(kunci)
                          return baru
                        })
                      }
                    >
                      {c.headerName}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size={UKURAN_KONTROL}
            onClick={eksporExcel}
            disabled={mengekspor || total === 0}
            title="Unduh seluruh baris (sesuai filter & kolom aktif) sebagai file Excel"
          >
            {mengekspor ? <Spinner className="size-3.5" /> : <FileSpreadsheet className="size-3.5" />}
            <span className="max-sm:hidden">{mengekspor ? "Menyiapkan…" : "Ekspor"}</span>
          </Button>
        </div>
      </div>

      {(searchParam || filters.length > 0 || filterTanggal || (mobil && kolomUrut.length > 0)) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-muted/20 px-3 py-2 sm:px-4">
          {searchParam && (
            // Selebar bilah di ponsel (dan karena itu tampil sebaris sendiri),
            // lebar tetap begitu ada ruang: 11 digit nomor langganan tidak
            // butuh setengah layar 1440px.
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              {/* type/name/autoComplete WAJIB ada bersama.
                  Tanpa ketiganya, begitu ada dialog berkolom kata sandi
                  terbuka di halaman yang sama, Chrome mencari kolom "username"
                  pasangannya, memilih kotak cari ini, dan mengisinya dengan
                  nama akun tersimpan — teks yang tidak pernah diketik siapa
                  pun. `type="search"` membuat peramban memperlakukannya
                  sebagai pencarian, bukan kolom kredensial. */}
              <Input
                type="search"
                name="cari-grid"
                autoComplete="off"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${KELAS_ISIAN} w-full pl-8`}
                aria-label="Cari"
              />
            </div>
          )}
          {filters.map((f) => (
            <NativeSelect
              key={f.param}
              aria-label={f.label}
              size={UKURAN_KONTROL}
              value={filterNilai[f.param] ?? ""}
              onChange={(e) => gantiFilter(f.param, e.currentTarget.value)}
              className={`${KELAS_LEBAR_SARINGAN} sm:min-w-36`}
            >
              <option value="">{f.label}: semua</option>
              {f.opsi.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ))}

          {/* Mode kartu tidak punya kepala kolom untuk diklik — tanpa
              dropdown ini pengurutan hilang sama sekali di ponsel. */}
          {mobil && kolomUrut.length > 0 && (
            <div className={`relative ${KELAS_LEBAR_SARINGAN}`}>
              <ArrowDownUp className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <NativeSelect
                aria-label="Urutkan"
                size={UKURAN_KONTROL}
                value={urutKartu}
                onChange={(e) => setUrutKartu(e.currentTarget.value)}
                // Ruang untuk ikon di kiri; `[&>select]` karena className
                // NativeSelect menempel di pembungkusnya, bukan <select>.
                className="w-full [&>select]:pl-8"
              >
                <option value="">Urutan bawaan</option>
                {kolomUrut.map((c) => {
                  const kunci = c.colId ?? c.field ?? ""
                  return (
                    <React.Fragment key={kunci}>
                      <option value={`${kunci}:asc`}>{c.headerName} ↑</option>
                      <option value={`${kunci}:desc`}>{c.headerName} ↓</option>
                    </React.Fragment>
                  )
                })}
              </NativeSelect>
            </div>
          )}

          {filterTanggal && (
            // Sebaris penuh sendiri di ponsel (`basis-full`): sepasang kotak
            // tanggal + tiga pintasan tidak akan pernah muat berdampingan
            // dengan dropdown saringan di layar 360px.
            <div className="flex basis-full flex-wrap items-center gap-2 sm:basis-auto">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden /> {filterTanggal.label}
              </span>
              <Input
                type="date"
                value={filterNilai[filterTanggal.paramDari] ?? ""}
                onChange={(e) => gantiFilter(filterTanggal.paramDari, e.currentTarget.value)}
                className={`${KELAS_ISIAN} ${KELAS_LEBAR_SARINGAN}`}
                aria-label={`${filterTanggal.label} dari`}
              />
              <span className="text-[11px] text-muted-foreground">s/d</span>
              <Input
                type="date"
                value={filterNilai[filterTanggal.paramSampai] ?? ""}
                onChange={(e) => gantiFilter(filterTanggal.paramSampai, e.currentTarget.value)}
                className={`${KELAS_ISIAN} ${KELAS_LEBAR_SARINGAN}`}
                aria-label={`${filterTanggal.label} sampai`}
              />
              {/* Pintasan: pertanyaan harian ("apa yang masuk hari ini")
                  tidak perlu memilih tanggal dua kali. */}
              {(
                [
                  ["Hari ini", () => setRentang(TANGGAL_WIB(), TANGGAL_WIB())],
                  ["7 hari", () => setRentang(TANGGAL_WIB(6), TANGGAL_WIB())],
                  ["30 hari", () => setRentang(TANGGAL_WIB(29), TANGGAL_WIB())],
                ] as const
              ).map(([label, aksi]) => (
                <Button key={label} size={UKURAN_KONTROL} variant="ghost" className="text-xs" onClick={aksi}>
                  {label}
                </Button>
              ))}
            </div>
          )}

          {/* Muncul hanya saat ada yang aktif — satu klik untuk kembali ke
              tampilan penuh, tanpa mengosongkan tiap kotak satu per satu.
              Inilah jalan keluar saat baris "menghilang" gara-gara penyaring
              yang masih menempel dari pekerjaan sebelumnya. */}
          {adaPenyaring && (
            <Button
              size={UKURAN_KONTROL}
              variant="ghost"
              className="ml-auto text-xs"
              onClick={() => {
                setCari("")
                setFilterNilai({})
              }}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              <span className="max-sm:hidden">Bersihkan saringan</span>
              <span className="sm:hidden">Bersihkan</span>
            </Button>
          )}
        </div>
      )}

      {galat && (
        <p className="shrink-0 border-b border-border/70 bg-destructive/10 px-4 py-2 text-xs text-destructive">{galat}</p>
      )}

      <div
        className={
          // min-h-0: WAJIB di flex child yang isinya butuh discroll —
          // tanpa ini, flex-1 tidak akan pernah mengecil di bawah tinggi
          // konten instrinsiknya (AG Grid), section jadi ikut membengkak.
          "min-h-0 scrollbar-tipis " +
          // Header kolom bergaya micro-label seperti panel lain di sistem ini.
          "[&_.ag-header-cell-text]:text-[10px] [&_.ag-header-cell-text]:font-semibold [&_.ag-header-cell-text]:tracking-widest [&_.ag-header-cell-text]:uppercase " +
          // Baris terpilih (master-detail): aksen kiri + latar primary tipis,
          // grammar yang sama dengan menu aktif di sidebar.
          "[&_.baris-terpilih]:bg-primary/10 [&_.baris-terpilih]:shadow-[inset_2px_0_0_0_var(--primary)] " +
          // Sel kartu (ponsel): AG Grid menyetel sel sebagai SATU baris teks —
          // line-height setinggi baris (96px) dan nowrap. Keduanya harus
          // dinetralkan, kalau tidak isi kartu saling terdorong keluar sel.
          "[&_.kartu-baris]:px-3 [&_.kartu-baris]:leading-normal [&_.kartu-baris]:whitespace-normal " +
          (onRowClicked ? "[&_.ag-row]:cursor-pointer " : "") +
          tinggiClassName
        }
      >
        <AgGridReact
          theme={temaGrid}
          columnDefs={defsGrid}
          defaultColDef={{ sortable: false, resizable: true, flex: 1, minWidth: 110 }}
          // Kartu butuh ruang tiga baris; di layar lega tinggi baris datang
          // dari tema (40px).
          rowHeight={mobil ? TINGGI_KARTU : undefined}
          headerHeight={mobil ? 0 : undefined}
          rowModelType="infinite"
          cacheBlockSize={PAGE_SIZE}
          maxBlocksInCache={10}
          datasource={datasource}
          onGridReady={(e) => {
            apiRef.current = e.api
          }}
          onRowClicked={onRowClicked ? (e) => e.data && onRowClicked(e.data as Record<string, unknown>) : undefined}
          onCellContextMenu={
            onRowContextMenu
              ? (e) => {
                  const ev = e.event as MouseEvent | null | undefined
                  if (e.data && ev) onRowContextMenu(e.data as Record<string, unknown>, { x: ev.clientX, y: ev.clientY })
                }
              : undefined
          }
          preventDefaultOnContextMenu={!!onRowContextMenu}
          getRowClass={(p) => ((p.data as { id?: string } | undefined)?.id === idTerpilihRef.current ? "baris-terpilih" : undefined)}
          overlayNoRowsTemplate='<span style="color: var(--muted-foreground); font-size: 13px">Tidak ada data untuk ditampilkan.</span>'
          suppressCellFocus
        />
      </div>
    </section>
  )
}