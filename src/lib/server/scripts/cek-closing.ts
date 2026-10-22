// Read-only regression check for the billing-period closing engine.
// Run: pnpm server:cek-closing [periode] (defaults to 202605).
//
// Pertanyaan yang dijawab: "kalau closing periode ini dijalankan lewat
// aplikasi, apakah tagihan yang terbit SAMA PERSIS dengan yang sudah ada?"
//
// This complements `db:verifikasi-tarif`, which checks the tariff formula
// against the source CSV rather than the complete closing flow.
// Yang itu menguji rumus tarif terhadap CSV. Yang ini menguji SELURUH JALUR
// CLOSING — pembacaan meter di database → tarif berlaku → biaya tetap per
// ukuran meter → total — terhadap tagihan yang benar-benar tersimpan.
//
// TIDAK MENULIS APA PUN. Periode tidak ditutup, tagihan tidak diterbitkan.
// Itu disengaja: membuktikan mesinnya benar tidak boleh mengharuskan
// menjalankan tindakan yang tidak bisa dibatalkan.

import "./env"
import { prisma } from "@db"
import { periodeToDate } from "../lib/periode"
import {
  hitungBarisSiapTagih,
  pratinjauClosing,
} from "../modules/closing/closing.service"
import { pratinjauBulanBaru } from "../modules/closing/bulan-baru.service"

/// Baris sumber yang SUDAH DIKETAHUI cacat di data warisan Aurora — bukan
/// bug mesin closing. Didaftarkan eksplisit karena tanpa ini skrip ini
/// selamanya keluar dengan kode != 0, dan gerbang CI yang selalu merah sama
/// saja dengan tidak ada gerbang: orang berhenti membacanya.
///
/// Aturannya dua arah, dan yang kedua sama pentingnya:
///   - selisih pada nomor yang TERDAFTAR di sini -> tidak menggagalkan;
///   - selisih pada nomor LAIN -> menggagalkan (regresi nyata);
///   - nomor terdaftar yang TERNYATA SUDAH COCOK -> juga menggagalkan,
///     supaya daftar ini tidak menumpuk jadi pengecualian abadi setelah
///     sumbernya dikoreksi.
/// `00008001503` (RM.TINGGAL PANGDAM VI/SL, golongan 2B) — SATU pelanggan,
/// TUJUH periode berturut-turut. Kolom `pakai_drd` di sumber macet di 3.000
/// m3 tiap bulan, sementara standnya bergerak wajar (342-1.008 m3) dan
/// `jmlhargaair` justru dihitung untuk selisih stand yang benar. Jadi baris
/// sumbernya bertentangan dengan dirinya sendiri, dan yang salah adalah
/// kolom kubikasinya — bukan tagihannya, bukan mesin closing kita.
///
/// Dampaknya bukan ke uang melainkan ke SETIAP laporan berbasis kubikasi
/// (total m3 terjual, NRW, target kinerja): satu baris ini menambah ~2.000
/// m3 palsu per bulan. Menunggu konfirmasi bagian penerbit ProgresCater —
/// lihat prisma/PEMETAAN-DATA.md bagian "Anomali data".
const ANOMALI_2B_MENAHUN = (
  standAwal: number,
  standAkhir: number,
  hargaAir: string,
) => ({
  nomorLangganan: "00008001503",
  alasan:
    `RM.TINGGAL PANGDAM VI/SL — stand bergerak ${standAkhir - standAwal} m3 ` +
    `(${standAwal.toLocaleString("id-ID")}->${standAkhir.toLocaleString("id-ID")}) tapi pakai_drd sumber tertulis 3.000 m3. ` +
    `Tagihan Aurora justru dihitung untuk selisih stand yang benar (Rp ${hargaAir}), ` +
    `jadi baris sumbernya bertentangan dengan dirinya sendiri.`,
})

const ANOMALI_DIKETAHUI: Record<
  number,
  { nomorLangganan: string; alasan: string }[]
> = {
  202601: [ANOMALI_2B_MENAHUN(76_597, 77_325, "9.078.000")],
  202602: [ANOMALI_2B_MENAHUN(77_325, 78_222, "11.232.750")],
  202603: [ANOMALI_2B_MENAHUN(78_222, 78_971, "9.345.750")],
  202604: [ANOMALI_2B_MENAHUN(78_971, 79_313, "4.156.500")],
  202605: [ANOMALI_2B_MENAHUN(79_313, 80_222, "11.385.750")],
  202606: [ANOMALI_2B_MENAHUN(80_222, 81_230, "12.648.000")],
  202607: [ANOMALI_2B_MENAHUN(81_230, 82_157, "11.615.250")],
}

function cetakHambatan(h: {
  kode: string
  pesan: string
  jumlah: number
  contoh: string[]
}): void {
  console.log(`  [${h.kode}] ${h.jumlah} — ${h.pesan}`)
  if (h.contoh.length > 0) {
    const lagi = h.jumlah - h.contoh.length
    console.log(
      `      nomor: ${h.contoh.join(", ")}${lagi > 0 ? ` … (+${lagi} lagi)` : ""}`,
    )
  }
}

async function main(): Promise<void> {
  const periodeThbl = Number(process.argv[2] ?? "202605")
  if (!Number.isInteger(periodeThbl) || periodeThbl < 190001) {
    console.error(`Periode tidak valid: ${process.argv[2]}`)
    process.exitCode = 1
    return
  }
  const periode = periodeToDate(periodeThbl)

  console.log("=========== PRATINJAU CLOSING ===========")
  const pratinjau = await pratinjauClosing(periodeThbl)
  console.log(
    `Periode          : ${pratinjau.periode}  (status: ${pratinjau.status})`,
  )
  console.log(
    `Daftar catat     : ${pratinjau.daftarCatat.total}  ${Object.entries(
      pratinjau.daftarCatat.perStatus,
    )
      .map(([k, v]) => `${k}=${v}`)
      .join(" ")}`,
  )
  console.log(
    `Verifikasi       : ${pratinjau.verifikasi.selesaiV3}/${pratinjau.verifikasi.total} tuntas V3 (belum: ${pratinjau.verifikasi.belumSelesai})`,
  )
  console.log(
    `Pembacaan        : ${pratinjau.pembacaan.total} total | ${pratinjau.pembacaan.sudahDitagih} sudah ditagih | ${pratinjau.pembacaan.akanDitagih} akan ditagih`,
  )
  console.log(
    `Perkiraan terbit : ${pratinjau.perkiraan.jumlahSL} SL | ${pratinjau.perkiraan.totalM3} m3 | Rp ${pratinjau.perkiraan.totalTagihan.toLocaleString("id-ID")}`,
  )
  console.log(`Bisa ditutup     : ${pratinjau.bisaDitutup ? "ya" : "TIDAK"}`)
  if (pratinjau.hambatan.length > 0) {
    console.log("Hambatan / peringatan:")
    for (const h of pratinjau.hambatan) cetakHambatan(h)
  }

  // ── Bulan baru: daftar kerja periode berikutnya yang akan diturunkan.
  // Ditampilkan di sini karena closing dan buka-bulan-baru adalah satu
  // siklus — memeriksa yang satu tanpa yang lain menyesatkan.
  console.log("\n=========== BUKA BULAN BARU ===========")
  const bb = await pratinjauBulanBaru(periodeThbl)
  console.log(`Sumber           : ${bb.periodeSumber} -> ${bb.periodeBaru}`)
  console.log(
    `DPM sumber       : ${bb.sumber.total}  ${Object.entries(
      bb.sumber.perStatus,
    )
      .map(([k, v]) => `${k}=${v}`)
      .join(" ")}`,
  )
  console.log(
    `DPM tujuan       : ${bb.tujuan.sudahAda} baris ada | ${bb.tujuan.sudahBergerak} sudah bergerak`,
  )
  console.log(
    `Akan dibuat      : ${bb.perkiraan.akanDibuat}  (tanpa rute ${bb.perkiraan.tanpaRute} | tanpa pencatat ${bb.perkiraan.tanpaPencatat})`,
  )
  console.log(`Bisa dibuka      : ${bb.bisaDibuka ? "ya" : "TIDAK"}`)
  if (bb.hambatan.length > 0) {
    console.log("Hambatan / catatan:")
    for (const h of bb.hambatan) cetakHambatan(h)
  }

  // ── Regresi: hitung ulang SEMUA pembacaan, bandingkan dengan tagihan
  // yang sudah tersimpan.
  console.log("\n=========== REGRESI TERHADAP TAGIHAN TERSIMPAN ===========")
  const {
    baris,
    hambatan: hambatanRegresi,
    totalPembacaan,
  } = await hitungBarisSiapTagih(periode, periodeThbl, {
    sertakanYangSudahDitagih: true,
  })

  // Hambatan pada jalur regresi WAJIB dicetak terpisah dari pratinjau. Pada
  // periode yang tagihannya sudah lengkap, pratinjau tidak menghitung baris
  // apa pun sehingga hambatannya kosong — padahal justru di sinilah terlihat
  // pelanggan mana yang TIDAK AKAN bisa ditagih oleh mesin closing.
  const takTerhitung = totalPembacaan - baris.length
  if (takTerhitung > 0) {
    console.log(
      `Tak terhitung    : ${takTerhitung} dari ${totalPembacaan} pembacaan — mesin closing TIDAK bisa menerbitkan tagihannya:`,
    )
    for (const h of hambatanRegresi) cetakHambatan(h)
  }
  const tersimpan = new Map(
    (
      await prisma.tagihan.findMany({
        where: { periode },
        select: {
          pembacaanId: true,
          jmlHargaAir: true,
          beaBeban: true,
          beaAdmin: true,
          airKotor: true,
          totalTagihan: true,
        },
      })
    ).flatMap((t) => (t.pembacaanId ? [[t.pembacaanId, t] as const] : [])),
  )

  const daftarAnomali = ANOMALI_DIKETAHUI[periodeThbl] ?? []
  const anomaliDiharapkan = new Map(
    daftarAnomali.map((a) => [a.nomorLangganan, a]),
  )
  const anomaliTerpakai = new Set<string>()

  let cocok = 0
  let beda = 0
  let bedaTerduga = 0
  let takAdaPembanding = 0
  const contoh: string[] = []
  const contohTerduga: string[] = []
  const bedaPerKomponen = {
    jmlHargaAir: 0,
    beaBeban: 0,
    beaAdmin: 0,
    airKotor: 0,
    total: 0,
  }

  for (const b of baris) {
    const t = tersimpan.get(b.pembacaanId)
    if (!t) {
      takAdaPembanding++
      continue
    }
    const selisih: string[] = []
    if (t.jmlHargaAir !== b.jmlHargaAir) {
      bedaPerKomponen.jmlHargaAir++
      selisih.push(`hargaAir ${b.jmlHargaAir} vs ${t.jmlHargaAir}`)
    }
    if (t.beaBeban !== b.beaBeban) {
      bedaPerKomponen.beaBeban++
      selisih.push(`beaBeban ${b.beaBeban} vs ${t.beaBeban}`)
    }
    if (t.beaAdmin !== b.beaAdmin) {
      bedaPerKomponen.beaAdmin++
      selisih.push(`beaAdmin ${b.beaAdmin} vs ${t.beaAdmin}`)
    }
    if (t.airKotor !== b.airKotor) {
      bedaPerKomponen.airKotor++
      selisih.push(`airKotor ${b.airKotor} vs ${t.airKotor}`)
    }
    if (t.totalTagihan !== b.totalTagihan) {
      bedaPerKomponen.total++
      selisih.push(`TOTAL ${b.totalTagihan} vs ${t.totalTagihan}`)
    }

    if (selisih.length === 0) {
      cocok++
      continue
    }
    const rincian = `  ${b.nomorLangganan} (pembacaan=${b.pembacaanId}) pakai=${b.pemakaianM3} -> ${selisih.join(", ")}`
    if (anomaliDiharapkan.has(b.nomorLangganan)) {
      bedaTerduga++
      anomaliTerpakai.add(b.nomorLangganan)
      if (contohTerduga.length < 10) contohTerduga.push(rincian)
    } else {
      beda++
      if (contoh.length < 10) contoh.push(rincian)
    }
  }

  const dibandingkan = cocok + beda + bedaTerduga
  console.log(`Dibandingkan     : ${dibandingkan}`)
  console.log(`COCOK            : ${cocok}`)
  console.log(`BEDA (baru)      : ${beda}`)
  console.log(
    `BEDA (terduga)   : ${bedaTerduga}  <- anomali sumber yang sudah didaftarkan`,
  )
  if (takAdaPembanding > 0)
    console.log(`Belum bertagihan : ${takAdaPembanding} (tidak ada pembanding)`)
  if (beda > 0) {
    console.log(`Beda per komponen: ${JSON.stringify(bedaPerKomponen)}`)
    console.log("Contoh selisih BARU (hitung vs tersimpan):")
    for (const c of contoh) console.log(c)
  }
  if (bedaTerduga > 0) {
    console.log("Selisih terduga (anomali sumber yang sudah diketahui):")
    for (const c of contohTerduga) console.log(c)
    for (const n of anomaliTerpakai)
      console.log(`    alasan ${n}: ${anomaliDiharapkan.get(n)?.alasan}`)
  }

  // Entri baseline yang ternyata sudah cocok = daftar pengecualian yang basi.
  const anomaliBasi = daftarAnomali.filter(
    (a) => !anomaliTerpakai.has(a.nomorLangganan),
  )
  if (anomaliBasi.length > 0) {
    console.log(
      `\nBASELINE BASI    : ${anomaliBasi.length} nomor terdaftar sebagai anomali TAPI sudah cocok — hapus dari ANOMALI_DIKETAHUI di skrip ini:`,
    )
    for (const a of anomaliBasi) console.log(`  ${a.nomorLangganan}`)
  }

  console.log(
    `\nHASIL: ${cocok}/${dibandingkan} tagihan direproduksi persis lewat jalur closing aplikasi` +
      (bedaTerduga > 0
        ? ` (+${bedaTerduga} anomali sumber yang sudah diketahui)`
        : ""),
  )
  console.log("==========================================================")

  await prisma.$disconnect()
  // Gagal HANYA untuk selisih baru atau baseline yang sudah basi. Anomali
  // sumber yang sudah didaftarkan sengaja tidak menggagalkan — lihat alasan
  // di ANOMALI_DIKETAHUI.
  if (beda > 0 || anomaliBasi.length > 0) process.exitCode = 1
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exitCode = 1
})
