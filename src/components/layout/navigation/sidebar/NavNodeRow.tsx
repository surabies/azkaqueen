// components/layout/navigation/sidebar/NavNodeRow.tsx
// Satu node menu: folder (label seksi + anak-anaknya) atau halaman (link).

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { isNavFolder, type NavNode } from "@/config/navigation"
import { getItemIcon } from "./icons"
import { FOCUS_RING, ITEM_ACTIVE, ITEM_IDLE, ROW_BASE, SECTION_LABEL } from "./styles"
import type { ActiveInfo } from "./types"
import { isPending, nodeKey } from "./utils"

type Props = {
  node: NavNode
  active: ActiveInfo
  fallbackIcon: IconSvgElement
}

export function NavNodeRow({ node, active, fallbackIcon }: Props) {
  // Folder -> label seksi kecil, lalu anak-anaknya (boleh bersarang).
  if (isNavFolder(node)) {
    return (
      <li className="flex flex-col">
        <span className={cn(SECTION_LABEL, "pb-1.5 pt-4")}>{node.title}</span>
        <ul className="flex flex-col gap-0.5">
          {node.children.map((child, i) => (
            <NavNodeRow
              key={nodeKey(child, i)}
              node={child}
              active={active}
              fallbackIcon={fallbackIcon}
            />
          ))}
        </ul>
      </li>
    )
  }

  const isActive = node === active.item

  return (
    <li>
      <Link
        href={node.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          ROW_BASE,
          "h-control gap-3 px-2.5 text-sm",
          FOCUS_RING,
          isActive ? ITEM_ACTIVE : ITEM_IDLE,
        )}
      >
        {/* Ikon mewarisi warna teks (currentColor), jadi ikut berubah saat hover/aktif. */}
        <HugeiconsIcon
          icon={getItemIcon(node.title, fallbackIcon)}
          size={17}
          strokeWidth={1.6}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{node.title}</span>
        {isPending(node) && (
          <span className="shrink-0 rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] font-medium leading-none text-sidebar-foreground/70">
            Segera
          </span>
        )}
      </Link>
    </li>
  )
}
