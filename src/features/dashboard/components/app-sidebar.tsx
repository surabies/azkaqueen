"use client"

// features/dashboard/components/app-sidebar.tsx — navigasi utama dashboard.
//
// Client component karena butuh usePathname() untuk menandai menu aktif.
// Data user (role) datang lewat PROP dari layout (server component) — sengaja
// tidak memakai useSession() di sini: itu menambah satu request
// /api/auth/session dari browser dan membuat menu berkedip saat dimuat,
// padahal server sudah memilikinya.
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArchiveRestore,
  FileUp,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  Camera,
  ClipboardCheck,
  ClipboardList,
  DatabaseBackup,
  FileCheck2,
  FileSpreadsheet,
  Gauge,
  HardHat,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Map,
  MapPin,
  MessageSquareWarning,
  PlugZap,
  Receipt,
  ReceiptText,
  Route,
  ScanSearch,
  ScrollText,
  Settings2,
  Unplug,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

/// Cermin ROLE_GROUPS.MANAGEMENT_UP dari server/middleware/rbac.ts — file itu
/// menyeret session server, jadi tidak bisa diimpor ke client. Kalau grup di
/// sana berubah, samakan di sini.
const MANAGEMENT_UP = new Set(["SUPER_ADMIN", "DIREKSI", "SENIOR_MANAGER", "MANAGER"])

/// Peta menu disimpulkan dari server/modules/* (lihat tabel endpoint di
/// server/README.md) — setiap item mewakili domain API yang benar-benar ada.
///
/// DUA ATURAN YANG DIPEGANG DAFTAR INI, keduanya lahir dari keluhan nyata
/// bahwa menunya "acak-acakan dan namanya kepanjangan":
///
///   1. PENGELOMPOKAN MENGIKUTI PEKERJAAN, bukan asal tabel atau kebetulan
///      sejarah. Susunan lama menaruh "Pembacaan meter" di Penagihan tapi
///      "Laporan harian petugas" di Operasional Lapangan — padahal keduanya
///      satu rantai yang sama; dan tiga layar impor tersebar di tiga grup
///      berbeda. Sekarang satu pekerjaan = satu grup: Pelanggan → Catat
///      Meter → Penagihan, lalu Impor / Data Induk / Administrasi yang
///      memang bukan pekerjaan harian.
///
///   2. LABEL DIBACA DALAM KONTEKS GRUPNYA. Grup sudah menyebut ranahnya,
///      jadi item tidak perlu mengulanginya: di bawah "Penagihan", "Closing"
///      sudah cukup — "Closing periode" hanya memanjangkan baris. Yang
///      paling parah adalah dua pasang nama nyaris kembar: "Laporan mandiri"
///      (arsip kiriman warga) vs "Laporan mandiri pelanggan" (layar
///      verifikasinya), dan "Laporan harian petugas" vs "Catat meter
///      lapangan". Tidak ada cara menebak mana yang mana dari namanya, dan
///      itu memang tidak pernah bisa ditebak — sekarang yang satu bernama
///      "Verifikasi lapangan"/"Verifikasi mandiri" (tempat MENGERJAKAN),
///      yang lain "Setoran harian"/"Kiriman warga" (arsip mentahnya).
///
/// `ket` = penjelasan yang muncul sebagai tooltip. Label boleh pendek justru
/// karena keterangannya tidak ikut hilang.
const MENU = [
  {
    label: null,
    minRole: null,
    item: [{ href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, ket: "Kondisi pelayanan hari ini" }],
  },
  {
    label: "Pelanggan",
    minRole: null,
    item: [
      { href: "/dashboard/pelanggan", label: "Pelanggan", icon: Users, ket: "Seluruh sambungan terdaftar" },
      { href: "/dashboard/meter", label: "Meter", icon: Gauge, ket: "Aset meter terpasang & histori penggantiannya" },
      { href: "/dashboard/pemutusan", label: "Pemutusan", icon: Unplug, ket: "Tutup sementara & SPT" },
      { href: "/dashboard/mutasi", label: "Riwayat mutasi", icon: ArrowLeftRight, ket: "Arsip pasang baru (PB) & pasang kembali (PK) per periode" },
      { href: "/dashboard/potensi", label: "Calon pelanggan", icon: UserPlus, ket: "Prospek hasil survei lapangan" },
      { href: "/dashboard/pengaduan", label: "Pengaduan", icon: MessageSquareWarning, ket: "Tiket aduan warga & penanganannya" },
    ],
  },
  {
    // SATU RANTAI, SATU GRUP: sambungan masuk daftar catat → petugas
    // menyetor → penyelia memverifikasi. Dulu ketiganya terpencar di
    // "Verifikasi" dan "Operasional Lapangan", dua grup yang batasnya tidak
    // pernah jelas bagi siapa pun.
    label: "Catat Meter",
    minRole: null,
    item: [
      { href: "/dashboard/verifikasi-lapangan", label: "Verifikasi lapangan", icon: BadgeCheck, ket: "Periksa setoran petugas berjenjang V1–V3 sampai jadi pembacaan resmi" },
      { href: "/dashboard/verifikasi-mandiri", label: "Verifikasi mandiri", icon: FileCheck2, ket: "Periksa laporan meter yang dikirim warga sendiri" },
      { href: "/dashboard/anomali", label: "Sambungan tak terukur", icon: ScanSearch, ket: "Meter yang berbulan-bulan tidak terbaca — daftar rumah yang perlu didatangi" },
      { href: "/dashboard/pemetaan-rute", label: "Rute", icon: Route, ket: "Rute baca meter & petugas yang memegangnya" },
      { href: "/dashboard/pemetaan-sambungan", label: "Sambungan baru", icon: MapPin, ket: "Mutasi PBPK: petakan sambungan baru ke rute & petugas, lalu isi pencatatan awalnya" },
      { href: "/dashboard/laporan-harian", label: "Setoran harian", icon: ClipboardCheck, ket: "Arsip mentah setoran petugas, sebelum verifikasi" },
      { href: "/dashboard/laporan-mandiri", label: "Kiriman warga", icon: Camera, ket: "Arsip mentah laporan meter dari halaman publik" },
    ],
  },
  {
    label: "Penagihan",
    minRole: null,
    item: [
      // Urutan = urutan kerjanya: pembacaan resmi → closing menerbitkan
      // tagihan → tagihan ditagihkan & dibayar.
      { href: "/dashboard/pembacaan", label: "Pembacaan resmi", icon: ClipboardList, ket: "Hasil closing — satu baris per meter per periode, dasar hitungan tagihan" },
      { href: "/dashboard/closing", label: "Closing", icon: LockKeyhole, ket: "Terbitkan tagihan satu periode sekaligus lalu kunci" },
      { href: "/dashboard/tagihan", label: "Tagihan air", icon: Receipt, ket: "Rekening air per periode" },
      { href: "/dashboard/tagihan-lain", label: "Tagihan non-air", icon: ReceiptText, ket: "Tagihan di luar pemakaian air" },
      { href: "/dashboard/pembayaran", label: "Pembayaran", icon: Wallet, ket: "Setoran pembayaran yang tercatat" },
      { href: "/dashboard/laporan-drd", label: "DRD", icon: FileSpreadsheet, ket: "Daftar Rekening Ditagihkan — unduhan laporan per periode" },
    ],
  },
  {
    // Tiga layar impor + rekonsiliasi dulu tersebar di tiga grup berbeda.
    // Semuanya menjawab satu pertanyaan yang sama — "memasukkan data dari
    // luar" — dan hampir tidak pernah dipakai dalam pekerjaan harian.
    label: "Impor Data",
    minRole: null,
    item: [
      { href: "/dashboard/impor-data", label: "Berkas sumber", icon: FileUp, ket: "Unggah berkas sumber bulanan dari sistem lama" },
      { href: "/dashboard/impor-cadangan", label: "Cadangan lapangan", icon: ArchiveRestore, ket: "Ubah berkas cadangan aplikasi petugas jadi laporan harian" },
      { href: "/dashboard/pbpk", label: "PBPK", icon: PlugZap, ket: "Impor pasang baru & pasang kembali — pintu masuk sambungan baru" },
      { href: "/dashboard/master-pelanggan", label: "Rekonsiliasi", icon: DatabaseBackup, ket: "Alat transisi: cocokkan populasi data induk dengan sistem lama" },
    ],
  },
  {
    label: "Data Induk",
    minRole: null,
    item: [
      { href: "/dashboard/wilayah", label: "Wilayah & peta", icon: Map, ket: "Batas kelurahan, sebaran sambungan, titik pengaduan" },
      { href: "/dashboard/tarif", label: "Tarif", icon: Banknote, ket: "Golongan tarif & blok pemakaiannya" },
      { href: "/dashboard/organisasi", label: "Organisasi", icon: Building2, ket: "Hierarki Divisi → Bagian → Sub-bagian" },
      { href: "/dashboard/petugas", label: "Petugas", icon: HardHat, ket: "Petugas lapangan: jenis pekerjaan & cakupan datanya" },
    ],
  },
  {
    // Endpoint /users & /audit-log memang MANAGEMENT_UP di server — menunya
    // ikut disembunyikan untuk role di bawah itu (server tetap penjaga
    // aslinya; ini cuma soal tidak memajang pintu yang pasti terkunci).
    label: "Administrasi",
    minRole: MANAGEMENT_UP,
    item: [
      { href: "/dashboard/pengguna", label: "Pengguna", icon: UserCog, ket: "Akun & hak akses" },
      { href: "/dashboard/kesehatan", label: "Kesehatan data", icon: HeartPulse, ket: "Apakah data ini bisa dipertanggungjawabkan sebagai dasar penagihan" },
      { href: "/dashboard/audit-log", label: "Audit log", icon: ScrollText, ket: "Jejak perubahan data" },
      { href: "/dashboard/konfigurasi", label: "Konfigurasi", icon: Settings2, ket: "Pasangan kunci-nilai runtime" },
    ],
  },
] as const

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border px-4 py-3.5">
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Ringkasan dashboard">
          <AppLogo className="size-7 shrink-0" />
          <span className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">PERUMDA Tirtawening</span>
            <span className="mt-0.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Dasbor Operasional
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {MENU.filter((grup) => !grup.minRole || grup.minRole.has(role)).map((grup, i) => (
          <SidebarGroup key={grup.label ?? i}>
            {grup.label && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-widest text-muted-foreground/80 uppercase">
                {grup.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {grup.item.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      // Cocok PERSIS, atau berawalan href + "/" untuk halaman
                      // anak (mis. /pengaduan/[id]).
                      //
                      // `startsWith(item.href)` polos tidak cukup, dan
                      // salahnya tidak kasat mata: "/dashboard/tagihan" juga
                      // awalan dari "/dashboard/tagihan-lain", jadi membuka
                      // Tagihan non-air menyorot DUA menu sekaligus. Garis
                      // miringnya yang membedakan halaman anak dari menu lain
                      // yang kebetulan namanya berawalan sama.
                      isActive={
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                      }
                      // Bilah aksen kiri saat aktif — inset shadow supaya tidak
                      // menggeser layout; grammar yang sama dengan penanda
                      // status di halaman publik.
                      className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:shadow-[inset_2px_0_0_0_var(--primary)]"
                    >
                      {/* title: label sengaja pendek, penjelasannya pindah
                          ke tooltip — bukan hilang. */}
                      <Link href={item.href} title={item.ket}>
                        <item.icon className="text-muted-foreground" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:px-2">
        <Link
          href="/"
          className="group/situs flex items-center justify-between text-xs text-muted-foreground transition-colors hover:text-foreground group-data-[collapsible=icon]:hidden"
        >
          <span>Situs publik</span>
          <ArrowUpRight className="size-3.5 transition-transform group-hover/situs:translate-x-0.5 group-hover/situs:-translate-y-0.5" />
        </Link>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
