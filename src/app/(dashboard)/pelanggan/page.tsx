import type { Metadata } from "next"
import { PageContainer } from "@/components/layout"
import { PelangganGrid } from "@/features/dashboard/components/grids/pelanggan-grid"

export const metadata: Metadata = { title: "Data Pelanggan · Tirtawening" }

export default function Page() {
  return (
    <PageContainer
      className="flex min-h-0 flex-1 flex-col"
      breadcrumbs={[
        { label: "Pelanggan", href: "/pelanggan" },
        { label: "Data Pelanggan" },
      ]}
    >
      <div className="flex min-h-96 flex-1 flex-col">
        <PelangganGrid />
      </div>
    </PageContainer>
  )
}
