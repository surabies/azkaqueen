// components/layout/navigation/SidebarNav.tsx
// Sidebar drill-down bergaya Vercel untuk aplikasi pemerintahan.
//
//  Tampilan 1 (root)  : daftar grup/direktorat.
//  Tampilan 2 (detail): klik grup -> daftar menu grup itu, header "<" untuk kembali.
//
// File ini hanya merakit. Isinya ada di folder ./sidebar:
//   useSidebarDrilldown.ts  state & logika
//   GroupList.tsx           tampilan 1
//   GroupDetail.tsx         tampilan 2
//   NavNodeRow.tsx          baris menu / folder
//   SidebarRow.tsx          kotak ikon + teks baris grup
//   icons.ts                pemetaan ikon (grup & menu)
//   styles.ts               kelas Tailwind bersama
//   utils.ts, types.ts, Slide.tsx

"use client"

import { cn } from "@/lib/utils"
import { GroupDetail } from "./sidebar/GroupDetail"
import { GroupList } from "./sidebar/GroupList"
import { Slide } from "./sidebar/Slide"
import { useSidebarDrilldown } from "./sidebar/useSidebarDrilldown"

export function SidebarNav({ className }: { className?: string }) {
  const { active, activeGroupId, currentGroup, direction, openGroup, backToRoot } =
    useSidebarDrilldown()

  return (
    <nav aria-label="Menu utama" className={cn("overflow-hidden", className)}>
      {currentGroup ? (
        <Slide key={currentGroup.id} direction={direction}>
          <GroupDetail group={currentGroup} active={active} onBack={backToRoot} />
        </Slide>
      ) : (
        <Slide key="root" direction={direction}>
          <GroupList activeGroupId={activeGroupId} onOpen={openGroup} />
        </Slide>
      )}
    </nav>
  )
}
