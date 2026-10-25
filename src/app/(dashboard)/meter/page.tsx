import type { Metadata } from "next"
import { PembacaanGrid } from "@/features/dashboard/components/grids/pembacaan-grid"
import { PageContainer } from "@/components/layout/page/PageContainer"


export const metadata: Metadata= { title: "Data Pembacaan Meter · Tirtawening" }


export default function Page() {
  return (

    <PageContainer 
        className="flex min-h-0 flex-1 flex-col"
          breadcrumbs={[
            { label: "Pencatatan Meter", href: "/meter" },
            { label: "Data Pembacaan Meter" },
          ]}
        >
 <PembacaanGrid />
        </PageContainer>
 
  )
}
