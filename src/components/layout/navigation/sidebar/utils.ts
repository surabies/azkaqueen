// components/layout/navigation/sidebar/utils.ts

import {
  flattenNavItems,
  isNavFolder,
  navGroups,
  type NavItem,
  type NavNode,
} from "@/config/navigation"

/** Jumlah halaman per grup — dihitung sekali saat modul dimuat, bukan tiap render. */
const GROUP_COUNTS: Record<string, number> = Object.fromEntries(
  navGroups.map((group) => [group.id, flattenNavItems(group.items).length]),
)

export function getGroupCount(groupId: string): number {
  return GROUP_COUNTS[groupId] ?? 0
}

/** Menu yang deskripsinya memuat kata "pending" ditandai badge "Segera". */
export function isPending(item: NavItem): boolean {
  return item.description.toLowerCase().includes("pending")
}

/** Key React yang stabil untuk daftar node (folder atau halaman). */
export function nodeKey(node: NavNode, index: number): string {
  return `${index}-${isNavFolder(node) ? "folder" : node.href}-${node.title}`
}
