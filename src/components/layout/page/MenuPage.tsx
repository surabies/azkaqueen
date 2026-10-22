import { notFound } from "next/navigation"
import { findNavItem } from "@/config/navigation"
import { PageContainer } from "./PageContainer"

export function MenuPage({ href }: { href: string }) {
  const found = findNavItem(href)
  if (!found) notFound()

  const { group, item } = found

  return (
    <PageContainer
      breadcrumbs={[
        { label: group.title, href: group.items[0].href },
        { label: item.title },
      ]}
    >
      <div className="mb-6 border border-dashed border-sky-300/60 bg-sky-400/10 p-4 text-sm/6 text-sky-900 dark:border-sky-300/30 dark:text-sky-200 sm:mb-8 sm:p-5">
        <p className="font-medium">Halaman dalam tahap pengembangan</p>
        <p className="mt-1">
          Kerangka modul sudah tersedia. Konten dan integrasi data akan
          ditambahkan pada tahap berikutnya.
        </p>
      </div>

      <section aria-label={`Ringkasan ${item.title}`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {["Total", "Hari ini", "Menunggu tindakan"].map((label) => (
            <div
              key={label}
              className="min-w-0 rounded-lg border bg-card p-4 sm:p-5"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-medium">&mdash;</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border bg-card p-4 sm:mt-6 sm:p-5">
        <h2 className="font-medium">Data {item.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Data untuk modul ini akan ditampilkan di sini.
        </p>
        <div
          aria-hidden="true"
          className="mt-4 h-48 rounded-md bg-muted/60 sm:h-64"
        />
      </section>
    </PageContainer>
  )
}
