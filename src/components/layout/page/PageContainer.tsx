// components/layout/page/PageContainer.tsx
// Tugas: pembungkus isi tiap halaman: breadcrumb desktop, aksi, lalu konten.
import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

export function PageContainer({
  breadcrumbs,
  actions,
  className,
  children,
}: {
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-8",
        className,
      )}
    >
      <header className="mb-2 flex min-h-7 items-center justify-between gap-3 sm:mb-2.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden shrink-0 sm:block">
            <ol className="flex flex-wrap items-center justify-start gap-1.5 text-sm/5 font-medium text-muted-foreground">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={isLast ? "text-foreground" : undefined}
                      >
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
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      {children}
    </div>
  )
}
