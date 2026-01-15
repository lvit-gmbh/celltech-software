import type { SortingState } from "@tanstack/react-table"

/**
 * Toggle sorting for TanStack Table with 3 states: asc → desc → none
 */
export function toggleSortingThreeStates(
  columnId: string,
  currentSorting: SortingState,
  setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void
) {
  const currentSort = currentSorting.find((s) => s.id === columnId)
  
  if (!currentSort) {
    // No sort → asc
    setSorting([{ id: columnId, desc: false }])
  } else if (!currentSort.desc) {
    // asc → desc
    setSorting([{ id: columnId, desc: true }])
  } else {
    // desc → none
    setSorting([])
  }
}

/**
 * Get sort state for a column
 */
export function getColumnSortState(columnId: string, sorting: SortingState): "asc" | "desc" | null {
  const sort = sorting.find((s) => s.id === columnId)
  if (!sort) return null
  return sort.desc ? "desc" : "asc"
}
