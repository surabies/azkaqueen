// components/layout/navigation/sidebar/GroupList.tsx
// Tampilan 1 (root): daftar grup/direktorat.

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { navGroups } from "@/config/navigation"
import { getGroupIcon } from "./icons"
import { RowIconBox, RowText } from "./SidebarRow"
import { FOCUS_RING, ROW_BASE, SECTION_LABEL } from "./styles"

type Props = {
  activeGroupId?: string
  onOpen: (groupId: string) => void
}

export function GroupList({ activeGroupId, onOpen }: Props) {
  return (
    <div className="flex flex-col">
      <p className={cn(SECTION_LABEL, "pb-2")}>Menu Utama</p>

      <ul className="flex flex-col gap-0.5">
        {navGroups.map((group) => {
          const hasActive = group.id === activeGroupId

          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onOpen(group.id)}
                className={cn(
                  ROW_BASE,
                  "group/row h-11 gap-3 px-2",
                  FOCUS_RING,
                  hasActive ? "bg-sidebar-accent" : "hover:bg-sidebar-hover",
                )}
              >
                <RowIconBox icon={getGroupIcon(group.id)} active={hasActive} />
                <RowText
                  groupId={group.id}
                  title={group.title}
                  emphasized={hasActive}
                />
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  strokeWidth={1.8}
                  className="shrink-0 text-sidebar-foreground/50 transition-transform duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-sidebar-accent-foreground motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
