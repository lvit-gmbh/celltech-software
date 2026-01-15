"use client"

import { useState, useEffect, useMemo } from "react"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { usePagination } from "@/hooks/use-pagination"
import type { BuildSchedule } from "@/types"
import { fetchBuildSchedule } from "@/lib/supabase/queries"
import { UnscheduledBuildsFilterDialog, type FilterRule } from "./unscheduled-builds-filter-dialog"

// Status colors matching the design
const statusColors: Record<string, string> = {
  SCHEDULE: "bg-slate-500 text-white",
  WELDED: "bg-emerald-600 text-white",
  SCHEDULED: "bg-blue-500 text-white",
  "IN PROGRESS": "bg-amber-500 text-white",
  PENDING: "bg-slate-500 text-white",
  SHIPPED: "bg-emerald-600 text-white",
}

// Placeholder data structure
interface UnscheduledBuild {
  id: string
  orderAsset: string
  model: string
  dealer: string
  status: string
  startDate: string
}

const createColumns = (): ColumnDef<UnscheduledBuild>[] => [
  {
    accessorKey: "orderAsset",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Order/Asset</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1.5 h-3 w-3" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1.5 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="text-xs font-medium">{row.getValue("orderAsset")}</span>
    ),
  },
  {
    accessorKey: "model",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium hover:bg-transparent -ml-3"
      >
        Model
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
        ) : (
          <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const model = row.getValue("model") as string
      return (
        <Badge variant="secondary" className="bg-slate-700 text-white border-0">
          {model}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dealer",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Dealer</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1.5 h-3 w-3" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1.5 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("dealer") || "-"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Status</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1.5 h-3 w-3" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1.5 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColor = statusColors[status] || "bg-slate-500 text-white"
      return (
        <Badge className={`${statusColor} border-0`}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Start date</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1.5 h-3 w-3" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1.5 h-3 w-3" />
          ) : (
            <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("startDate") as string
      // Format date as MM/DD/YY or show placeholder
      if (date && date !== "MM/DD/YY") {
        try {
          const dateObj = new Date(date)
          if (!isNaN(dateObj.getTime())) {
            return (
              <span className="text-xs">
                {dateObj.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                })}
              </span>
            )
          }
        } catch {
          // Fall through to placeholder
        }
      }
      return <span className="text-sm text-muted-foreground">MM/DD/YY</span>
    },
  },
]

// Placeholder data for demonstration
const placeholderData: UnscheduledBuild[] = [
  {
    id: "1",
    orderAsset: "#004478",
    model: "8518TA5-RP-B",
    dealer: "Dealer A",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "2",
    orderAsset: "#004479",
    model: "8516TA5-RP-G",
    dealer: "Dealer B",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
  {
    id: "3",
    orderAsset: "#004480",
    model: "8518TA5-RP-B",
    dealer: "Dealer C",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "4",
    orderAsset: "#004481",
    model: "8516TA5-RP-G",
    dealer: "Dealer A",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
  {
    id: "5",
    orderAsset: "#004482",
    model: "8518TA5-RP-B",
    dealer: "Dealer B",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "6",
    orderAsset: "#004483",
    model: "8516TA5-RP-G",
    dealer: "Dealer C",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
  {
    id: "7",
    orderAsset: "#004484",
    model: "8518TA5-RP-B",
    dealer: "Dealer A",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "8",
    orderAsset: "#004485",
    model: "8516TA5-RP-G",
    dealer: "Dealer B",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
  {
    id: "9",
    orderAsset: "#004486",
    model: "8518TA5-RP-B",
    dealer: "Dealer C",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "10",
    orderAsset: "#004487",
    model: "8516TA5-RP-G",
    dealer: "Dealer A",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
  {
    id: "11",
    orderAsset: "#004488",
    model: "8518TA5-RP-B",
    dealer: "Dealer B",
    status: "SCHEDULE",
    startDate: "MM/DD/YY",
  },
  {
    id: "12",
    orderAsset: "#004489",
    model: "8516TA5-RP-G",
    dealer: "Dealer C",
    status: "WELDED",
    startDate: "MM/DD/YY",
  },
]

interface UnscheduledBuildsTableProps {
  searchQuery?: string
}

export function UnscheduledBuildsTable({ searchQuery: externalSearchQuery }: UnscheduledBuildsTableProps) {
  const [data, setData] = useState<UnscheduledBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [internalSearchQuery, setInternalSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery ?? internalSearchQuery

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // TODO: Replace with actual unscheduled builds query
        // For now, using placeholder data
        // const builds = await fetchUnscheduledBuilds()
        // setData(builds || [])
        setData(placeholderData)
      } catch (error) {
        console.error("Error loading unscheduled builds:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshKey])

  const columns = useMemo(() => createColumns(), [])

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data
    }

    const query = searchQuery.toLowerCase()
    return data.filter((item) => {
      return (
        item.orderAsset.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.dealer.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      )
    })
  }, [data, searchQuery])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  })

  const totalCount = filteredData.length
  const startRow = pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  )

  const handleExportCSV = () => {
    const headers = [
      "Order/Asset",
      "Model",
      "Dealer",
      "Status",
      "Start date",
    ]

    const rows = filteredData.map((item) => {
      const formattedDate = item.startDate !== "MM/DD/YY" && item.startDate
        ? (() => {
            try {
              const dateObj = new Date(item.startDate)
              if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                })
              }
            } catch {
              // Fall through
            }
            return item.startDate
          })()
        : ""

      return [
        item.orderAsset,
        item.model,
        item.dealer || "",
        item.status,
        formattedDate,
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `unscheduled-builds-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = () => {
    setPagination({ pageIndex: 0, pageSize: 12 })
    setRefreshKey((prev) => prev + 1)
  }

  const handleFilter = () => {
    setFilterDialogOpen(true)
  }

  const handleApplyFilters = (filters: FilterRule[]) => {
    setActiveFilters(filters)
    setPagination({ pageIndex: 0, pageSize: 12 })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Skeleton className="h-10 w-full pl-10 rounded-lg" />
        </div>
        <div className="flex-1 rounded-2xl border shadow-none">
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <UnscheduledBuildsFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        onApply={handleApplyFilters}
      />
      <div className="flex flex-col gap-4 h-full">
        {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="h-10 pl-10 rounded-lg"
          value={searchQuery}
          onChange={(e) => {
            if (!externalSearchQuery) {
              setInternalSearchQuery(e.target.value)
            }
          }}
          disabled={!!externalSearchQuery}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border shadow-none h-[calc(100vh-300px)]">
        <div className="h-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-3 py-2 text-left align-middle font-medium text-muted-foreground bg-background border-b"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b transition-colors ${
                      index === 0
                        ? "bg-blue-50 dark:bg-blue-950/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-1.5 px-4 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground px-4"
                  >
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 px-4">
        <div className="text-sm text-muted-foreground min-w-[150px]">
          Showing {startRow}-{endRow} of {totalCount}
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map((page) => {
                const isActive = page === table.getState().pagination.pageIndex + 1
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={isActive}
                      onClick={() => table.setPageIndex(page - 1)}
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
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <Button
            variant="ghost"
            size="icon"
            title="Filter"
            className="h-8 w-8 text-foreground"
            onClick={handleFilter}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Download"
            className="h-8 w-8 text-foreground"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Refresh"
            className="h-8 w-8 text-foreground"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      </div>
    </>
  )
}
