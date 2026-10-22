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
// PONSEL: tabel berkolom banyak ditampilkan sebagai daftar kartu berisi
// seluruh kolom aktif. Infinite Row Model AG Grid mensyaratkan tinggi baris
// tetap, jadi kartu mobile memakai pagination terpisah agar tinggi konten
// dapat mengikuti teks yang membungkus.
import * as React from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type IDatasource,
  type GridApi,
  type ValueGetterParams,
  type ValueFormatterParams,
} from "ag-grid-community"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowUpDownIcon,
  CalendarDaysIcon,
  Cancel01Icon,
  Columns3CogIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  RotateLeft01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ambilList, ApiError } from "../lib/api-client"
import { KELAS_ISIAN, KELAS_LEBAR_SARINGAN, UKURAN_KONTROL } from "./kontrol"

ModuleRegistry.registerModules([AllCommunityModule])

/// Tema dipetakan ke token CSS proyek (bukan warna hardcode) — dark mode
/// ikut benar otomatis karena nilai var berubah saat class `dark` menempel.
///
/// Yang dibenahi soal "tabelnya kurang enak dilihat": baris dinaikkan ke 42px
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
  headerFontWeight: 500,
  fontFamily: "var(--font-geist-sans)",
  fontSize: 13,
  headerFontSize: 12,
  borderRadius: 0,
  wrapperBorderRadius: 0,
  wrapperBorder: false,
  columnBorder: false,
  rowHeight: 42,
  cellHorizontalPadding: 14,
  oddRowBackgroundColor: "transparent",
  rowHoverColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
  selectedRowBackgroundColor:
    "color-mix(in srgb, var(--primary) 10%, transparent)",
  browserColorScheme: "inherit",
})

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

export type OperatorFilterLanjutan = "equals" | "contains" | "startsWith"

export interface FilterLanjutanField {
  id: string
  label: string
  param: string
  operatorParam?: string
  type?: "text" | "select"
  opsi?: { value: string; label: string }[]
  operator?: { value: OperatorFilterLanjutan; label: string }[]
  placeholder?: string
}

type BarisFilterLanjutan = {
  id: number
  fieldId: string
  operator: OperatorFilterLanjutan
  value: string
}

const OPERATOR_TEKS: {
  value: OperatorFilterLanjutan
  label: string
}[] = [
  { value: "equals", label: "sama dengan" },
  { value: "contains", label: "mengandung" },
  { value: "startsWith", label: "diawali" },
]

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
const UKURAN_HALAMAN_MOBILE = 25
const EKSPOR_BLOK = 1000
const EKSPOR_MAKS_BLOK = 100 // pagar keselamatan: maks 100rb baris per file
const NILAI_KOSONG = "__semua__"

type KeadaanMobile = {
  kunci: string
  baris: Record<string, unknown>[]
  halaman: number
  total: number | null
  adaLagi: boolean
  memuat: boolean
  galat: string | null
}

/** Nilai satu sel untuk ekspor: valueGetter/field, lalu valueFormatter —
 *  KECUALI kolom angka (cellClass tabular-nums): diekspor sebagai angka
 *  mentah supaya bisa di-SUM di Excel, bukan teks "Rp 173.540". */
function nilaiEkspor(c: ColDef, row: Record<string, unknown>): unknown {
  let v: unknown
  if (typeof c.valueGetter === "function")
    v = c.valueGetter({ data: row } as ValueGetterParams)
  else if (c.field) v = row[c.field]

  const kolomAngka =
    typeof c.cellClass === "string" && c.cellClass.includes("tabular-nums")
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
 *  cellRenderer-nya: renderer ditulis untuk sel setinggi 42px (titik status,
 *  lencana) dan hasilnya tidak selalu waras ditumpuk di dalam kartu. */
function teksSel(c: ColDef, row: Record<string, unknown>): string {
  let v: unknown
  if (typeof c.valueGetter === "function")
    v = c.valueGetter({ data: row } as ValueGetterParams)
  else if (c.field) v = row[c.field]

  if (typeof c.valueFormatter === "function") {
    const hasil = c.valueFormatter({
      value: v,
      data: row,
    } as ValueFormatterParams)
    return typeof hasil === "string" ? hasil : ""
  }
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") return v.toLocaleString("id-ID")
  if (typeof v === "object") return "—"
  return String(v)
}

export function DataGrid({
  judul,
  endpoint,
  columnDefs,
  searchParam,
  searchPlaceholder = "Cari…",
  initialSearch = "",
  filters = [],
  advancedFilters = [],
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
  advancedFilters?: FilterLanjutanField[]
  /** Penyaring rentang tanggal; endpoint harus menerima kedua paramnya. */
  filterTanggal?: FilterTanggal
  /** Param tetap yang selalu ikut terkirim. */
  extraParams?: Record<string, string>
  tinggiClassName?: string
  /** Klik baris (pola master-detail, mis. halaman verifikasi). */
  onRowClicked?: (data: Record<string, unknown>) => void
  /** Klik kanan baris — pemicu menu aksi kontekstual (halaman verifikasi).
   *  Menyediakan koordinat viewport kursor; menu default browser ditekan. */
  onRowContextMenu?: (
    data: Record<string, unknown>,
    posisi: { x: number; y: number }
  ) => void
  /** id baris yang sedang dipilih — disorot sinkron dengan panel detail. */
  idTerpilih?: string | null
  /** Naikkan nilainya untuk memaksa muat ulang data (setelah aksi verifikasi). */
  refreshKey?: number
}) {
  const apiRef = React.useRef<GridApi | null>(null)
  const mobil = useIsMobile()
  const [cari, setCari] = React.useState(initialSearch)
  const [filterNilai, setFilterNilai] = React.useState<Record<string, string>>(
    {}
  )
  const [filterLanjutanTerbuka, setFilterLanjutanTerbuka] =
    React.useState(false)
  const [barisFilterLanjutan, setBarisFilterLanjutan] = React.useState<
    BarisFilterLanjutan[]
  >([])
  const nomorFilterLanjutan = React.useRef(0)
  // Urutan pilihan pengguna di mode kartu ("kolom:arah"). Di layar lega ini
  // selalu "" — di sana yang berlaku sortModel dari kepala kolom.
  const [urutKartu, setUrutKartu] = React.useState("")
  const [total, setTotal] = React.useState<number | null>(null)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [galatEkspor, setGalatEkspor] = React.useState<string | null>(null)
  const [mengekspor, setMengekspor] = React.useState(false)
  const [keadaanMobile, setKeadaanMobile] = React.useState<KeadaanMobile>({
    kunci: "",
    baris: [],
    halaman: 1,
    total: null,
    adaLagi: false,
    memuat: true,
    galat: null,
  })
  const [mobilePercobaan, setMobilePercobaan] = React.useState(0)
  // Kolom yang disembunyikan pengguna lewat picker "Kolom" di toolbar —
  // kunci = colId/field/headerName. Ekspor Excel ikut menghormatinya
  // (yang diekspor = yang terlihat).
  const [kolomSembunyi, setKolomSembunyi] = React.useState<Set<string>>(
    new Set()
  )

  const kunciKolom = (c: ColDef) => c.colId ?? c.field ?? c.headerName ?? ""
  const defsTampil = React.useMemo(
    () =>
      columnDefs.map((c) => ({
        ...c,
        hide: kolomSembunyi.has(kunciKolom(c)),
      })),
    [columnDefs, kolomSembunyi]
  )
  const kolomTampil = React.useMemo(
    () =>
      columnDefs.filter(
        (c) => c.headerName && !kolomSembunyi.has(kunciKolom(c))
      ),
    [columnDefs, kolomSembunyi]
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
  const paramsRef = React.useRef({
    cari: initialSearch,
    filterNilai: {} as Record<string, string>,
  })
  // extraParams ikut lewat ref (bukan closure datasource) supaya parent bisa
  // menggantinya (mis. dropdown periode) tanpa membangun ulang grid — cukup
  // purge, blok diminta ulang dengan nilai terbaru.
  const extraRef = React.useRef(extraParams)
  const extraSerial = JSON.stringify(extraParams ?? {})
  const filterLanjutanParams = React.useMemo(() => {
    const params: Record<string, string> = {}
    for (const row of barisFilterLanjutan) {
      const field = advancedFilters.find((item) => item.id === row.fieldId)
      const value = row.value.trim()
      if (!field || !value) continue
      params[field.param] = value
      if (field.operatorParam) params[field.operatorParam] = row.operator
    }
    return params
  }, [advancedFilters, barisFilterLanjutan])
  const filterNilaiAktif = React.useMemo(
    () => ({ ...filterNilai, ...filterLanjutanParams }),
    [filterNilai, filterLanjutanParams]
  )
  const jumlahFilterLanjutan = barisFilterLanjutan.filter((row) => {
    const field = advancedFilters.find((item) => item.id === row.fieldId)
    return Boolean(field && row.value.trim())
  }).length
  const filterLanjutanPenuh =
    barisFilterLanjutan.length >= advancedFilters.length
  const kunciKueriMobile = JSON.stringify([
    endpoint,
    searchParam,
    cari,
    filterNilaiAktif,
    extraSerial,
    refreshKey,
    urutKartu,
    mobilePercobaan,
  ])
  const keadaanMobileAktif =
    keadaanMobile.kunci === kunciKueriMobile ? keadaanMobile : null
  const barisMobile = keadaanMobileAktif?.baris ?? []
  const halamanMobile = keadaanMobileAktif?.halaman ?? 1
  const totalMobile = keadaanMobileAktif?.total ?? null
  const mobileMemuat = !keadaanMobileAktif || keadaanMobile.memuat
  const mobileAdaLagi = keadaanMobileAktif?.adaLagi ?? false
  const galatMobile = keadaanMobileAktif?.galat ?? null
  const galatTampil = mobil
    ? (galatMobile ?? galatEkspor)
    : (galat ?? galatEkspor)
  const totalTampil = mobil ? totalMobile : total
  const idTerpilihRef = React.useRef<string | null | undefined>(idTerpilih)
  // Sort terakhir yang dipakai grid — diikutkan saat ekspor supaya urutan
  // file Excel sama dengan yang terlihat di layar.
  const sortRef = React.useRef<{ sortBy?: string; sortDir?: string }>({})
  // Mode kartu tidak punya kepala kolom, jadi sortModel-nya selalu kosong;
  // urutan datang dari dropdown dan dibaca datasource lewat ref ini.
  const urutKartuRef = React.useRef("")
  const mobilePermintaanRef = React.useRef(0)

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
          const { rows, total } = await ambilList<Record<string, unknown>>(
            endpoint,
            {
              page: Math.floor(params.startRow / PAGE_SIZE) + 1,
              pageSize: PAGE_SIZE,
              ...(searchParam && cari.trim()
                ? { [searchParam]: cari.trim() }
                : {}),
              ...filterNilai,
              ...sortRef.current,
              ...extraRef.current,
            }
          )
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
    paramsRef.current = { cari, filterNilai: filterNilaiAktif }
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
  }, [
    cari,
    filterNilaiAktif,
    extraSerial,
    refreshKey,
    urutKartu,
    mobil,
  ])

  React.useEffect(() => {
    if (!mobil) return

    const permintaan = ++mobilePermintaanRef.current
    const kunci = kunciKueriMobile
    const [sortBy, sortDir] = urutKartu.split(":")
    sortRef.current = sortBy ? { sortBy, sortDir: sortDir ?? "asc" } : {}

    void ambilList<Record<string, unknown>>(endpoint, {
      page: 1,
      pageSize: UKURAN_HALAMAN_MOBILE,
      ...(searchParam && cari.trim() ? { [searchParam]: cari.trim() } : {}),
      ...filterNilaiAktif,
      ...sortRef.current,
      ...extraRef.current,
    })
      .then(({ rows, total: jumlah }) => {
        if (mobilePermintaanRef.current !== permintaan) return
        setGalat(null)
        setKeadaanMobile({
          kunci,
          baris: rows,
          halaman: 1,
          total: jumlah,
          adaLagi: rows.length < jumlah,
          memuat: false,
          galat: null,
        })
      })
      .catch((err: unknown) => {
        if (mobilePermintaanRef.current !== permintaan) return
        setGalat(null)
        setKeadaanMobile({
          kunci,
          baris: [],
          halaman: 1,
          total: null,
          adaLagi: false,
          memuat: false,
          galat: err instanceof ApiError ? err.message : "Gagal memuat data.",
        })
      })

    return () => {
      mobilePermintaanRef.current += 1
    }
  }, [
    mobil,
    kunciKueriMobile,
    cari,
    filterNilaiAktif,
    endpoint,
    searchParam,
    urutKartu,
  ])

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
    cari.trim() !== "" || Object.values(filterNilaiAktif).some((v) => v !== "")

  function tambahFilterLanjutan() {
    const dipakai = new Set(barisFilterLanjutan.map((row) => row.fieldId))
    const field = advancedFilters.find((item) => !dipakai.has(item.id))
    if (!field) return
    nomorFilterLanjutan.current += 1
    setBarisFilterLanjutan((baris) => [
      ...baris,
      {
        id: nomorFilterLanjutan.current,
        fieldId: field.id,
        operator: "equals",
        value: "",
      },
    ])
    setFilterLanjutanTerbuka(true)
  }

  function toggleFilterLanjutan() {
    if (filterLanjutanTerbuka) {
      setFilterLanjutanTerbuka(false)
      return
    }
    if (barisFilterLanjutan.length === 0) tambahFilterLanjutan()
    setFilterLanjutanTerbuka(true)
  }

  function bersihkanSemuaFilter() {
    setCari("")
    setFilterNilai({})
    setBarisFilterLanjutan([])
    setFilterLanjutanTerbuka(false)
  }

  function ubahFilterLanjutan(
    id: number,
    perubahan: Partial<Omit<BarisFilterLanjutan, "id">>
  ) {
    setBarisFilterLanjutan((baris) =>
      baris.map((row) => (row.id === id ? { ...row, ...perubahan } : row))
    )
  }

  async function muatLagiMobile() {
    if (mobileMemuat || !mobileAdaLagi) return
    const permintaan = mobilePermintaanRef.current
    const halaman = halamanMobile + 1
    const [sortBy, sortDir] = urutKartu.split(":")
    setKeadaanMobile((sebelumnya) => ({
      ...sebelumnya,
      memuat: true,
      galat: null,
    }))
    try {
      const { rows, total: jumlah } = await ambilList<Record<string, unknown>>(
        endpoint,
        {
          page: halaman,
          pageSize: UKURAN_HALAMAN_MOBILE,
          ...(searchParam && cari.trim() ? { [searchParam]: cari.trim() } : {}),
          ...filterNilaiAktif,
          ...(sortBy ? { sortBy, sortDir: sortDir ?? "asc" } : {}),
          ...extraRef.current,
        }
      )
      if (mobilePermintaanRef.current !== permintaan) return
      setKeadaanMobile((sebelumnya) => ({
        ...sebelumnya,
        baris: [...sebelumnya.baris, ...rows],
        halaman,
        total: jumlah,
        adaLagi: rows.length > 0 && halaman * UKURAN_HALAMAN_MOBILE < jumlah,
        memuat: false,
        galat: null,
      }))
    } catch (err) {
      if (mobilePermintaanRef.current !== permintaan) return
      setKeadaanMobile((sebelumnya) => ({
        ...sebelumnya,
        memuat: false,
        galat: err instanceof ApiError ? err.message : "Gagal memuat data.",
      }))
    }
  }

  async function eksporExcel() {
    if (mengekspor) return
    setMengekspor(true)
    setGalat(null)
    setGalatEkspor(null)
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
        const { rows, total } = await ambilList<Record<string, unknown>>(
          endpoint,
          {
            page,
            pageSize: EKSPOR_BLOK,
            ...paramsUmum,
          }
        )
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
      XLSX.writeFile(
        wb,
        `${slug}-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (err) {
      setGalatEkspor(
        err instanceof ApiError ? err.message : "Gagal mengekspor data."
      )
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
    <section
      aria-label={judul}
      className="flex h-full flex-col border border-border/70 bg-card"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2 sm:gap-2.5 sm:px-4">
        <div className="flex w-full min-w-0 flex-1 items-center gap-2 sm:w-auto">
          {searchParam && (
            <div className="relative min-w-0 max-w-[22rem] flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                name="cari-grid"
                autoComplete="off"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${KELAS_ISIAN} h-8 w-full pl-8`}
                aria-label="Cari"
              />
            </div>
          )}

          {advancedFilters.length > 0 && (
            <Button
              type="button"
              variant={filterLanjutanTerbuka ? "outline" : "ghost"}
              size="sm"
              aria-expanded={filterLanjutanTerbuka}
              aria-controls="data-grid-filter-panel"
              onClick={toggleFilterLanjutan}
            >
              <HugeiconsIcon
                icon={FilterIcon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              <span>Filters</span>
              {jumlahFilterLanjutan > 0 && (
                <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold tabular-nums text-primary">
                  {jumlahFilterLanjutan}
                </span>
              )}
            </Button>
          )}
        </div>

        {filters.map((f) => (
          <Select
            key={f.param}
            value={filterNilai[f.param] || NILAI_KOSONG}
            onValueChange={(value) =>
              gantiFilter(f.param, value === NILAI_KOSONG ? "" : value)
            }
          >
            <SelectTrigger
              aria-label={f.label}
              size="default"
              className="w-40 shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={NILAI_KOSONG}>{f.label}: semua</SelectItem>
              {f.opsi.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Di mode kartu, urutan menggantikan kepala kolom yang tidak ada. */}
        {mobil && kolomUrut.length > 0 && (
          <Select
            value={urutKartu || NILAI_KOSONG}
            onValueChange={(value) =>
              setUrutKartu(value === NILAI_KOSONG ? "" : value)
            }
          >
            <SelectTrigger
              aria-label="Urutkan"
              size="default"
              className="w-40 shrink-0"
            >
              <HugeiconsIcon
                icon={ArrowUpDownIcon}
                strokeWidth={2}
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={NILAI_KOSONG}>Urutan bawaan</SelectItem>
              {kolomUrut.map((c) => {
                const kunci = c.colId ?? c.field ?? ""
                return (
                  <React.Fragment key={kunci}>
                    <SelectItem value={`${kunci}:asc`}>
                      {c.headerName} ↑
                    </SelectItem>
                    <SelectItem value={`${kunci}:desc`}>
                      {c.headerName} ↓
                    </SelectItem>
                  </React.Fragment>
                )
              })}
            </SelectContent>
          </Select>
        )}

        {adaPenyaring && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-xs"
            onClick={() => {
              bersihkanSemuaFilter()
            }}
          >
            <HugeiconsIcon
              icon={RotateLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
            <span className="max-sm:hidden">Bersihkan</span>
          </Button>
        )}

        {totalTampil !== null && (
          <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
            {totalTampil.toLocaleString("id-ID")}
            <span className="ml-1 max-sm:hidden">baris</span>
          </span>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  kolomSembunyi.size > 0
                    ? `Pilih kolom; ${kolomSembunyi.size} kolom disembunyikan`
                    : "Pilih kolom yang ditampilkan"
                }
                title="Pilih kolom yang ditampilkan"
              >
                <HugeiconsIcon
                  icon={Columns3CogIcon}
                  strokeWidth={2}
                  className="size-4"
                  aria-hidden
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-80 w-56 overflow-y-auto"
            >
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
            variant="ghost"
            size="icon"
            onClick={eksporExcel}
            disabled={mengekspor || totalTampil === 0}
            aria-label={mengekspor ? "Menyiapkan ekspor" : "Ekspor ke Excel"}
            title="Unduh seluruh baris (sesuai filter & kolom aktif) sebagai file Excel"
          >
            {mengekspor ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon
                icon={FileSpreadsheetIcon}
                strokeWidth={2}
                className="size-4"
                aria-hidden
              />
            )}
          </Button>
        </div>
      </div>

      {advancedFilters.length > 0 && filterLanjutanTerbuka && (
        <div
          id="data-grid-filter-panel"
          className="flex shrink-0 flex-col gap-3 border-b border-border/70 bg-muted/15 px-3 py-3 sm:flex-row sm:items-start sm:gap-0 sm:px-4"
        >
          <div className="min-w-0 flex-1 space-y-2 overflow-x-auto">
            {barisFilterLanjutan.map((row, index) => {
              const field = advancedFilters.find(
                (item) => item.id === row.fieldId
              )
              if (!field) return null
              const fieldsTersedia = advancedFilters.filter(
                (item) =>
                  item.id === row.fieldId ||
                  !barisFilterLanjutan.some(
                    (lain) => lain.fieldId === item.id
                  )
              )
              const operators =
                field.operator ??
                (field.type === "select"
                  ? [{ value: "equals" as const, label: "sama dengan" }]
                  : OPERATOR_TEKS)

              return (
                <div
                  key={row.id}
                  className="grid min-w-[38rem] grid-cols-[3.5rem_minmax(8rem,0.9fr)_minmax(8rem,0.8fr)_minmax(10rem,1.6fr)_1.75rem] items-center gap-2 sm:min-w-0"
                >
                  <span className="inline-flex h-7 w-full items-center justify-center whitespace-nowrap rounded-md bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                    {index === 0 ? "where" : "and"}
                  </span>
                  <Select
                    value={row.fieldId}
                    onValueChange={(fieldId) => {
                      const nextField = advancedFilters.find(
                        (item) => item.id === fieldId
                      )
                      if (!nextField) return
                      ubahFilterLanjutan(row.id, {
                        fieldId,
                        operator: "equals",
                        value: "",
                      })
                    }}
                  >
                    <SelectTrigger
                      aria-label="Kolom filter"
                      size="sm"
                      className="w-full bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      {fieldsTersedia.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={row.operator}
                    onValueChange={(operator) =>
                      ubahFilterLanjutan(row.id, {
                        operator: operator as OperatorFilterLanjutan,
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label="Operator filter"
                      size="sm"
                      className="w-full bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      {operators.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.type === "select" ? (
                    <Select
                      value={row.value || NILAI_KOSONG}
                      onValueChange={(value) =>
                        ubahFilterLanjutan(row.id, {
                          value: value === NILAI_KOSONG ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Nilai ${field.label}`}
                        size="sm"
                        className="w-full bg-background"
                      >
                        <SelectValue placeholder="Pilih nilai" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start">
                        <SelectItem value={NILAI_KOSONG}>Pilih nilai</SelectItem>
                        {field.opsi?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={row.value}
                      onChange={(event) =>
                        ubahFilterLanjutan(row.id, {
                          value: event.currentTarget.value,
                        })
                      }
                      placeholder={
                        field.placeholder ??
                        `Masukkan ${field.label.toLowerCase()}`
                      }
                      aria-label={`Nilai ${field.label}`}
                      className="h-7 min-w-0 bg-background"
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus filter ${field.label}`}
                    onClick={() =>
                      setBarisFilterLanjutan((baris) =>
                        baris.filter((item) => item.id !== row.id)
                      )
                    }
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                      aria-hidden
                    />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-stretch sm:items-start sm:border-l sm:pl-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filterLanjutanPenuh}
              onClick={tambahFilterLanjutan}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
              Add filter
            </Button>
            {barisFilterLanjutan.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBarisFilterLanjutan([])
                  setFilterLanjutanTerbuka(false)
                }}
              >
                Bersihkan filter
              </Button>
            )}
          </div>
        </div>
      )}

      {filterTanggal && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2 sm:px-4">
          <div className="flex basis-full flex-wrap items-center gap-2 sm:basis-auto">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <HugeiconsIcon
                icon={CalendarDaysIcon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />{" "}
              {filterTanggal.label}
            </span>
            <Input
              type="date"
              value={filterNilai[filterTanggal.paramDari] ?? ""}
              onChange={(e) =>
                gantiFilter(filterTanggal.paramDari, e.currentTarget.value)
              }
              className={`${KELAS_ISIAN} ${KELAS_LEBAR_SARINGAN}`}
              aria-label={`${filterTanggal.label} dari`}
            />
            <span className="text-[11px] text-muted-foreground">s/d</span>
            <Input
              type="date"
              value={filterNilai[filterTanggal.paramSampai] ?? ""}
              onChange={(e) =>
                gantiFilter(filterTanggal.paramSampai, e.currentTarget.value)
              }
              className={`${KELAS_ISIAN} ${KELAS_LEBAR_SARINGAN}`}
              aria-label={`${filterTanggal.label} sampai`}
            />
            {/* Pintasan untuk rentang umum agar tanggal tidak perlu dipilih dua kali. */}
            {(
              [
                ["Hari ini", () => setRentang(TANGGAL_WIB(), TANGGAL_WIB())],
                ["7 hari", () => setRentang(TANGGAL_WIB(6), TANGGAL_WIB())],
                ["30 hari", () => setRentang(TANGGAL_WIB(29), TANGGAL_WIB())],
              ] as const
            ).map(([label, aksi]) => (
              <Button
                key={label}
                size={UKURAN_KONTROL}
                variant="ghost"
                className="text-xs"
                onClick={aksi}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {galatTampil && (
        <p className="shrink-0 border-b border-border/70 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {galatTampil}
        </p>
      )}

      {mobil ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {barisMobile.length > 0 ? (
            <div className="divide-y divide-border/70">
              {barisMobile.map((row, index) => {
                const [identitas, nama, alamat, ...rinci] = kolomTampil
                const id = String(row.id ?? index)
                const terpilih = (row as { id?: string }).id === idTerpilih
                const clsKartu =
                  "block w-full px-4 py-3.5 text-left transition-colors sm:px-5 " +
                  (terpilih
                    ? "bg-primary/5 shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "hover:bg-muted/30") +
                  (onRowClicked ? " cursor-pointer" : "")

                return (
                  <article
                    key={id}
                    className={clsKartu}
                    role={onRowClicked ? "button" : undefined}
                    tabIndex={onRowClicked ? 0 : undefined}
                    aria-pressed={onRowClicked ? terpilih : undefined}
                    onClick={onRowClicked ? () => onRowClicked(row) : undefined}
                    onKeyDown={
                      onRowClicked
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              onRowClicked(row)
                            }
                          }
                        : undefined
                    }
                    onContextMenu={
                      onRowContextMenu
                        ? (event) => {
                            event.preventDefault()
                            onRowContextMenu(row, {
                              x: event.clientX,
                              y: event.clientY,
                            })
                          }
                        : undefined
                    }
                  >
                    <dl className="grid min-w-0 gap-3">
                      {(identitas || nama) && (
                        <div className="grid min-w-0 grid-cols-2 gap-3">
                          {identitas && (
                            <div className="min-w-0">
                              <dt className="text-xs text-muted-foreground">
                                {identitas.headerName}
                              </dt>
                              <dd className="mt-0.5 break-words font-mono text-[13px] font-medium leading-5 tabular-nums text-foreground">
                                {teksSel(identitas, row)}
                              </dd>
                            </div>
                          )}
                          {nama && (
                            <div className="min-w-0">
                              <dt className="text-xs text-muted-foreground">
                                {nama.headerName}
                              </dt>
                              <dd className="mt-0.5 break-words text-sm/5 font-medium text-foreground">
                                {teksSel(nama, row)}
                              </dd>
                            </div>
                          )}
                        </div>
                      )}

                      {alamat && (
                        <div className="min-w-0 border-t border-border/60 pt-2.5">
                          <dt className="text-xs text-muted-foreground">
                            {alamat.headerName}
                          </dt>
                          <dd className="mt-0.5 break-words text-sm/5 text-foreground">
                            {teksSel(alamat, row)}
                          </dd>
                        </div>
                      )}

                      {rinci.length > 0 && (
                        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-2.5 border-t border-border/60 pt-2.5 min-[420px]:grid-cols-2">
                          {rinci.map((column) => (
                            <div
                              key={kunciKolom(column)}
                              className="grid min-w-0 grid-cols-[minmax(5.5rem,0.8fr)_minmax(0,1.2fr)] items-start gap-2 min-[420px]:block"
                            >
                              <dt className="break-words text-xs leading-5 text-muted-foreground min-[420px]:mb-0.5">
                                {column.headerName}
                              </dt>
                              <dd className="min-w-0 break-words text-[13px] leading-5 text-foreground min-[420px]:font-medium">
                                {teksSel(column, row)}
                              </dd>
                            </div>
                          ))}
                        </div>
                      )}
                    </dl>
                  </article>
                )
              })}
            </div>
          ) : mobileMemuat ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>Memuat data…</span>
            </div>
          ) : galatMobile ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-muted-foreground">
                Data belum dapat dimuat.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobilePercobaan((percobaan) => percobaan + 1)}
              >
                Coba lagi
              </Button>
            </div>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Tidak ada data untuk ditampilkan.
            </p>
          )}

          {mobileAdaLagi && (
            <div className="flex flex-col items-center gap-2 border-t border-border/70 px-4 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={mobileMemuat}
                onClick={muatLagiMobile}
              >
                {mobileMemuat ? <Spinner className="size-4" /> : null}
                {mobileMemuat ? "Memuat…" : "Muat data berikutnya"}
              </Button>
              {totalMobile !== null && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  Menampilkan {barisMobile.length.toLocaleString("id-ID")} dari{" "}
                  {totalMobile.toLocaleString("id-ID")} data
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            // min-h-0: AG Grid perlu ruang terukur agar bisa menggulir di panel.
            "min-h-0 scrollbar-tipis " +
            "[&_.ag-header-cell-text]:text-xs [&_.ag-header-cell-text]:font-medium [&_.ag-header-cell-text]:tracking-normal [&_.ag-header-cell-text]:normal-case " +
            "[&_.ag-cell]:[font-variant-numeric:tabular-nums] " +
            "[&_.baris-terpilih]:bg-primary/10 [&_.baris-terpilih]:shadow-[inset_2px_0_0_0_var(--primary)] " +
            (onRowClicked ? "[&_.ag-row]:cursor-pointer " : "") +
            tinggiClassName
          }
        >
          <AgGridReact
            theme={temaGrid}
            columnDefs={defsTampil}
            defaultColDef={{
              sortable: false,
              resizable: true,
              flex: 1,
              minWidth: 110,
            }}
            rowModelType="infinite"
            cacheBlockSize={PAGE_SIZE}
            maxBlocksInCache={10}
            datasource={datasource}
            onGridReady={(e) => {
              apiRef.current = e.api
            }}
            onGridPreDestroyed={() => {
              apiRef.current = null
            }}
            onRowClicked={
              onRowClicked
                ? (e) =>
                    e.data && onRowClicked(e.data as Record<string, unknown>)
                : undefined
            }
            onCellContextMenu={
              onRowContextMenu
                ? (e) => {
                    const ev = e.event as MouseEvent | null | undefined
                    if (e.data && ev) {
                      onRowContextMenu(e.data as Record<string, unknown>, {
                        x: ev.clientX,
                        y: ev.clientY,
                      })
                    }
                  }
                : undefined
            }
            preventDefaultOnContextMenu={!!onRowContextMenu}
            getRowClass={(p) =>
              (p.data as { id?: string } | undefined)?.id ===
              idTerpilihRef.current
                ? "baris-terpilih"
                : undefined
            }
            overlayNoRowsTemplate='<span style="color: var(--muted-foreground); font-size: 13px">Tidak ada data untuk ditampilkan.</span>'
            suppressCellFocus
          />
        </div>
      )}
    </section>
  )
}
