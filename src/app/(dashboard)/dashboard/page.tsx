import type { Metadata } from "next"
import { Gauge, Receipt, TriangleAlert, Users, Wallet } from "lucide-react"
import {
  ambilRingkasan,
  ambilTren,
  ambilPerluTindakan,
} from "@/features/dashboard/lib/queries"
import { PageContainer } from "@/components/layout"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { PerluTindakan } from "@/features/dashboard/components/dashboard/perlu-tindakan"
import { TrenTagihan } from "@/features/dashboard/components/dashboard/tren-tagihan"
import {
  formatPeriode,
  formatRupiah,
  formatRupiahRingkas,
} from "@/features/public/lib/format"

export const metadata: Metadata = { title: "Ringkasan" }

export default async function DashboardPage() {
  // Paralel: tiga query independen, tidak perlu saling menunggu.
  const [ringkasan, tren, tindakan] = await Promise.all([
    ambilRingkasan(),
    ambilTren(),
    ambilPerluTindakan(),
  ])

  return (
    <PageContainer
      className="flex min-h-0 flex-1 flex-col"
      breadcrumbs={[
        { label: "Pemetaan Rute", href: "/meter/pemetaan" },
        { label: "Stand Konsumen" },
      ]}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Halaman (Pengganti prop eyebrow, judul, deskripsi, dan aksi) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ringkasan Operasional
            </p>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Kondisi pelayanan hari ini
            </h1>
            <p className="text-sm text-muted-foreground">
              {ringkasan.periode
                ? `Data penagihan terakhir: periode ${formatPeriode(ringkasan.periode)}.`
                : "Belum ada data penagihan."}
            </p>
          </div>
          {ringkasan.periode && (
            <div>
              <span className="border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-primary uppercase">
                Periode · {formatPeriode(ringkasan.periode)}
              </span>
            </div>
          )}
        </div>

        {/* Grid Kartu Statistik */}
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-border/70 bg-border/70 xl:grid-cols-4">
          <StatCard
            label="Pelanggan aktif"
            nilai={ringkasan.pelanggan.aktif.toLocaleString("id-ID")}
            keterangan={`${ringkasan.pelanggan.nonAktif.toLocaleString("id-ID")} non-aktif`}
            icon={Users}
          />
          <StatCard
            label={
              ringkasan.periode
                ? `Tagihan ${formatPeriode(ringkasan.periode)}`
                : "Tagihan"
            }
            nilai={formatRupiahRingkas(ringkasan.tagihanPeriode.nilai)}
            keterangan={`${ringkasan.tagihanPeriode.jumlah.toLocaleString("id-ID")} rekening · ${ringkasan.tagihanPeriode.pemakaianM3.toLocaleString("id-ID")} m³`}
            judulLengkap={formatRupiah(ringkasan.tagihanPeriode.nilai)}
            icon={Receipt}
          />
          <StatCard
            label="Tunggakan"
            nilai={formatRupiahRingkas(ringkasan.tunggakan.nilai)}
            keterangan={`${ringkasan.tunggakan.jumlah.toLocaleString("id-ID")} rekening belum lunas`}
            judulLengkap={formatRupiah(ringkasan.tunggakan.nilai)}
            icon={Wallet}
            nada={ringkasan.tunggakan.nilai > 0 ? "perhatian" : "netral"}
          />
          <StatCard
            label="Pengaduan aktif"
            nilai={ringkasan.pengaduan.belumSelesai.toLocaleString("id-ID")}
            keterangan={
              ringkasan.pengaduan.darurat > 0
                ? `${ringkasan.pengaduan.darurat} berstatus darurat`
                : "Tidak ada yang darurat"
            }
            icon={ringkasan.pengaduan.darurat > 0 ? TriangleAlert : Gauge}
            nada={ringkasan.pengaduan.darurat > 0 ? "perhatian" : "netral"}
          />
        </div>

        <TrenTagihan data={tren} />

        <PerluTindakan
          pengaduan={tindakan.pengaduan}
          laporanMandiri={tindakan.laporanMandiri}
        />
      </div>
    </PageContainer>
  )
}