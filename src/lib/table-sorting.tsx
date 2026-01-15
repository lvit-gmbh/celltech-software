import React from "react"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SortingState } from "@tanstack/react-table"
import type { Column } from "@tanstack/react-table"

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
 * Create a toggle handler for TanStack Table columns with 3 states
 */
export function createToggleSortHandler(
  column: Column<any, unknown>,
  columnId: string,
  sorting: SortingState,
  setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void
) {
  return () => {
    toggleSortingThreeStates(columnId, sorting, setSorting)
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

/**
 * Render sortable header for native HTML tables (like Dashboard)
 */
export function renderSortableHeaderNative(
  column: string,
  label: string,
  sortColumn: string | null,
  sortDirection: "asc" | "desc" | null,
  onSort: (column: string) => void
) {
  const isSorted = sortColumn === column
  const isAsc = sortDirection === "asc"
  const isDesc = sortDirection === "desc"

  return (
    <th 
      className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2 group">
        <span>{label}</span>
        {isSorted && isAsc ? (
          <ArrowUp className="h-3 w-3 opacity-100" />
        ) : isSorted && isDesc ? (
          <ArrowDown className="h-3 w-3 opacity-100" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </div>
    </th>
  )
}
