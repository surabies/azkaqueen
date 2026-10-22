// config/navigation.ts
// Satu-satunya sumber data menu. Navbar, sidebar, pencarian, dan halaman
// template semuanya membaca file ini. Tambah menu baru cukup di sini.

export type NavItem = {
  title: string
  href: string
  description: string
  keywords?: string[]
}

export type NavGroup = {
  id: string
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    id: "ringkasan",
    title: "Ringkasan",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description:
          "Ringkasan kondisi pelanggan, tagihan, jaringan, dan pengaduan dalam satu layar.",
        keywords: ["beranda", "home"],
      },
      {
        title: "Notifikasi",
        href: "/notifikasi",
        description:
          "Pemberitahuan sistem: tugas baru, persetujuan, dan peringatan operasional.",
        keywords: ["pesan", "peringatan"],
      },
    ],
  },
  {
    id: "pelanggan",
    title: "Pelanggan",
    items: [
      {
        title: "Data Pelanggan",
        href: "/pelanggan",
        description:
          "Daftar seluruh pelanggan beserta nomor sambungan, golongan tarif, status, dan alamat.",
        keywords: ["sambungan", "nomor pelanggan"],
      },
      {
        title: "Sambungan Baru",
        href: "/pelanggan/sambungan-baru",
        description:
          "Pendaftaran, survei, persetujuan, dan pemasangan sambungan rumah baru.",
        keywords: ["pasang baru", "registrasi"],
      },
      {
        title: "Mutasi & Perubahan",
        href: "/pelanggan/mutasi",
        description:
          "Perubahan nama, golongan tarif, alamat, dan balik nama pelanggan.",
        keywords: ["balik nama", "ubah golongan"],
      },
      {
        title: "Penutupan & Buka Kembali",
        href: "/pelanggan/penutupan",
        description:
          "Penutupan sementara atau permanen dan pembukaan kembali sambungan.",
        keywords: ["segel", "putus", "buka segel"],
      },
      {
        title: "Pengaduan",
        href: "/pelanggan/pengaduan",
        description:
          "Pencatatan dan penanganan keluhan pelanggan sampai selesai.",
        keywords: ["keluhan", "komplain", "tiket"],
      },
    ],
  },
  {
    id: "meter",
    title: "Pencatatan Meter",
    items: [
      {
        title: "Jadwal Baca Meter",
        href: "/meter",
        description: "Penjadwalan rute dan petugas pencatat meter per wilayah.",
        keywords: ["rute", "petugas", "cater"],
      },
      {
        title: "Input Stand Meter",
        href: "/meter/input",
        description: "Input angka stand meter hasil pencatatan di lapangan.",
        keywords: ["stand", "catat meter"],
      },
      {
        title: "Verifikasi Pembacaan",
        href: "/meter/verifikasi",
        description:
          "Pemeriksaan pembacaan yang janggal sebelum dijadikan dasar tagihan.",
        keywords: ["anomali", "validasi"],
      },
      {
        title: "Penggantian Meter",
        href: "/meter/penggantian",
        description: "Riwayat tera, kerusakan, dan penggantian water meter.",
        keywords: ["tera", "water meter", "ganti meter"],
      },
    ],
  },
  {
    id: "tagihan",
    title: "Tagihan & Pembayaran",
    items: [
      {
        title: "Rekening Air",
        href: "/tagihan",
        description:
          "Pembuatan dan pencetakan rekening air bulanan per pelanggan.",
        keywords: ["billing", "rekening", "tagihan"],
      },
      {
        title: "Pembayaran",
        href: "/tagihan/pembayaran",
        description: "Pencatatan pembayaran loket, bank, dan kanal digital.",
        keywords: ["loket", "kasir", "bayar"],
      },
      {
        title: "Tunggakan",
        href: "/tagihan/tunggakan",
        description:
          "Pemantauan rekening yang belum lunas dan tindak lanjut penagihan.",
        keywords: ["piutang", "denda", "tagih"],
      },
      {
        title: "Rekonsiliasi",
        href: "/tagihan/rekonsiliasi",
        description:
          "Pencocokan data pembayaran dari bank dan mitra dengan catatan sistem.",
        keywords: ["bank", "settlement"],
      },
      {
        title: "Struktur Tarif",
        href: "/tagihan/tarif",
        description:
          "Pengelolaan golongan pelanggan, blok tarif, dan biaya administrasi.",
        keywords: ["golongan", "blok tarif", "harga"],
      },
    ],
  },
  {
    id: "jaringan",
    title: "Jaringan & Distribusi",
    items: [
      {
        title: "Peta Jaringan",
        href: "/jaringan",
        description: "Peta pipa distribusi, sambungan, dan zona layanan.",
        keywords: ["gis", "peta", "pipa"],
      },
      {
        title: "Aset Jaringan",
        href: "/jaringan/aset",
        description:
          "Inventaris pipa, valve, hidran, dan reservoir beserta kondisinya.",
        keywords: ["valve", "hidran", "reservoir"],
      },
      {
        title: "Gangguan & Kebocoran",
        href: "/jaringan/gangguan",
        description:
          "Pelaporan dan pemantauan gangguan aliran serta kebocoran pipa.",
        keywords: ["bocor", "air mati"],
      },
      {
        title: "Perintah Kerja",
        href: "/jaringan/perintah-kerja",
        description:
          "Penugasan, pelaksanaan, dan penutupan pekerjaan perbaikan di lapangan.",
        keywords: ["work order", "wo", "perbaikan"],
      },
    ],
  },
  {
    id: "produksi",
    title: "Produksi & Mutu Air",
    items: [
      {
        title: "Instalasi Pengolahan",
        href: "/produksi",
        description:
          "Data instalasi pengolahan air, kapasitas, dan debit produksi.",
        keywords: ["ipa", "sumber", "debit"],
      },
      {
        title: "Kualitas Air",
        href: "/produksi/kualitas-air",
        description:
          "Hasil uji laboratorium dan pemantauan sisa klor serta parameter mutu air.",
        keywords: ["lab", "klor", "ph", "kekeruhan"],
      },
      {
        title: "Kehilangan Air",
        href: "/produksi/kehilangan-air",
        description:
          "Analisis selisih air produksi dan air terjual (non-revenue water).",
        keywords: ["nrw", "susut"],
      },
    ],
  },
  {
    id: "laporan",
    title: "Laporan",
    items: [
      {
        title: "Pusat Laporan",
        href: "/laporan",
        description:
          "Semua laporan di satu tempat, lengkap dengan filter periode dan wilayah.",
        keywords: ["rekap"],
      },
      {
        title: "Laporan Pelanggan",
        href: "/laporan/pelanggan",
        description:
          "Rekap jumlah pelanggan, pertumbuhan sambungan, dan status layanan.",
      },
      {
        title: "Laporan Pendapatan",
        href: "/laporan/pendapatan",
        description:
          "Rekap penerimaan, tunggakan, dan realisasi dibanding target.",
        keywords: ["penerimaan"],
      },
      {
        title: "Laporan Operasional",
        href: "/laporan/operasional",
        description: "Rekap gangguan, perbaikan, produksi, dan distribusi air.",
      },
      {
        title: "Ekspor Data",
        href: "/laporan/ekspor",
        description:
          "Unduh data dalam format Excel atau CSV untuk audit dan pelaporan.",
        keywords: ["excel", "csv", "unduh"],
      },
    ],
  },
  {
    id: "admin",
    title: "Administrasi",
    items: [
      {
        title: "Pengguna & Hak Akses",
        href: "/admin",
        description: "Pengelolaan akun petugas, peran, dan hak akses menu.",
        keywords: ["user", "role", "akun"],
      },
      {
        title: "Wilayah & Zona",
        href: "/admin/wilayah",
        description:
          "Master kecamatan, kelurahan, zona, dan wilayah pelayanan.",
        keywords: ["kecamatan", "kelurahan"],
      },
      {
        title: "Master Data",
        href: "/admin/master-data",
        description:
          "Data referensi: golongan, jenis pekerjaan, jenis gangguan, dan lainnya.",
        keywords: ["referensi"],
      },
      {
        title: "Impor Data",
        href: "/admin/impor-data",
        description:
          "Impor data pelanggan, meter, dan tagihan dari sistem lama atau file CSV.",
        keywords: ["csv", "seed", "migrasi"],
      },
      {
        title: "Log Aktivitas",
        href: "/admin/log",
        description: "Jejak audit: siapa mengubah apa dan kapan.",
        keywords: ["audit"],
      },
      {
        title: "Pengaturan",
        href: "/admin/pengaturan",
        description: "Pengaturan umum aplikasi dan identitas perusahaan.",
      },
    ],
  },
  {
    id: "bantuan",
    title: "Bantuan",
    items: [
      {
        title: "Panduan Pengguna",
        href: "/bantuan",
        description:
          "Panduan penggunaan aplikasi dan kontak tim pengelola sistem.",
        keywords: ["help", "kontak"],
      },
    ],
  },
]

// Link teks di navbar desktop. Semua href di sini harus ada di navGroups.
export const navbarLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pelanggan", href: "/pelanggan" },
  { label: "Tagihan", href: "/tagihan" },
  { label: "Jaringan", href: "/jaringan" },
  { label: "Laporan", href: "/laporan" },
]

// Daftar datar semua item menu.
export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items)

// Cari item + grupnya berdasarkan href persis. Dipakai halaman template.
export function findNavItem(href: string) {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.href === href)
    if (item) return { group, item }
  }
  return undefined
}

// Pilihan versi di dropdown brand (NavbarBrand). Ubah sesuai versi aplikasi.
export const versions = ["v1.0"]

// Link menu layar penuh di mobile (MobileMenu): sama dengan navbar + Bantuan.
export const mobileMenuLinks = [
  ...navbarLinks.map((link) => ({ name: link.label, href: link.href })),
  { name: "Bantuan", href: "/bantuan" },
]

// Cari menu yang sedang aktif berdasarkan alamat halaman (untuk breadcrumb).
// Yang dipilih href terpanjang yang cocok, jadi "/pelanggan/mutasi" -> "Mutasi",
// bukan "Data Pelanggan".
export function findActiveNav(pathname: string) {
  let best: { group: NavGroup; item: NavItem } | undefined
  for (const group of navGroups) {
    for (const item of group.items) {
      const match =
        pathname === item.href || pathname.startsWith(item.href + "/")
      if (match && (!best || item.href.length > best.item.href.length)) {
        best = { group, item }
      }
    }
  }
  return best
}
