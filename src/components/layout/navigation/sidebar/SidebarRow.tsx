// components/layout/navigation/sidebar/SidebarRow.tsx
// Dua potongan kecil yang dipakai ulang oleh baris grup dan tombol kembali.
// Induknya harus memberi class `group/row` supaya efek hover-nya bekerja.

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { getGroupCount } from "./utils"

/** Kotak ikon 32px dengan garis tipis. */
export function RowIconBox({
  icon,
  active = false,
  iconClassName,
}: {
  icon: IconSvgElement
  active?: boolean
  iconClassName?: string
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-card transition-colors",
        active
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground group-hover/row:text-sidebar-accent-foreground",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={17}
        strokeWidth={1.6}
        className={iconClassName}
        aria-hidden="true"
      />
    </span>
  )
}

/** Judul grup + "N menu" di bawahnya. */
export function RowText({
  groupId,
  title,
  emphasized = false,
}: {
  groupId: string
  title: string
  emphasized?: boolean
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span
        className={cn(
          "truncate text-sm leading-none",
          emphasized
            ? "font-semibold text-sidebar-accent-foreground"
            : "font-medium text-sidebar-foreground group-hover/row:text-sidebar-accent-foreground",
        )}
      >
        {title}
      </span>
      <span className="truncate text-xs leading-none text-sidebar-foreground/70 num">
        {getGroupCount(groupId)} menu
      </span>
    </span>
  )
}
