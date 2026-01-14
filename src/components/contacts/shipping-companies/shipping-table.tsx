"use client"

import { useState, useEffect } from "react"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { ShippingCompany } from "@/types"
import { fetchShippingCompanies, deleteShippingCompany } from "@/lib/supabase/queries"
import { usePagination } from "@/hooks/use-pagination"
import { Eye, Trash2 } from "lucide-react"

const createColumns = (onViewDetails: (company: ShippingCompany) => void, onDelete: (company: ShippingCompany) => void): ColumnDef<ShippingCompany>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("contact") || "-"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("phone") || "-"}</span>
    ),
  },
  {
    accessorKey: "area",
    header: "Area",
    cell: ({ row }) => {
      const area = row.getValue("area") as string | string[]
      // If null or empty array, show "All", otherwise show the array content
      const displayArea = (area == null || (Array.isArray(area) && area.length === 0))
        ? ["All"]
        : Array.isArray(area)
        ? area
        : [area]
      
      return (
        <div className="flex flex-wrap gap-1">
          {displayArea.map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-0 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              {item}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "minDistance",
    header: "Min distance",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("minDistance")}</span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("notes") || "-"}</span>
    ),
  },
  {
    accessorKey: "mail",
    header: "Mail",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("mail") || "-"}</span>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("state") || "-"}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const company = row.original
      return (
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
                    onViewDetails(company)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-blue-600 text-white border-blue-600">
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-red-500/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(company)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-red-600 text-white border-red-600">
                <p>Delete Shipping Company</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
]

// Placeholder data
const placeholderData: ShippingCompany[] = [
  {
    id: "1",
    name: "IMPORT",
    contact: "-",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: "Shipper Placeholder for shipped imported trailers.",
    mail: null,
    state: null,
  },
  {
    id: "2",
    name: "Nationwide",
    contact: "Kye",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: null,
    mail: null,
    state: null,
  },
  {
    id: "3",
    name: "Customer",
    contact: "Customer",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: null,
    mail: null,
    state: null,
  },
  {
    id: "4",
    name: "S&P Transport (Hector)",
    contact: "Hector",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: null,
    mail: null,
    state: null,
  },
  {
    id: "5",
    name: "ThruFaith LLC (Chris)",
    contact: "Chris",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: null,
    mail: null,
    state: null,
  },
  {
    id: "6",
    name: "G&L Transport (Gary)",
    contact: "Gary",
    phone: "",
    area: "All",
    minDistance: 0,
    notes: null,
    mail: null,
    state: null,
  },
]

export function ShippingCompaniesTable() {
  const [data, setData] = useState<ShippingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const companies = await fetchShippingCompanies()
        setData(companies || [])
      } catch (error) {
        console.error("Error loading shipping companies:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleViewDetails = (company: ShippingCompany) => {
    // Open in new tab
    window.open(`/contacts/shipping-companies/${company.id}`, '_blank')
  }

  const handleDelete = async (company: ShippingCompany) => {
    if (!confirm(`Are you sure you want to delete shipping company "${company.name}"?`)) {
      return
    }

    try {
      await deleteShippingCompany(company.id)
      // Reload data
      const companies = await fetchShippingCompanies()
      setData(companies || [])
    } catch (error) {
      console.error("Failed to delete shipping company:", error)
      alert("Failed to delete shipping company. Please try again.")
    }
  }

  const columns = createColumns(handleViewDetails, handleDelete)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  })

  const totalCount = data.length
  const startRow = pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  )

  if (loading) {
    return (
      <div className="rounded-2xl border shadow-none overflow-hidden">
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden rounded-2xl border shadow-none flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background border-b"
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
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="group border-b transition-colors hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4 align-middle">
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
                    className="h-24 text-center text-foreground px-4"
                  >
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4 px-4">
        <div className="text-sm text-muted-foreground min-w-[200px]">
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
        <div className="min-w-[200px]"></div>
      </div>
    </div>
  )
}

