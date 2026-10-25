"use client"

// features/dashboard/components/data-grid/data-grid.tsx — PERAKIT DataGrid:
// SATU-SATUNYA pembungkus AG Grid Community untuk seluruh tabel dashboard.
// Semua halaman memakai ini supaya tema, toolbar, dan perilaku pagination
// konsisten — jangan merender <AgGridReact> langsung di tempat lain.
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
//
// PETA FOLDER
//   index.ts                   pintu masuk (DataGrid + tipe publik)
//   data-grid.tsx              perakit: state, datasource, render  <- file ini
//   tipe.ts · konstanta.ts     tipe & konstanta
//   tema.ts                    tema AG Grid + kelas kontrol (token Geist)
//   tanggal.ts · param.ts      tanggal WIB, pembentuk param query
//   nilai-sel.ts · ekspor.ts   nilai sel dari colDef, ekspor Excel
//   use-filter-lanjutan.ts     state panel "Filters"
//   use-daftar-kartu.ts        daftar kartu ponsel + muat berikutnya
//   toolbar/                   satu file per kontrol toolbar
//   panel-filter-lanjutan.tsx  panel filter berbaris (where/and)
//   daftar-kartu.tsx           kartu ponsel

import * as React from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  type GridApi,
  type IDatasource,
} from "ag-grid-community"
import { HugeiconsIcon } from "@hugeicons/react"
import { RotateLeft01Icon } from "@hugeicons/core-free-icons"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToggleGroup } from "@/components/ui/toggle-group"
import { ambilList, ApiError } from "../../lib/api-client"
import { PAGE_SIZE, TANPA_FILTER, TANPA_FILTER_LANJUTAN } from "./konstanta"
import { DaftarKartu } from "./daftar-kartu"
import { unduhExcel, ambilSemuaBaris } from "./ekspor"
import { kunciKolom } from "./nilai-sel"
import { paramCari, paramUrut } from "./param"
import { PanelFilterLanjutan } from "./panel-filter-lanjutan"
import { KELAS_AREA_GRID, temaGrid } from "./tema"
import type { BarisData, DataGridProps, ParamUrut } from "./tipe"
import { useDaftarKartu } from "./use-daftar-kartu"
import { useFilterLanjutan } from "./use-filter-lanjutan"
import { FilterPilihan } from "./toolbar/filter-pilihan"
import { KotakCari } from "./toolbar/kotak-cari"
import { PemilihKolom } from "./toolbar/pemilih-kolom"
import { PemilihUrut } from "./toolbar/pemilih-urut"
import { PenyaringTanggal } from "./toolbar/penyaring-tanggal"
import { TombolEkspor } from "./toolbar/tombol-ekspor"
import { TombolFilterLanjutan } from "./toolbar/tombol-filter-lanjutan"

ModuleRegistry.registerModules([AllCommunityModule])

export function DataGrid({
  judul,
  endpoint,
  columnDefs,
  searchParam,
  searchPlaceholder = "Cari…",
  initialSearch = "",
  filters = TANPA_FILTER,
  advancedFilters = TANPA_FILTER_LANJUTAN,
  filterTanggal,
  extraParams,
  tinggiClassName = "flex-1 min-h-96",
  onRowClicked,
  onRowContextMenu,
  idTerpilih,
  refreshKey,
  toolbarActions,
}: DataGridProps) {
  const mobil = useIsMobile()
  const idPanelFilter = React.useId()
  const apiRef = React.useRef<GridApi | null>(null)

  // --- state penyaring ------------------------------------------------------
  const [cari, setCari] = React.useState(initialSearch)
  const [filterNilai, setFilterNilai] = React.useState<Record<string, string>>(
    {}
  )
  const filterLanjutan = useFilterLanjutan(advancedFilters)
  // Urutan pilihan pengguna di mode kartu ("kolom:arah"). Di layar lega ini
  // selalu "" — di sana yang berlaku sortModel dari kepala kolom.
  const [urutKartu, setUrutKartu] = React.useState("")
  // Kolom yang disembunyikan pengguna lewat picker "Kolom" di toolbar —
  // kunci = colId/field/headerName. Ekspor Excel ikut menghormatinya
  // (yang diekspor = yang terlihat).
  const [kolomSembunyi, setKolomSembunyi] = React.useState<Set<string>>(
    new Set()
  )

  // --- state hasil ----------------------------------------------------------
  const [total, setTotal] = React.useState<number | null>(null)
  const [galat, setGalat] = React.useState<string | null>(null)
  const [galatEkspor, setGalatEkspor] = React.useState<string | null>(null)
  const [mengekspor, setMengekspor] = React.useState(false)

  // --- turunan --------------------------------------------------------------
  const defsTampil = React.useMemo(
    () =>
      columnDefs.map((c) => ({ ...c, hide: kolomSembunyi.has(kunciKolom(c)) })),
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
  const filterNilaiAktif = React.useMemo(
    () => ({ ...filterNilai, ...filterLanjutan.params }),
    [filterNilai, filterLanjutan.params]
  )
  const adaPenyaring =
    cari.trim() !== "" || Object.values(filterNilaiAktif).some((v) => v !== "")
  const extraSerial = JSON.stringify(extraParams ?? {})

  // --- daftar kartu (ponsel) ------------------------------------------------
  const daftarKartu = useDaftarKartu({
    aktif: mobil,
    endpoint,
    searchParam,
    cari,
    filterNilai: filterNilaiAktif,
    extraSerial,
    urutKartu,
    refreshKey,
  })
  const galatTampil = mobil
    ? (daftarKartu.galat ?? galatEkspor)
    : (galat ?? galatEkspor)
  const totalTampil = mobil ? daftarKartu.total : total

  // --- datasource AG Grid (layar lega) --------------------------------------
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
  const idTerpilihRef = React.useRef<string | null | undefined>(idTerpilih)
  // Sort terakhir yang dipakai grid — diikutkan saat ekspor supaya urutan
  // file Excel sama dengan yang terlihat di layar.
  const sortRef = React.useRef<ParamUrut>({})
  // Mode kartu tidak punya kepala kolom, jadi sortModel-nya selalu kosong;
  // urutan datang dari dropdown dan dibaca datasource lewat ref ini.
  const urutKartuRef = React.useRef("")

  const datasource = React.useMemo<IDatasource>(
    () => ({
      getRows: async (params) => {
        const { cari, filterNilai } = paramsRef.current
        const sm = params.sortModel?.[0]
        sortRef.current = sm
          ? { sortBy: sm.colId, sortDir: sm.sort }
          : paramUrut(urutKartuRef.current)
        try {
          setGalat(null)
          const { rows, total } = await ambilList<BarisData>(endpoint, {
            page: Math.floor(params.startRow / PAGE_SIZE) + 1,
            pageSize: PAGE_SIZE,
            ...paramCari(searchParam, cari),
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
  }, [cari, filterNilaiAktif, extraSerial, refreshKey, urutKartu, mobil])

  // Sorot baris terpilih: nilai dibaca getRowClass lewat ref, redraw saat
  // pilihan berubah (infinite model tidak merender ulang sendiri).
  React.useEffect(() => {
    idTerpilihRef.current = idTerpilih
    apiRef.current?.redrawRows()
  }, [idTerpilih])

  // --- aksi -----------------------------------------------------------------
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

  function bersihkanSemuaFilter() {
    setCari("")
    setFilterNilai({})
    filterLanjutan.bersihkan()
  }

  function ubahKolom(kunci: string, tampil: boolean) {
    setKolomSembunyi((lama) => {
      const baru = new Set(lama)
      if (tampil) baru.delete(kunci)
      else baru.add(kunci)
      return baru
    })
  }

  async function eksporExcel() {
    if (mengekspor) return
    setMengekspor(true)
    setGalat(null)
    setGalatEkspor(null)
    try {
      const baris = await ambilSemuaBaris(endpoint, {
        ...paramCari(searchParam, cari),
        ...filterNilaiAktif,
        ...(mobil ? paramUrut(urutKartu) : sortRef.current),
        ...extraParams,
      })
      await unduhExcel(judul, kolomTampil, baris)
    } catch (err) {
      setGalatEkspor(
        err instanceof ApiError ? err.message : "Gagal mengekspor data."
      )
    } finally {
      setMengekspor(false)
    }
  }

  const adaKontrolKiri = Boolean(searchParam) || advancedFilters.length > 0
  const adaPenyaringKanan = filters.length > 0 || Boolean(filterTanggal)

  return (
    // flex h-full flex-col: section ini HARUS mewarisi tinggi pasti dari
    // parent-nya. Tanpa itu tinggiClassName="h-full" di grid wrapper jadi
    // referensi melingkar (section menunggu tinggi grid, grid menunggu tinggi
    // section) dan resolve ke 0 — AG Grid dapat tinggi 0px, baris tidak pernah
    // dirender. Toolbar `shrink-0`, grid wrapper `flex-1 min-h-0` mengisi sisanya.
    <section
      aria-label={judul}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-panel"
    >
      {/* Toolbar: SATU baris di layar lebar (lg+), membungkus di bawahnya. */}
      <div
        role="group"
        aria-label="Penyaring dan aksi tabel"
        className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle bg-card px-3 py-2.5 sm:px-4 lg:flex-nowrap"
      >
        {searchParam && (
          <KotakCari
            nilai={cari}
            onUbah={setCari}
            placeholder={searchPlaceholder}
          />
        )}

        {advancedFilters.length > 0 && (
          <TombolFilterLanjutan
            idPanel={idPanelFilter}
            terbuka={filterLanjutan.terbuka}
            jumlah={filterLanjutan.jumlahAktif}
            onKlik={filterLanjutan.toggle}
          />
        )}

        {adaKontrolKiri && adaPenyaringKanan && (
          <span
            aria-hidden
            className="mx-0.5 hidden h-5 w-px shrink-0 bg-border lg:block"
          />
        )}

        {filters.map((f) => (
          <FilterPilihan
            key={f.param}
            filter={f}
            nilai={filterNilai[f.param] ?? ""}
            onUbah={(nilai) => gantiFilter(f.param, nilai)}
          />
        ))}

        {filterTanggal && (
          <PenyaringTanggal
            label={filterTanggal.label}
            dari={filterNilai[filterTanggal.paramDari] ?? ""}
            sampai={filterNilai[filterTanggal.paramSampai] ?? ""}
            onTerapkan={setRentang}
          />
        )}

        {mobil && kolomUrut.length > 0 && (
          <PemilihUrut
            kolom={kolomUrut}
            nilai={urutKartu}
            onUbah={setUrutKartu}
          />
        )}

        {adaPenyaring && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={bersihkanSemuaFilter}
            title="Bersihkan semua penyaring"
          >
            <HugeiconsIcon
              icon={RotateLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
            <span className="max-xl:sr-only">Bersihkan</span>
          </Button>
        )}

        {totalTampil !== null && (
          // <output> = hasil yang berubah mengikuti masukan; role status
          // implisit, jadi pembaca layar ikut mengumumkan jumlah baru.
          <output className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">
              {totalTampil.toLocaleString("id-ID")}
            </span>
            <span className="ml-1 max-sm:hidden">baris</span>
          </output>
        )}

        <ToggleGroup
          type="multiple"
          value={[]}
          onValueChange={() => {}}
          variant="outline"
          size="sm"
          spacing={0}
          itemClassName="size-8! p-0!"
          className={cn(
            "shrink-0",
            totalTampil === null && "ml-auto"
          )}
        >
          <PemilihKolom
            kolom={columnDefs}
            sembunyi={kolomSembunyi}
            onUbah={ubahKolom}
          />
          <TombolEkspor
            mengekspor={mengekspor}
            nonaktif={totalTampil === 0}
            onKlik={eksporExcel}
          />
          {toolbarActions}
        </ToggleGroup>
      </div>

      {advancedFilters.length > 0 && filterLanjutan.terbuka && (
        <PanelFilterLanjutan
          id={idPanelFilter}
          fields={advancedFilters}
          baris={filterLanjutan.baris}
          penuh={filterLanjutan.penuh}
          onTambah={filterLanjutan.tambah}
          onUbah={filterLanjutan.ubah}
          onHapus={filterLanjutan.hapus}
          onBersihkan={filterLanjutan.bersihkan}
        />
      )}

      {galatTampil && (
        <p
          role="alert"
          className="shrink-0 border-b border-border-subtle bg-destructive/10 px-4 py-2 text-xs text-destructive"
        >
          {galatTampil}
        </p>
      )}

      {mobil ? (
        <DaftarKartu
          baris={daftarKartu.baris}
          kolom={kolomTampil}
          idTerpilih={idTerpilih}
          memuat={daftarKartu.memuat}
          galat={daftarKartu.galat}
          adaLagi={daftarKartu.adaLagi}
          total={daftarKartu.total}
          onRowClicked={onRowClicked}
          onRowContextMenu={onRowContextMenu}
          onMuatLagi={daftarKartu.muatLagi}
          onCobaLagi={daftarKartu.ulangi}
        />
      ) : (
        <div
          className={cn(
            KELAS_AREA_GRID,
            onRowClicked && "[&_.ag-row]:cursor-pointer",
            tinggiClassName
          )}
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
                ? (e) => e.data && onRowClicked(e.data as BarisData)
                : undefined
            }
            onCellContextMenu={
              onRowContextMenu
                ? (e) => {
                    const ev = e.event as MouseEvent | null | undefined
                    if (e.data && ev) {
                      onRowContextMenu(e.data as BarisData, {
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
            getRowStyle={(p) =>
              (p.data as { id?: string } | undefined)?.id ===
              idTerpilihRef.current
                ? { backgroundColor: "var(--table-accent)" }
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
