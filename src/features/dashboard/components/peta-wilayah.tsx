"use client"

// features/dashboard/components/peta-wilayah.tsx — peta operasional MapLibre:
// poligon batas kelurahan, titik sambungan pelanggan (ter-cluster), dan
// titik pengaduan aktif.
//
// Basemap: raster OpenStreetMap langsung (tanpa API key). Untuk produksi
// ber-traffic tinggi sebaiknya diganti penyedia tile sendiri/berbayar —
// kebijakan tile.openstreetmap.org melarang beban berat.
//
// Data datang via PROP dari server component (GeoJSON FeatureCollection) —
// komponen ini tidak fetch sendiri.
//
// TEMA GELAP. Peta adalah satu-satunya permukaan di dashboard yang warnanya
// TIDAK bisa datang dari token CSS: MapLibre menggambar ke <canvas>, jadi
// tiap warna harus diserahkan sebagai nilai, dan ubin OSM datang sebagai
// gambar jadi yang selalu terang. Akibatnya, sebelum ini, membuka halaman
// ini dalam tema gelap berarti satu bidang putih menyilaukan di tengah
// aplikasi yang gelap, dengan kontrol zoom putih dan popup putih di atasnya.
// Yang dilakukan di sini: ubinnya diredupkan lewat paint raster-* (bukan
// filter CSS — filter akan ikut membalik poligon dan titik kita sendiri),
// garis tepi titik memakai warna latar tema, dan kontrol/popup MapLibre
// diberi warna token lewat globals.css. Peta ikut berganti saat tema
// berganti, tanpa memuat ulang halaman.
import * as React from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import type { FeatureCollection, Geometry, Point } from "geojson"
import type { FC } from "../lib/geo-queries"

const PUSAT_BANDUNG: [number, number] = [107.6098, -6.9147]

/// Sumber glyph — WAJIB ADA, dan ketiadaannya yang membuat peta membanjiri
/// konsol dengan galat setiap kali diperbesar. Lapisan `symbol` (angka pada
/// gugus titik, nama kelurahan) menggambar teks dari font vektor, dan gaya
/// peta ini sebelumnya tidak menyebutkan satu pun sumber font. Setiap ubin
/// baru yang masuk saat zoom mencoba memuat glyph, gagal, lalu melapor —
/// jadi makin diperbesar makin banyak galatnya.
const SUMBER_GLYPH = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
const FONT = ["Noto Sans Regular"]

/// Warna pembeda antar kelurahan. TIDAK MENGKODEKAN DATA — tugasnya hanya
/// memisahkan satu bidang dari bidang sebelahnya, seperti peta wilayah
/// cetak; identitas kelurahan dibawa label namanya. Indeksnya dihitung di
/// server dengan pewarnaan graf (lihat warnaPerKelurahan di lib/geo-queries)
/// supaya dua kelurahan yang bersinggungan tidak pernah sewarna.
///
/// TIGA warna + satu netral, bukan delapan: pada peta setiap pasang warna
/// bisa berakhir bersebelahan, dan pada syarat "semua pasangan" hanya tiga
/// slot pertama palet yang lolos ambang keterbacaan buta warna (diperiksa
/// dengan validator palet, bukan dikira-kira — ΔE CVD terburuk 9,2 terang /
/// 9,4 gelap).
const WARNA_WILAYAH = {
  terang: ["#2a78d6", "#eb6834", "#1baf7a", "#8a8a86"],
  gelap: ["#3987e5", "#d95926", "#199e70", "#9a9a95"],
} as const

/// Warna lapisan peta per tema. Nilainya HARUS berupa warna nyata, bukan
/// `var(--primary)`: MapLibre memberikannya ke WebGL, yang tidak mengenal
/// custom property CSS. Dipilih sepadan dengan token tema — teal primer dan
/// merah destructive — supaya peta tetap terbaca sebagai bagian sistem yang
/// sama.
const WARNA = {
  terang: {
    aksen: "#0d9488",
    aduan: "#dc2626",
    tepiTitik: "#ffffff",
    teksCluster: "#ffffff",
    teksLabel: "#111827",
    tepiLabel: "#ffffff",
    wilayah: WARNA_WILAYAH.terang,
    /// Bidang kelurahan DINAIKKAN dari 0,08 — pada opasitas itu ubin OSM di
    /// bawahnya menang telak dan batas wilayah praktis tidak terbaca sebagai
    /// bidang, hanya sebagai garis tipis.
    isiWilayah: 0.22,
    /// Ubin apa adanya.
    raster: { "raster-brightness-max": 1, "raster-saturation": 0, "raster-contrast": 0 },
  },
  gelap: {
    /// Dinaikkan terangnya: warna teal 600 tenggelam di atas ubin yang
    /// sudah diredupkan.
    aksen: "#2dd4bf",
    aduan: "#f87171",
    /// Tepi titik memakai warna KARTU tema gelap, bukan putih — cincin putih
    /// di sekeliling tiap titik justru jadi silau baru.
    tepiTitik: "#1c2427",
    teksCluster: "#062023",
    teksLabel: "#f9fbfb",
    tepiLabel: "#090b0c",
    wilayah: WARNA_WILAYAH.gelap,
    isiWilayah: 0.3,
    /// Ubin OSM diredupkan & dipucatkan sampai jadi latar, bukan tokoh utama.
    raster: { "raster-brightness-max": 0.45, "raster-saturation": -0.65, "raster-contrast": -0.15 },
  },
} as const

/// Ekspresi MapLibre: indeks warna dari properti `warna` → hex.
function isiWilayah(w: (typeof WARNA)[keyof typeof WARNA]) {
  return [
    "match",
    ["get", "warna"],
    0, w.wilayah[0],
    1, w.wilayah[1],
    2, w.wilayah[2],
    w.wilayah[3],
  ] as unknown as maplibregl.ExpressionSpecification
}

export function PetaWilayah({
  kelurahan,
  pelanggan,
  pengaduan,
}: {
  kelurahan: FC
  pelanggan: FC
  pengaduan: FC
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<maplibregl.Map | null>(null)
  const { resolvedTheme } = useTheme()
  const gelap = resolvedTheme === "dark"

  const adaData = kelurahan.features.length > 0 || pelanggan.features.length > 0 || pengaduan.features.length > 0

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // Nilai saat peta DIBANGUN saja (efek ini sengaja tanpa dependensi —
    // peta tidak boleh dibangun ulang tiap ganti tema). Pada render pertama
    // next-themes belum tahu tema tersimpannya, jadi nilai ini bisa saja
    // "terang" sesaat; effect kedua di bawah yang membetulkannya begitu
    // temanya diketahui.
    const w = gelap ? WARNA.gelap : WARNA.terang

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: PUSAT_BANDUNG,
      zoom: 11.5,
      style: {
        version: 8,
        // Tanpa `glyphs`, tiap lapisan symbol (angka gugus, nama kelurahan)
        // gagal memuat font dan melapor per ubin — lihat SUMBER_GLYPH.
        glyphs: SUMBER_GLYPH,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm", paint: { ...w.raster } }],
      },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

    map.on("load", () => {
      // ---- Batas kelurahan ----
      map.addSource("kelurahan", { type: "geojson", data: kelurahan as FeatureCollection })
      map.addLayer({
        id: "kelurahan-isi",
        type: "fill",
        source: "kelurahan",
        paint: { "fill-color": isiWilayah(w), "fill-opacity": w.isiWilayah },
      })
      map.addLayer({
        id: "kelurahan-garis",
        type: "line",
        source: "kelurahan",
        paint: { "line-color": isiWilayah(w), "line-width": 1.6, "line-opacity": 0.9 },
      })

      // ---- Nama kelurahan ----
      // Warna bidang hanya memisahkan tetangga; yang menyebutkan wilayah
      // mana ini adalah namanya. Halo tipis supaya tetap terbaca di atas
      // ubin peta yang ramai.
      map.addLayer({
        id: "kelurahan-nama",
        type: "symbol",
        source: "kelurahan",
        minzoom: 11,
        layout: {
          "text-field": ["get", "nama"],
          "text-font": FONT,
          "text-size": 11,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.05,
          // Nama yang bertabrakan disembunyikan, bukan ditumpuk.
          "text-padding": 6,
        },
        paint: {
          "text-color": w.teksLabel,
          "text-halo-color": w.tepiLabel,
          "text-halo-width": 1.4,
        },
      })

      // ---- Titik pelanggan (cluster) ----
      map.addSource("pelanggan", {
        type: "geojson",
        data: pelanggan as FeatureCollection,
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 15,
      })
      map.addLayer({
        id: "pelanggan-cluster",
        type: "circle",
        source: "pelanggan",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": w.aksen,
          "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 14, 100, 20, 1000, 28],
        },
      })
      map.addLayer({
        id: "pelanggan-cluster-angka",
        type: "symbol",
        source: "pelanggan",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": FONT, "text-size": 11 },
        paint: { "text-color": w.teksCluster },
      })
      map.addLayer({
        id: "pelanggan-titik",
        type: "circle",
        source: "pelanggan",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": w.aksen, "circle-radius": 5, "circle-stroke-width": 1.5, "circle-stroke-color": w.tepiTitik },
      })

      // ---- Titik pengaduan aktif ----
      map.addSource("pengaduan", { type: "geojson", data: pengaduan as FeatureCollection })
      map.addLayer({
        id: "pengaduan-titik",
        type: "circle",
        source: "pengaduan",
        paint: { "circle-color": w.aduan, "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": w.tepiTitik },
      })

      // Popup identitas saat titik diklik.
      map.on("click", "pelanggan-titik", (e) => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties as { nama?: string; nomor?: string; status?: string }
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="peta-popup"><strong>${p.nama ?? ""}</strong><br/><code>${p.nomor ?? ""}</code> · ${p.status ?? ""}</div>`
          )
          .addTo(map)
      })
      map.on("click", "pengaduan-titik", (e) => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties as { tiket?: string; jenis?: string; status?: string }
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="peta-popup"><strong>${p.jenis ?? ""}</strong><br/><code>${p.tiket ?? ""}</code> · ${p.status ?? ""}</div>`
          )
          .addTo(map)
      })
      for (const layer of ["pelanggan-titik", "pengaduan-titik", "pelanggan-cluster"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"))
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""))
      }

      // Zoom masuk saat cluster diklik.
      map.on("click", "pelanggan-cluster", async (e) => {
        const f = e.features?.[0]
        const clusterId = f?.properties?.cluster_id as number | undefined
        if (clusterId === undefined) return
        const src = map.getSource("pelanggan") as maplibregl.GeoJSONSource
        const zoom = await src.getClusterExpansionZoom(clusterId)
        map.easeTo({ center: (f!.geometry as Point).coordinates as [number, number], zoom })
      })

      // Pas-kan tampilan ke data yang ada.
      const semua: number[][] = []
      for (const fc of [kelurahan, pelanggan, pengaduan]) {
        for (const feat of fc.features) {
          const g = feat.geometry as Geometry
          if (g.type === "Point") semua.push(g.coordinates as number[])
        }
      }
      if (semua.length > 0) {
        const lngs = semua.map((c) => c[0]!)
        const lats = semua.map((c) => c[1]!)
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 48, maxZoom: 14, duration: 0 }
        )
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // Data datang dari server render sekali — peta tidak perlu di-rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pergantian tema: warna lapisan diperbarui DI TEMPAT. Membangun ulang
  // peta akan melempar pengguna kembali ke tampilan awal — posisi dan zoom
  // yang sudah dicari hilang hanya karena menekan tombol tema.
  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const w = gelap ? WARNA.gelap : WARNA.terang

    function terapkan() {
      if (!map || !map.isStyleLoaded()) return
      for (const [prop, nilai] of Object.entries(w.raster)) {
        map.setPaintProperty("osm", prop as "raster-brightness-max", nilai)
      }
      map.setPaintProperty("kelurahan-isi", "fill-color", isiWilayah(w))
      map.setPaintProperty("kelurahan-isi", "fill-opacity", w.isiWilayah)
      map.setPaintProperty("kelurahan-garis", "line-color", isiWilayah(w))
      map.setPaintProperty("kelurahan-nama", "text-color", w.teksLabel)
      map.setPaintProperty("kelurahan-nama", "text-halo-color", w.tepiLabel)
      map.setPaintProperty("pelanggan-cluster", "circle-color", w.aksen)
      map.setPaintProperty("pelanggan-cluster-angka", "text-color", w.teksCluster)
      map.setPaintProperty("pelanggan-titik", "circle-color", w.aksen)
      map.setPaintProperty("pelanggan-titik", "circle-stroke-color", w.tepiTitik)
      map.setPaintProperty("pengaduan-titik", "circle-color", w.aduan)
      map.setPaintProperty("pengaduan-titik", "circle-stroke-color", w.tepiTitik)
    }

    // Tema bisa berganti sebelum gaya peta selesai dimuat (mis. tema
    // tersimpan diterapkan tepat saat halaman dibuka) — `load` menyusul.
    if (map.isStyleLoaded()) terapkan()
    else map.once("load", terapkan)
  }, [gelap])

  return (
    <section className="border border-border/70 bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-2.5">
        <h2 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Peta Operasional</h2>
        {/* Warna contoh WAJIB mengikuti WARNA di atas — di tema gelap
            lapisannya naik ke teal-400/red-400, dan legenda yang tetap
            teal-600 akan menunjuk warna yang tidak ada di petanya. */}
        <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            {/* Tiga kotak, bukan satu: warna bidang kelurahan memang
                bergantian, dan legenda satu warna akan menjanjikan arti yang
                tidak ada. Keterangannya menyebut apa artinya — yaitu bukan
                apa-apa selain "wilayah sebelah". */}
            <span aria-hidden className="inline-flex">
              <span className="inline-block size-2.5 border border-[#2a78d6]/70 bg-[#2a78d6]/25 dark:border-[#3987e5]/70 dark:bg-[#3987e5]/30" />
              <span className="inline-block size-2.5 border border-[#eb6834]/70 bg-[#eb6834]/25 dark:border-[#d95926]/70 dark:bg-[#d95926]/30" />
              <span className="inline-block size-2.5 border border-[#1baf7a]/70 bg-[#1baf7a]/25 dark:border-[#199e70]/70 dark:bg-[#199e70]/30" />
            </span>
            Kelurahan (warna hanya memisahkan wilayah bertetangga)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-teal-600 dark:bg-teal-400" /> Sambungan pelanggan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-red-600 dark:bg-red-400" /> Pengaduan aktif
          </span>
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[calc(100dvh-22rem)] min-h-96 w-full" />
        {!adaData && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <p className="pointer-events-auto max-w-md border border-border bg-background/95 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground shadow-sm">
              Belum ada data spasial yang terisi — poligon batas kelurahan dan koordinat pelanggan belum diimpor.
              Peta akan hidup otomatis begitu kolom <code className="font-mono">area</code> / <code className="font-mono">koordinat</code> terisi.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
