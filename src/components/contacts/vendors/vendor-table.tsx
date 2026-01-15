"use client"

import { useState, useEffect } from "react"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Trash2 } from "lucide-react"
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
import type { Vendor } from "@/types"
import { fetchVendors, deleteVendor } from "@/lib/supabase/queries"
import { usePagination } from "@/hooks/use-pagination"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

const createColumns = (onDelete: (vendor: Vendor) => void): ColumnDef<Vendor>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Name</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
          ) : (
            <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "contactData",
    header: "Contact Data",
    cell: ({ row }) => {
      const vendor = row.original
      const email = vendor.mail
      const phone = vendor.phone

      if (!email && !phone) {
        return <span className="text-sm">-</span>
      }

      return (
        <div className="flex flex-col gap-1.5">
          {email && (
            <a
              href={`mailto:${email}`}
              className="group flex items-center gap-1.5 text-xs text-foreground rounded-md px-2 py-1 -mx-2 -my-0.5 transition-all duration-200 hover:bg-primary/10 hover:text-primary active:bg-primary/20"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              <span className="truncate">{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="group flex items-center gap-1.5 text-xs text-foreground rounded-md px-2 py-1 -mx-2 -my-0.5 transition-all duration-200 hover:bg-primary/10 hover:text-primary active:bg-primary/20"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              <span>{phone}</span>
            </a>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium hover:bg-transparent group"
      >
        Address
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
        ) : (
          <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("address") || "-"}</span>
    ),
  },
  {
    accessorKey: "zipCode",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium hover:bg-transparent group"
      >
        Zip code
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
        ) : (
          <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("zipCode")}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const vendor = row.original
      return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-red-500/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(vendor)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-red-600 text-white border-red-600">
                <p>Delete Vendor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
]

// Placeholder data
const placeholderData: Vendor[] = [
  {
    id: "1",
    name: "Aluminum Line Products Co. (ALPCO)",
    contactData: "chearns@aluminumline.com",
    address: "Dept 781557 PO Box 78000 Detroit, MI",
    zipCode: "48278",
  },
  {
    id: "2",
    name: "Amazon",
    contactData: "",
    address: "",
    zipCode: "",
  },
  {
    id: "3",
    name: "AMERICAN BOLT & SCREWS",
    contactData: "JuanF@absfasteners.com",
    address: "P.O. Box 31001-3474 Pasedena, CA",
    zipCode: "91110-3474",
  },
  {
    id: "4",
    name: "Austin Hardware & Supply Inc.",
    contactData: "tx.orders@austinhardware.com, bedmunds@austinhardware.com (816) 246-2800",
    address: "950 NW Technology Drive Lee's Summit, MO",
    zipCode: "64086-5692",
  },
  {
    id: "5",
    name: "B2B Supply",
    contactData: "(972) 865-7518",
    address: "1233 Regal Row Dallas, TX",
    zipCode: "75247",
  },
  {
    id: "6",
    name: "CellTech Metals, Inc.",
    contactData: "admin@celltechmetals.com",
    address: "900 Schroeder Dr. Waco, TX",
    zipCode: "76710",
  },
]

export function VendorTable() {
  const [data, setData] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendor.name}"?`)) {
      return
    }
    
    setDeletingId(vendor.id)
    try {
      await deleteVendor(vendor.id)
      setData((prev) => prev.filter((v) => v.id !== vendor.id))
    } catch (error) {
      console.error("Failed to delete vendor:", error)
      alert("Failed to delete vendor. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const vendors = await fetchVendors()
        setData(vendors || [])
      } catch (error) {
        console.error("Error loading vendors:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const columns = createColumns(handleDelete)

  const table = useReactTable({
    data,
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
      <div className="rounded-lg border shadow-none overflow-hidden">
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
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="group border-b transition-colors hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => {
                      const isActionsColumn = cell.column.id === "actions"
                      return (
                        <td
                          key={cell.id}
                          className={`py-1.5 px-4 ${isActionsColumn ? "align-middle" : "align-top"}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      )
                    })}
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

