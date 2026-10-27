import {  PageContainer } from "@/components/layout"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PbpkClient } from "@/features/dashboard/components/pbpk/pbpk-client"
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface"


export const metadata: Metadata = { title: "Sambungan Baru · Tirtawening" }

export default async function SambunganBaruPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <PageContainer
      breadcrumbs={[
        { label: "Administrasi", href: "/admin" },
        { label: "Input PBPK" },
      ]}
    >
      <PbpkClient role={session.user.role} />
    </PageContainer>
  )
}
