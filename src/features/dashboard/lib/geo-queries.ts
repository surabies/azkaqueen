import "server-only"

// features/dashboard/lib/geo-queries.ts — pengambilan data spasial untuk
// halaman peta wilayah. Server component membaca DB langsung (pola
// queries.ts), hasilnya GeoJSON FeatureCollection siap dimakan MapLibre.
//
// Kolom geometry bertipe Unsupported di Prisma — HARUS lewat raw SQL
// (ST_AsGeoJSON). Mengikuti aturan server/lib/spatial.ts: $queryRawUnsafe
// dengan identifier tetap (bukan input), tanpa Prisma.raw().
import { prisma } from "@workspace/db"

export interface FC {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    geometry: unknown
    properties: Record<string, unknown>
  }>
}

function keFC(rows: Array<{ geom: unknown } & Record<string, unknown>>): FC {
  return {
    type: "FeatureCollection",
    features: rows.map(({ geom, ...properties }) => ({ type: "Feature", geometry: geom, properties })),
  }
}

/// Berapa warna yang dipakai membedakan kelurahan bertetangga. Tiga, bukan
/// delapan: di peta SETIAP pasang warna bisa berakhir bersebelahan, dan pada
/// syarat "semua pasangan" hanya tiga warna pertama palet yang lolos ambang
/// keterbacaan buta warna. Slot ke-4 dipakai HANYA bila tiga tidak cukup —
/// dia abu-abu netral, bukan warna keempat yang menuntut dibedakan.
const JUMLAH_WARNA = 3

/// Pewarnaan peta: kelurahan yang BERSINGGUNGAN tidak boleh sewarna.
///
/// Kenapa tidak sekadar `urutan % 3`: urutan abjad tidak tahu apa-apa soal
/// geografi, jadi dua kelurahan bersebelahan bisa saja kebagian warna yang
/// sama — dan justru pasangan itulah yang perlu dibedakan. Di sini
/// ketetanggaannya ditanyakan ke PostGIS (ST_Touches), lalu diwarnai serakah:
/// tiap kelurahan mengambil warna terkecil yang belum dipakai tetangganya.
///
/// WARNANYA TIDAK BERARTI APA-APA. Ia tidak mengkodekan data — hanya
/// memisahkan bidang dari bidang sebelahnya, seperti peta wilayah cetak.
/// Identitas kelurahan dibawa NAMANYA, yang dilabelkan di peta; warna tidak
/// pernah jadi satu-satunya penanda.
async function warnaPerKelurahan(id: string[]): Promise<Map<string, number>> {
  if (id.length === 0) return new Map()

  const sisi = await prisma.$queryRawUnsafe<Array<{ a: string; b: string }>>(
    `SELECT a.id AS a, b.id AS b
       FROM kelurahan a
       JOIN kelurahan b ON a.id < b.id AND ST_Touches(a.area, b.area)
      WHERE a.area IS NOT NULL AND b.area IS NOT NULL`
  )

  const tetangga = new Map<string, Set<string>>(id.map((x) => [x, new Set<string>()]))
  for (const { a, b } of sisi) {
    tetangga.get(a)?.add(b)
    tetangga.get(b)?.add(a)
  }

  // Yang paling banyak bertetangga diwarnai lebih dulu (heuristik Welsh–
  // Powell): mewarnai simpul tersulit belakangan justru yang memaksa
  // pemakaian warna cadangan.
  const urut = [...id].sort((x, y) => (tetangga.get(y)?.size ?? 0) - (tetangga.get(x)?.size ?? 0))
  const warna = new Map<string, number>()
  for (const k of urut) {
    const terpakai = new Set<number>()
    for (const t of tetangga.get(k) ?? []) {
      const w = warna.get(t)
      if (w !== undefined) terpakai.add(w)
    }
    let pilih = 0
    while (pilih < JUMLAH_WARNA && terpakai.has(pilih)) pilih++
    // pilih === JUMLAH_WARNA berarti ketiga warna sudah dipakai tetangga —
    // jatuh ke slot netral. Pada peta wilayah nyata ini jarang terjadi.
    warna.set(k, pilih)
  }
  return warna
}

/** Poligon batas kelurahan yang punya geometri, lengkap dengan indeks warna
 *  supaya dua kelurahan bersebelahan tidak pernah tampil sewarna. */
export async function batasKelurahanFC(): Promise<FC> {
  const rows = await prisma.$queryRawUnsafe<Array<{ geom: unknown; id: string; nama: string }>>(
    `SELECT id, nama, ST_AsGeoJSON(area)::json AS geom FROM kelurahan WHERE area IS NOT NULL`
  )
  const warna = await warnaPerKelurahan(rows.map((r) => r.id))
  return keFC(rows.map((r) => ({ ...r, warna: warna.get(r.id) ?? 0 })))
}

/** Titik sambungan pelanggan berkoordinat (di-cap supaya payload RSC tidak
 *  meledak — 20rb titik ≈ 2 MB; kalau kelak lebih, pindahkan ke endpoint
 *  vektor-tile / bbox query). */
export async function titikPelangganFC(limit = 25000): Promise<FC> {
  const rows = await prisma.$queryRawUnsafe<Array<{ geom: unknown; id: string; nama: string; nomor: string; status: string }>>(
    `SELECT id, nama, "nomorLangganan" AS nomor, status::text AS status, ST_AsGeoJSON(koordinat)::json AS geom
     FROM pelanggan
     WHERE koordinat IS NOT NULL AND "deletedAt" IS NULL
     LIMIT $1`,
    limit
  )
  return keFC(rows)
}

/** Titik pengaduan yang masih aktif (belum selesai/ditolak) dan berlokasi. */
export async function titikPengaduanFC(): Promise<FC> {
  const rows = await prisma.$queryRawUnsafe<Array<{ geom: unknown; id: string; tiket: string; jenis: string; status: string }>>(
    `SELECT id, "nomorTiket" AS tiket, jenis::text AS jenis, status::text AS status, ST_AsGeoJSON(koordinat)::json AS geom
     FROM pengaduan
     WHERE koordinat IS NOT NULL AND status NOT IN ('SELESAI', 'DITOLAK')`
  )
  return keFC(rows)
}
