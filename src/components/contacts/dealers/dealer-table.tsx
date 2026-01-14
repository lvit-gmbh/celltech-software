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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Check, Mail, Phone, Trash2 } from "lucide-react"
import type { Dealer } from "@/types"
import { fetchDealers, deleteDealer } from "@/lib/supabase/queries"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePagination } from "@/hooks/use-pagination"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const createColumns = (onDelete: (dealer: Dealer) => void): ColumnDef<Dealer>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "dealerContact",
    header: "Dealer",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("dealerContact") || "-"}</span>
    ),
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const dealer = row.original
      const email = dealer.mail
      const phone = dealer.phone

      if (!email && !phone) {
        return <span className="text-sm">-</span>
      }

      return (
        <div className="flex flex-col gap-1.5">
          {email && (
            <a
              href={`mailto:${email}`}
              className="group flex items-center gap-2 text-sm text-foreground rounded-md px-2 py-1.5 -mx-2 -my-0.5 transition-all duration-200 hover:bg-primary/10 hover:text-primary active:bg-primary/20"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
              <span className="truncate">{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="group flex items-center gap-2 text-sm text-foreground rounded-md px-2 py-1.5 -mx-2 -my-0.5 transition-all duration-200 hover:bg-primary/10 hover:text-primary active:bg-primary/20"
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
    accessorKey: "active",
    header: "Active",
    cell: ({ row }) =>
      row.getValue("active") ? (
        <div className="flex items-center justify-center">
          <Check className="h-4 w-4 text-blue-500" />
        </div>
      ) : null,
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("city") || "-"}</span>
    ),
  },
  {
    accessorKey: "zipCode",
    header: "Zip code",
    cell: ({ row }) => (
      <span className="text-sm bg-muted px-2 py-1 rounded">
        {row.getValue("zipCode")}
      </span>
    ),
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const discount = row.getValue("discount") as number | null
      return (
        <span className="text-sm">{discount !== null ? `${discount}%` : "-"}</span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const dealer = row.original
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
                    onDelete(dealer)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-red-600 text-white border-red-600">
                <p>Delete Dealer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
]

// Placeholder data
const placeholderData: Dealer[] = [
  {
    id: "1",
    name: "_Templates",
    dealerContact: "Owen Mossy",
    contact: "mr.mossy@gulfportnissan.com 228-864-0799",
    active: true,
    city: "Gulfport, MS",
    zipCode: "39503",
    discount: 0,
  },
  {
    id: "2",
    name: "228 Trailers",
    dealerContact: "Drake L. Chase",
    contact: "3Dtrailersales@gmail.com 563-503-1375",
    active: true,
    city: "Fulton, IL",
    zipCode: "61252",
    discount: 5,
  },
  {
    id: "3",
    name: "3D Trailers",
    dealerContact: "John Miller",
    contact: "sales@4statetrailers.com 918-676-5100",
    active: true,
    city: "Fairland, OK",
    zipCode: "74343",
    discount: null,
  },
  {
    id: "4",
    name: "4 State Trailers",
    dealerContact: "Nick Jameson",
    contact: "nick@51trailersales.com 608-889-1020",
    active: false,
    city: "Edger, WI",
    zipCode: "53534",
    discount: 0,
  },
  {
    id: "5",
    name: "51 Trailers",
    dealerContact: "Alan Pleus",
    contact: "pleuscab@pleuspoint.com 573-694-2744",
    active: true,
    city: "Jefferson City, MO",
    zipCode: "65101",
    discount: null,
  },
]

export function DealerTable() {
  const [data, setData] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const handleDelete = async (dealer: Dealer) => {
    if (!confirm(`Are you sure you want to delete dealer "${dealer.name}"?`)) {
      return
    }
    
    setDeletingId(dealer.id)
    try {
      await deleteDealer(dealer.id)
      setData((prev) => prev.filter((d) => d.id !== dealer.id))
    } catch (error) {
      console.error("Failed to delete dealer:", error)
      alert("Failed to delete dealer. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const dealers = await fetchDealers()
        setData(dealers || [])
      } catch (error) {
        console.error("Error loading dealers:", error)
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
      <div className="rounded-2xl border shadow-none">
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
      <div className="flex-1 overflow-hidden rounded-2xl border shadow-none">
        <div className="h-full overflow-auto">
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
                    {row.getVisibleCells().map((cell) => {
                      const isActiveColumn = cell.column.id === "active"
                      const isActionsColumn = cell.column.id === "actions"
                      return (
                        <td
                          key={cell.id}
                          className={`py-3 px-4 ${isActiveColumn || isActionsColumn ? "align-middle" : "align-top"}`}
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

