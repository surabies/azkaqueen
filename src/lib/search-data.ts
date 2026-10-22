// lib/search-data.ts
// Tugas: sumber data pencarian (Ctrl+K). Dibangun dari config/navigation.ts,
// jadi menu baru otomatis bisa dicari.
import { navGroups } from "@/config/navigation"

export type SearchResult = { page: string; title: string; href: string }
export type SearchGroup = { category: string; results: SearchResult[] }

export function searchDocs(query: string): SearchGroup[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const groups: SearchGroup[] = []

  for (const group of navGroups) {
    const results: SearchResult[] = group.items
      .filter((item) => {
        const haystack = [
          item.title,
          item.description,
          group.title,
          ...(item.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase()
        // Semua kata yang diketik harus ada
        return terms.every((term) => haystack.includes(term))
      })
      .map((item) => ({
        page: item.title,
        title: item.description,
        href: item.href,
      }))

    if (results.length > 0) groups.push({ category: group.title, results })
  }

  return groups
}
