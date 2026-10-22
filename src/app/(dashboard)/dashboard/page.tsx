// src/app/dashboard/page.tsx
// Tugas: halaman Dashboard: kartu ringkasan (placeholder) + pintasan ke modul.
import type { Metadata } from "next"
import Link from "next/link"
import { navGroups } from "@/config/navigation"
import { PageContainer } from "@/components/layout"

export const metadata: Metadata = { title: "Dashboard · Tirtawening" }

// Nilai masih "—" karena belum terhubung ke data. Ganti saat API siap.
const stats = [
  "Pelanggan aktif",
  "Rekening bulan ini",
  "Gangguan terbuka",
  "Pengaduan baru",
]

export default function DashboardPage() {
  // Pintasan modul: semua grup kecuali Ringkasan dan Bantuan
  const modules = navGroups.filter(
    (group) => group.id !== "ringkasan" && group.id !== "bantuan",
  )

  return (
    <PageContainer
      breadcrumbs={[
        { label: "Ringkasan", href: "/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <section aria-label="Statistik">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((label) => (
            <div key={label} className="rounded-lg border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-medium">&mdash;</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Belum terhubung ke data
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-label="Modul">
        <h2 className="text-lg font-medium tracking-tight">Modul</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {modules.map((group) => (
            <Link
              key={group.id}
              href={group.items[0].href}
              className="group rounded-lg border bg-card p-5 transition-colors hover:border-sky-400/60"
            >
              <p className="font-medium group-hover:text-sky-700 dark:group-hover:text-sky-300">
                {group.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm/6 text-muted-foreground">
                {group.items.map((item) => item.title).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  )
}
