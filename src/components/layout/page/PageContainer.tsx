// components/layout/page/PageContainer.tsx
// Tugas: pembungkus isi tiap halaman: breadcrumb, judul, deskripsi, tombol aksi,
// lalu konten. Dipakai di semua page supaya tampilannya seragam.
import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function PageContainer({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  children,
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6",
        className,
      )}
    >
      <header className="mb-6 border-b border-(--pattern-fg) pb-5 sm:mb-8 sm:pb-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm/6 font-medium text-sky-700 dark:text-sky-400">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={isLast ? "page" : undefined}>
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        /
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {description && (
          <p className="mt-3 max-w-4xl text-sm/6 text-muted-foreground sm:text-base/7">
            {description}
          </p>
        )}
      </header>

      {children}
    </div>
  )
}
