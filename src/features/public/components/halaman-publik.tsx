import { useId } from "react"
import {
  Expandable,
  ExpandableContent,
  ExpandableTrigger,
} from "@/components/ui/expandable"
import {
  HaloCard,
  HaloCardAction,
  HaloCardContent,
  HaloCardHeader,
  HaloCardTitle,
} from "@/components/ui/halo-card"

/** Layout bersama untuk halaman layanan pelanggan. */
export function HalamanPublik({
  eyebrow,
  judul,
  lede,
  aside,
  children,
}: {
  eyebrow: string
  judul: string
  lede: string
  aside: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 lg:py-14">
          <p className="text-xs font-medium text-primary">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {judul}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {lede}
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-10 md:px-8 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">{children}</div>
        <aside className="lg:order-first lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-col gap-8 lg:sticky lg:top-24">{aside}</div>
        </aside>
      </div>
    </>
  )
}

export function AsideBlok({
  label,
  children,
  collapsible = false,
}: {
  label: string
  children: React.ReactNode
  collapsible?: boolean
}) {
  const contentId = useId()

  return (
    // Tahap 1: HaloCard tanpa prop tambahan, persis pola demo.
    <HaloCard aria-label={label}>
      {/* Tahap 2: judul kartu di header. */}
      <HaloCardHeader>
        <HaloCardTitle className="text-sm">{label}</HaloCardTitle>
      </HaloCardHeader>

      {/* Tahap 3: isi kartu selalu di HaloCardContent. Mode collapsible
          hanya membungkus isi dengan Expandable. */}
      <HaloCardContent>
        {collapsible ? (
          <Expandable>
            <ExpandableTrigger
              aria-controls={contentId}
              aria-label={`Tampilkan atau sembunyikan detail: ${label}`}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
              Panduan
            </ExpandableTrigger>
            <ExpandableContent
              className="text-sm leading-relaxed text-muted-foreground"
              id={contentId}
              preset="fade"
            >
              {children}
            </ExpandableContent>
          </Expandable>
        ) : (
          <div className="text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        )}
      </HaloCardContent>
    </HaloCard>
  )
}

export function LangkahList({
  langkah,
}: {
  langkah: readonly { judul: string; detail: string }[]
}) {
  return (
    <ol className="space-y-0">
      {langkah.map((langkahItem, i) => (
        <li
          key={langkahItem.judul}
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          {i < langkah.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-7 left-2.75 h-full w-px bg-border"
            />
          )}
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card font-mono text-[11px] font-semibold text-foreground">
            {i + 1}
          </span>
          <span className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-sm font-medium">{langkahItem.judul}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {langkahItem.detail}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function KartuBerbingkai({
  label,
  chip,
  className,
  children,
}: {
  label?: string
  chip?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    // Tahap 1: HaloCard polos, aria-label diambil dari label.
    <HaloCard aria-label={label}>
      {/* Tahap 2: header hanya muncul jika ada label; chip masuk slot Action. */}
      {label && (
        <HaloCardHeader>
          <HaloCardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </HaloCardTitle>
          {chip && (
            <HaloCardAction>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                {chip}
              </span>
            </HaloCardAction>
          )}
        </HaloCardHeader>
      )}

      {/* Tahap 3: isi di HaloCardContent. */}
      <HaloCardContent className={className}>{children}</HaloCardContent>
    </HaloCard>
  )
}