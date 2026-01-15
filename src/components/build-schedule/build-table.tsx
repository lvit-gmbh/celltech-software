"use client"

import { useState, useEffect, useMemo } from "react"
import type { ColumnDef, PaginationState, Row, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GripVertical, CalendarX, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { BuildSchedule } from "@/types"
import { fetchBuildSchedule, updateBuildScheduleOrder } from "@/lib/supabase/queries"
import type { DateRange } from "react-day-picker"
import { usePagination } from "@/hooks/use-pagination"
import { toggleSortingThreeStates, getColumnSortState } from "@/lib/table-sorting"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers"

// Day colors for visual differentiation
const dayColors: Record<string, string> = {
  Mon: "bg-rose-500",
  Tue: "bg-amber-500",
  Wed: "bg-emerald-500",
  Thu: "bg-sky-500",
  Fri: "bg-violet-500",
  Sat: "bg-slate-500",
  Sun: "bg-orange-500",
}

// Status colors
const statusColors: Record<string, string> = {
  SHIPPED: "bg-emerald-600 text-white",
  SCHEDULED: "bg-blue-500 text-white",
  "IN PROGRESS": "bg-amber-500 text-white",
  PENDING: "bg-slate-500 text-white",
  WELDED: "bg-indigo-600 text-white",
  ZINK: "bg-zinc-600 text-white",
  RETURNED: "bg-red-500 text-white",
  ASSEMBLED: "bg-teal-600 text-white",
  WIRE: "bg-purple-600 text-white",
  FLOOR: "bg-amber-600 text-white",
  MOUNTING: "bg-cyan-600 text-white",
  ROOF: "bg-lime-600 text-white",
  TRIM: "bg-pink-600 text-white",
  "FINAL / QC": "bg-emerald-700 text-white",
}

// Drag Handle Component
function DragHandle({ listeners, attributes, isDragging }: { listeners: any; attributes: any; isDragging: boolean }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-center w-8 h-8 rounded-md 
        hover:bg-muted/80 cursor-grab active:cursor-grabbing 
        transition-colors touch-none select-none
        ${isDragging ? "cursor-grabbing bg-primary/10" : ""}
      `}
    >
      <GripVertical className={`h-4 w-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
    </button>
  )
}

// Sortable Row Component
interface SortableRowProps {
  row: Row<BuildSchedule>
  index: number
  onTraveler: (item: BuildSchedule) => void
  onUnschedule: (item: BuildSchedule) => void
  isSortingActive: boolean
}

function SortableRow({ row, index, onTraveler, onUnschedule, isSortingActive }: SortableRowProps) {
  // Ensure unique ID - use index as fallback
  const uniqueId = row.original.id || `row-${index}`
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: uniqueId,
    disabled: isSortingActive, // Disable drag & drop when sorting is active
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition, // Nur wenn nicht gezogen
    zIndex: isDragging ? 100 : 1,
    position: isDragging ? "relative" : "static",
  }

  const rowBg = index % 2 === 0 ? "bg-emerald-50/30 dark:bg-emerald-950/10" : "bg-background"

  return (
    <tr
      ref={setNodeRef}
      style={style}
      data-row-id={row.original.id}
      className={`
        ${isDragging ? "bg-card shadow-xl ring-2 ring-primary/30 rounded-lg" : rowBg} 
        ${!isDragging ? "hover:bg-muted/50" : ""}
        ${!isDragging ? "transition-all duration-150" : ""}
        border-b group
      `}
    >
      {/* Drag Handle Cell */}
      <td className="py-2.5 px-2 align-middle w-10">
        {isSortingActive ? (
          <div className="flex items-center justify-center w-8 h-8">
            <GripVertical className="h-4 w-4 text-muted-foreground/30" />
          </div>
        ) : (
          <DragHandle listeners={listeners} attributes={attributes} isDragging={isDragging} />
        )}
      </td>
      
      {/* Data Cells */}
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === "drag-handle") return null
        if (cell.column.id === "actions") {
          return (
            <td key={cell.id} className="py-2 px-3 align-middle">
              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/25"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTraveler(row.original)
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Traveler</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-blue-600 text-white border-blue-600">
                      <p>Traveler</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-500/25"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnschedule(row.original)
                        }}
                      >
                        <CalendarX className="h-4 w-4" />
                        <span className="sr-only">Unschedule</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-orange-600 text-white border-orange-600">
                      <p>Unschedule</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </td>
          )
        }
        return (
          <td key={cell.id} className="py-2 px-3 align-middle">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        )
      })}
    </tr>
  )
}

interface BuildScheduleTableProps {
  searchQuery?: string
  dateRange?: DateRange
  showFinished?: boolean
  activeTab?: string
}

export function BuildScheduleTable({ 
  searchQuery = "", 
  dateRange,
  showFinished = true,
  activeTab = "all"
}: BuildScheduleTableProps) {
  const [data, setData] = useState<BuildSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Erhöht für bessere Kontrolle
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter data
  // If column sorting is active, don't preserve sort_order order
  // If no column sorting, preserve the original sort_order order from database
  const filteredData = useMemo(() => {
    let filtered = data

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        item.orderAsset?.toLowerCase().includes(query) ||
        item.frame?.toLowerCase().includes(query) ||
        item.dealer?.toLowerCase().includes(query) ||
        item.vin?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query)
      )
    }

    if (dateRange?.from) {
      const from = dateRange.from
      const to = dateRange.to || from
      
      filtered = filtered.filter((item) => {
        if (!item.startDate) return false
        try {
          const itemDate = new Date(item.startDate)
          return itemDate >= from && itemDate <= to
        } catch {
          return false
        }
      })
    }

    if (!showFinished) {
      filtered = filtered.filter((item) => 
        item.status?.toUpperCase() !== "SHIPPED"
      )
    }

    // If column sorting is active, return filtered data as-is
    // TanStack Table will apply column sorting
    // If no column sorting, data is already sorted by sort_order from database
    return filtered
  }, [data, searchQuery, dateRange, showFinished, sorting])

  // Get the item IDs for SortableContext from sorted rows
  // Only enable drag & drop when no sorting is active
  const itemIds = useMemo(() => {
    // If sorting is active, disable drag & drop by returning empty array
    if (sorting.length > 0) {
      return []
    }
    
    // Use filteredData when no sorting, but we need to ensure IDs match the actual rows
    const ids = filteredData.map((item, index) => {
      // Ensure each ID is unique - use index as fallback if ID is empty or duplicate
      const baseId = item.id || `row-${index}`
      return baseId
    })
    
    // Check for duplicates and make them unique
    const uniqueIds: string[] = []
    const seen = new Set<string>()
    
    ids.forEach((id, index) => {
      let uniqueId = id
      let counter = 0
      while (seen.has(uniqueId)) {
        counter++
        uniqueId = `${id}-${counter}`
      }
      seen.add(uniqueId)
      uniqueIds.push(uniqueId)
    })
    
    return uniqueIds
  }, [filteredData, sorting])

  // Drag end handler - only works when no sorting is active
  const handleDragEnd = async (event: DragEndEvent) => {
    // Disable drag & drop when sorting is active
    if (sorting.length > 0) {
      return
    }

    const { active, over } = event

    if (over && active.id !== over.id) {
      // Find indices in filteredData first
      const activeIndexInFiltered = itemIds.findIndex((id) => id === active.id)
      const overIndexInFiltered = itemIds.findIndex((id) => id === over.id)

      if (activeIndexInFiltered === -1 || overIndexInFiltered === -1) {
        return
      }

      // Get the actual items from filteredData
      const activeItem = filteredData[activeIndexInFiltered]
      const overItem = filteredData[overIndexInFiltered]

      if (!activeItem || !overItem) {
        return
      }

      setData((items) => {
        // Find indices in the full data array
        const oldIndex = items.findIndex((item) => item.id === activeItem.id)
        const newIndex = items.findIndex((item) => item.id === overItem.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex)
          
          // Save new order to backend
          setSaving(true)
          const updates = newItems.map((item, index) => ({
            id: item.id,
            sortOrder: index + 1,
          }))
          
          updateBuildScheduleOrder(updates)
            .then((success) => {
              if (success) {
                console.log("Build schedule order saved successfully")
              } else {
                console.error("Failed to save build schedule order")
                // Optionally: show error toast/notification to user
              }
            })
            .catch((error) => {
              console.error("Error saving build schedule order:", error)
            })
            .finally(() => {
              setSaving(false)
            })
          
          return newItems
        }
        return items
      })
    }
  }

  const handleTraveler = (item: BuildSchedule) => {
    console.log("Traveler clicked for:", item)
    // TODO: Implement Traveler functionality
  }

  const handleUnschedule = (item: BuildSchedule) => {
    console.log("Unschedule clicked for:", item)
    // TODO: Implement Unschedule functionality
  }

  // Column definitions - must be memoized to update when sorting changes
  const columns: ColumnDef<BuildSchedule>[] = useMemo(() => [
    {
      id: "drag-handle",
      header: "",
      size: 40,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => {
        const sortState = getColumnSortState("startDate", sorting)
        return (
          <Button
            variant="ghost"
            onClick={() => toggleSortingThreeStates("startDate", sorting, setSorting)}
            className="h-auto p-0 font-medium hover:bg-transparent group"
          >
            <span className="text-xs">Start Date</span>
            {sortState === "asc" ? (
              <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
            ) : sortState === "desc" ? (
              <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateStr = row.getValue("startDate") as string
        if (!dateStr) return <span className="text-sm text-muted-foreground">-</span>
        
        try {
          const date = new Date(dateStr)
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
          const formattedDate = date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })
          const dayColor = dayColors[dayName] || "bg-slate-400"
          
          return (
            <div className="flex items-center gap-2">
              <Badge className={`${dayColor} text-white text-xs px-2`}>{dayName}</Badge>
              <span className="text-xs">{formattedDate}</span>
            </div>
          )
        } catch {
          return <span className="text-sm">{dateStr}</span>
        }
      },
    },
    {
      accessorKey: "orderAsset",
      header: ({ column }) => {
        const sortState = getColumnSortState("orderAsset", sorting)
        return (
          <Button
            variant="ghost"
            onClick={() => toggleSortingThreeStates("orderAsset", sorting, setSorting)}
            className="h-auto p-0 font-medium hover:bg-transparent group"
          >
            <span className="text-xs">Order/Asset</span>
            {sortState === "asc" ? (
              <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
            ) : sortState === "desc" ? (
              <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("orderAsset") || "-"}</span>
      ),
    },
    {
      accessorKey: "frame",
      header: "Frame",
      cell: ({ row }) => {
        const frame = row.getValue("frame") as string
        return frame ? (
          <Badge className="bg-slate-600 text-white">{frame}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "door",
      header: "Door",
      cell: ({ row }) => {
        const door = row.getValue("door") as string
        return door ? (
          <Badge className="bg-violet-600 text-white">{door}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "height",
      header: "Height",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("height") || "-"}</span>
      ),
    },
    {
      accessorKey: "dealer",
      header: ({ column }) => {
        const sortState = getColumnSortState("dealer", sorting)
        return (
          <Button
            variant="ghost"
            onClick={() => toggleSortingThreeStates("dealer", sorting, setSorting)}
            className="h-auto p-0 font-medium hover:bg-transparent group"
          >
            <span className="text-xs">Dealer</span>
            {sortState === "asc" ? (
              <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
            ) : sortState === "desc" ? (
              <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("dealer") || "-"}</span>
      ),
    },
    {
      accessorKey: "vin",
      header: ({ column }) => {
        const sortState = getColumnSortState("vin", sorting)
        return (
          <Button
            variant="ghost"
            onClick={() => toggleSortingThreeStates("vin", sorting, setSorting)}
            className="h-auto p-0 font-medium hover:bg-transparent group"
          >
            <span className="text-xs">VIN</span>
            {sortState === "asc" ? (
              <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
            ) : sortState === "desc" ? (
              <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("vin") || "-"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        const sortState = getColumnSortState("status", sorting)
        return (
          <Button
            variant="ghost"
            onClick={() => toggleSortingThreeStates("status", sorting, setSorting)}
            className="h-auto p-0 font-medium hover:bg-transparent group"
          >
            <span className="text-xs">Status</span>
            {sortState === "asc" ? (
              <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
            ) : sortState === "desc" ? (
              <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        if (!status) return <span className="text-sm text-muted-foreground">-</span>
        
        const statusUpper = status.toUpperCase()
        const colorClass = statusColors[statusUpper] || statusColors.PENDING
        
        return <Badge className={colorClass}>{status}</Badge>
      },
    },
    {
      accessorKey: "buildNotes",
      header: "Build notes",
      cell: ({ row }) => {
        const notes = row.getValue("buildNotes") as string
        return (
          <Input
            placeholder="Enter notes..."
            className="w-32 h-7 text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            defaultValue={notes || ""}
            onClick={(e) => e.stopPropagation()}
          />
        )
      },
    },
    {
      id: "actions",
      header: "",
    },
  ], [sorting, setSorting])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const schedule = await fetchBuildSchedule()
        if (schedule && schedule.length > 0) {
          setData(schedule)
        } else {
          setData([])
        }
      } catch (error) {
        console.error("Error loading build schedule:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Initialize table with columns and sorted data
  // When column sorting is active, use getSortedRowModel
  // When no column sorting, data is already sorted by sort_order from database
  const tableWithColumns = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
    getRowId: (row, index) => row.id || `row-${index}`,
    manualSorting: false, // Enable automatic sorting
    // Only apply sorting when sorting state is not empty
    enableSorting: true,
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: tableWithColumns.getState().pagination.pageIndex + 1,
    totalPages: tableWithColumns.getPageCount(),
    paginationItemsToDisplay: 5,
  })

  const totalCount = filteredData.length
  const startRow = pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  )

  if (loading) {
    return (
      <div className="rounded-lg border shadow-none overflow-hidden">
        <div className="p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <div className="overflow-hidden rounded-lg border shadow-none flex flex-col h-[calc(100vh-300px)]">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
                {tableWithColumns.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    <th className="h-9 px-2 w-10 text-left align-middle font-medium text-muted-foreground bg-background border-b"></th>
                    {headerGroup.headers.map((header) => {
                      if (header.id === "drag-handle") return null
                      return (
                        <th
                          key={header.id}
                          className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <tbody className="[&_tr:last-child]:border-0">
                  {tableWithColumns.getRowModel().rows?.length ? (
                    tableWithColumns.getRowModel().rows.map((row, index) => {
                      // Ensure unique key for React
                      const uniqueKey = row.original.id || `row-${index}-${row.id}`
                      return (
                        <SortableRow
                          key={uniqueKey}
                          row={row}
                          index={index}
                          onTraveler={handleTraveler}
                          onUnschedule={handleUnschedule}
                          isSortingActive={sorting.length > 0}
                        />
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length + 1} className="h-24 text-center px-4">
                        No results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </div>
      </DndContext>

      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4 px-4">
        <div className="text-sm text-muted-foreground min-w-[200px] flex items-center gap-2">
          Showing {startRow}-{endRow} of {totalCount}
          {saving && (
            <span className="text-xs text-primary animate-pulse">Saving...</span>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => tableWithColumns.previousPage()}
                  disabled={!tableWithColumns.getCanPreviousPage()}
                />
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map((page) => {
                const isActive = page === tableWithColumns.getState().pagination.pageIndex + 1
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={isActive}
                      onClick={() => tableWithColumns.setPageIndex(page - 1)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => tableWithColumns.nextPage()}
                  disabled={!tableWithColumns.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="min-w-[200px]"></div>
      </div>
    </div>
  )
}
