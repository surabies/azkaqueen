// components/layout/navigation/sidebar/GroupDetail.tsx
// Tampilan 2: isi satu grup, dengan header "< Nama Grup" untuk kembali.

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { NavGroup } from "@/config/navigation"
import { getGroupIcon } from "./icons"
import { NavNodeRow } from "./NavNodeRow"
import { RowIconBox, RowText } from "./SidebarRow"
import { FOCUS_RING, ROW_BASE } from "./styles"
import type { ActiveInfo } from "./types"
import { nodeKey } from "./utils"

type Props = {
  group: NavGroup
  active: ActiveInfo
  onBack: () => void
}

export function GroupDetail({ group, active, onBack }: Props) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onBack}
        aria-label={`Kembali ke daftar menu dari ${group.title}`}
        className={cn(
          ROW_BASE,
          "group/row h-11 gap-3 px-2 hover:bg-sidebar-hover",
          FOCUS_RING,
        )}
      >
        <RowIconBox
          icon={ArrowLeft01Icon}
          iconClassName="transition-transform duration-200 group-hover/row:-translate-x-0.5 motion-reduce:transition-none"
        />
        <RowText groupId={group.id} title={group.title} emphasized />
      </button>

      <div className="mx-2 my-2 h-px bg-sidebar-border" role="separator" />

      <ul className="flex flex-col gap-0.5">
        {group.items.map((node, i) => (
          <NavNodeRow
            key={nodeKey(node, i)}
            node={node}
            active={active}
            fallbackIcon={getGroupIcon(group.id)}
          />
        ))}
      </ul>
    </div>
  )
}
