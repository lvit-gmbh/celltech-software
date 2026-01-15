"use client"

import { useState, useEffect, useMemo } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
// Using native table elements for sticky header support
import { Button } from "@/components/ui/button"
import { Check, Filter, Download, RefreshCw, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Order } from "@/types"
import { fetchOrders, fetchDealersForMapping, deleteOrder } from "@/lib/supabase/queries"
import { OrderFilterDialog, type FilterRule, type FilterField, type FilterOperator } from "./order-filter-dialog"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toggleSortingThreeStates, getColumnSortState } from "@/lib/table-sorting"

const createColumns = (
  sorting: SortingState,
  setSorting: (sorting: SortingState | ((prev: SortingState) => SortingState)) => void,
  dealers: Record<number, string>,
  modelLabels: Record<string, string>,
  onDelete: (order: Order) => void
): ColumnDef<Order>[] => [
  {
    accessorKey: "number",
    header: ({ column }) => {
      const sortState = getColumnSortState("number", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("number", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          <span className="text-xs">Number</span>
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
      const order = row.original
      const assetNo = order.asset_no && order.asset_no > 0 ? order.asset_no : null
      const po = order.po && order.po.trim() !== "" ? order.po : null
      
      // Always show both lines - use "null" if data is missing
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            AST #{assetNo !== null ? assetNo : "null"}
          </span>
          <span className="text-sm text-foreground">
            PO #{po !== null ? po : "null"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "dealer_id",
    header: ({ column }) => {
      const sortState = getColumnSortState("dealer_id", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("dealer_id", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Dealer
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
      const order = row.original
      const dealerIdValue = order.dealer_id
      
      // Skip if dealer_id is null, undefined, or 0 (invalid)
      if (dealerIdValue === null || dealerIdValue === undefined || dealerIdValue === 0) {
        return null
      }
      
      // Look up dealer name from dealers map
      // dealer_id from order should match id from dealers table
      let dealerName: string | undefined
      
      // Try as number first (most common case)
      if (typeof dealerIdValue === 'number' && dealerIdValue > 0) {
        dealerName = dealers[dealerIdValue]
      } else if (typeof dealerIdValue === 'string') {
        const numId = parseInt(dealerIdValue, 10)
        if (!isNaN(numId) && numId > 0) {
          dealerName = dealers[numId]
        }
      } else {
        const numId = Number(dealerIdValue)
        if (!isNaN(numId) && numId > 0) {
          dealerName = dealers[numId]
        }
      }
      
      if (dealerName) {
        return <span className="text-xs text-foreground">{dealerName}</span>
      }
      
      // If no name found, return null (don't show ID)
      return null
    },
  },
  {
    accessorKey: "shipment_id",
    header: ({ column }) => {
      const sortState = getColumnSortState("shipment_id", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("shipment_id", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Shipment
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
      const shipmentId = row.getValue("shipment_id") as string | null
      if (!shipmentId) {
        return null
      }
      return (
        <span 
          className="inline-flex items-center justify-center rounded-full text-xs font-medium text-white shadow-sm [text-shadow:0_0_8px_rgba(255,255,255,0.3)]"
          style={{ backgroundColor: '#336699', padding: '0px 8px' }}
        >
          {shipmentId}
        </span>
      )
    },
  },
  {
    accessorKey: "model",
    header: ({ column }) => {
      const sortState = getColumnSortState("model", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("model", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Model
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
      const modelValue = row.getValue("model") as string
      if (!modelValue) return null
      // Look up model label from modelLabels map, fallback to model value if not found
      const modelLabel = modelLabels[String(modelValue)] || modelValue
      return <span className="text-xs text-foreground">{modelLabel}</span>
    },
  },
  {
    accessorKey: "order_date",
    header: ({ column }) => {
      const sortState = getColumnSortState("order_date", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("order_date", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Order date
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
      const date = row.getValue("order_date") as string | null
      if (!date) return null
      return (
        <span className="text-sm text-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
  },
  {
    accessorKey: "fin_date",
    header: ({ column }) => {
      const sortState = getColumnSortState("fin_date", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("fin_date", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Fin date
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
      const date = row.getValue("fin_date") as string | null
      if (!date) return null
      return (
        <span className="text-sm text-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
  },
  {
    accessorKey: "options",
    header: ({ column }) => {
      const sortState = getColumnSortState("options", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("options", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          # Options
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
      const order = row.original
      // Calculate options count from available fields
      let count = 0
      if (order.gas_tank) count++
      if (order.side_door) count++
      if (order.beavertail) count++
      if (order.spare_tire) count++
      return <span className="text-sm text-foreground">{count}</span>
    },
  },
  {
    accessorKey: "customOptions",
    header: "Custom Options",
    cell: ({ row }) => {
      const order = row.original
      const hasCustom = !!(order.notes || order.build_notes || order.description)
      if (!hasCustom) return null
      return <Check className="h-4 w-4 text-blue-600" />
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      const sortState = getColumnSortState("price", sorting)
      return (
        <Button
          variant="ghost"
          onClick={() => toggleSortingThreeStates("price", sorting, setSorting)}
          className="h-auto p-0 font-medium hover:bg-transparent group"
        >
          Price
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
      const price = row.getValue("price") as number
      return (
        <span className="text-xs font-medium text-foreground">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
          }).format(price)}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const order = row.original
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
                    window.open(`/trailer-orders/${order.id}`, "_blank")
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
                    onDelete(order)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-red-600 text-white border-red-600">
                <p>Delete Order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
]

// Placeholder data removed - using Supabase data only

interface OrderBookTableProps {
  brightviewFilter?: boolean
  searchQuery?: string
  showClosed?: boolean
}

export function OrderBookTable({ brightviewFilter, searchQuery, showClosed }: OrderBookTableProps) {
  const [data, setData] = useState<Order[]>([])
  const [allData, setAllData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [dealers, setDealers] = useState<Record<number, string>>({})
  const [modelLabels, setModelLabels] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  const handleDelete = async (order: Order) => {
    if (!confirm(`Are you sure you want to delete order #${order.asset_no || order.po || order.id}?`)) {
      return
    }
    
    setDeletingId(order.id)
    try {
      await deleteOrder(order.id)
      setData((prev) => prev.filter((o) => o.id !== order.id))
      setAllData((prev) => prev.filter((o) => o.id !== order.id))
      setTotalCount((prev) => prev - 1)
    } catch (error) {
      console.error("Failed to delete order:", error)
      alert("Failed to delete order. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const applyFilter = (order: Order, rule: FilterRule, dealersMap: Record<number, string>): boolean => {
    const { field, operator, value } = rule
    const filterValue = value.toLowerCase().trim()

    let orderValue: string | number | null = null

    switch (field) {
      case "number":
        orderValue = order.asset_no?.toString() || order.po || ""
        break
      case "dealer":
        const dealerId = parseInt(value, 10)
        orderValue = order.dealer_id === dealerId ? dealersMap[order.dealer_id] || "" : ""
        break
      case "model":
        orderValue = order.model || ""
        break
      case "order_date":
        orderValue = order.order_date || ""
        break
      case "fin_date":
        orderValue = order.fin_date || ""
        break
      case "price":
        orderValue = order.price || 0
        break
      case "po":
        orderValue = order.po || ""
        break
      case "vin_num":
        orderValue = order.vin_num || ""
        break
      case "shipment_id":
        orderValue = order.shipment_id?.toString() || ""
        break
    }

    if (orderValue === null || orderValue === "") {
      return false
    }

    const orderValueStr = String(orderValue).toLowerCase()
    const filterValueNum = parseFloat(filterValue)

    switch (operator) {
      case "equals":
        return orderValueStr === filterValue
      case "not_equals":
        return orderValueStr !== filterValue
      case "includes":
        return orderValueStr.includes(filterValue)
      case "not_includes":
        return !orderValueStr.includes(filterValue)
      case "greater_than":
        if (typeof orderValue === "number") {
          return orderValue > filterValueNum
        }
        return orderValueStr > filterValue
      case "less_than":
        if (typeof orderValue === "number") {
          return orderValue < filterValueNum
        }
        return orderValueStr < filterValue
      case "greater_equal":
        if (typeof orderValue === "number") {
          return orderValue >= filterValueNum
        }
        return orderValueStr >= filterValue
      case "less_equal":
        if (typeof orderValue === "number") {
          return orderValue <= filterValueNum
        }
        return orderValueStr <= filterValue
      default:
        return true
    }
  }

  const applyFilters = (orders: Order[], filters: FilterRule[], dealersMap: Record<number, string>): Order[] => {
    if (filters.length === 0) {
      return orders
    }

    return orders.filter((order) => {
      let result = true
      let lastLogic: "and" | "or" = "and"

      for (let i = 0; i < filters.length; i++) {
        const rule = filters[i]
        const ruleResult = applyFilter(order, rule, dealersMap)

        if (i === 0) {
          result = ruleResult
        } else {
          if (lastLogic === "and") {
            result = result && ruleResult
          } else {
            result = result || ruleResult
          }
        }

        lastLogic = rule.logic || "and"
      }

      return result
    })
  }

  const handleExportCSV = () => {
    const headers = [
      "Number",
      "Dealer",
      "Shipment",
      "Model",
      "Order Date",
      "Fin Date",
      "# Options",
      "Custom Options",
      "Price",
    ]

    const rows = data.map((order) => {
      const dealerName = dealers[order.dealer_id] || ""
      const assetNo = order.asset_no && order.asset_no > 0 ? order.asset_no : ""
      const po = order.po && order.po.trim() !== "" ? order.po : ""
      const number = `AST #${assetNo}, PO #${po}`
      const hasCustom = !!(order.notes || order.build_notes || order.description)
      const optionsCount = [
        order.gas_tank,
        order.side_door,
        order.beavertail,
        order.spare_tire,
      ].filter(Boolean).length

      return [
        number,
        dealerName,
        order.shipment_id || "",
        order.model || "",
        order.order_date ? new Date(order.order_date).toLocaleDateString() : "",
        order.fin_date ? new Date(order.fin_date).toLocaleDateString() : "",
        optionsCount.toString(),
        hasCustom ? "Yes" : "No",
        order.price ? order.price.toFixed(2) : "0.00",
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
    link.setAttribute("download", `trailer-orders-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = () => {
    setPagination({ pageIndex: 0, pageSize: 25 })
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load dealers, orders, and model labels in parallel
        const [dealersList, orders] = await Promise.all([
          fetchDealersForMapping(),
          fetchOrders(brightviewFilter)
        ])

        // Build dealers map - map dealer id to dealer name
        // dealersList has { id: number, name: string } structure
        const dealersMap: Record<number, string> = {}
        dealersList.forEach((dealer: { id: number; name: string }) => {
          // Ensure ID is a valid number and name exists
          const dealerId = typeof dealer.id === 'number' ? dealer.id : parseInt(String(dealer.id), 10)
          if (!isNaN(dealerId) && dealerId > 0 && dealer.name) {
            dealersMap[dealerId] = dealer.name
          }
        })
        
        setDealers(dealersMap)

        // Load model labels from div_frontend_options
        try {
          const supabase = getSupabaseClient()
          const { data: modelOptions, error: modelError } = await supabase
            .from("div_frontend_options")
            .select("value, label")
            .eq("type", "Model")
          
          if (!modelError && modelOptions) {
            const modelLabelsMap: Record<string, string> = {}
            modelOptions.forEach((opt: any) => {
              modelLabelsMap[String(opt.value)] = opt.label || ""
            })
            setModelLabels(modelLabelsMap)
          }
        } catch (e) {
          console.warn("Could not load model labels:", e)
        }

        let filteredOrders = orders
        
        // Apply search filter if provided
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filteredOrders = filteredOrders.filter((order) => {
            const dealerName = dealersMap[order.dealer_id]?.toLowerCase() || ""
            return (
              order.po?.toLowerCase().includes(query) ||
              order.model?.toLowerCase().includes(query) ||
              order.vin_num?.toLowerCase().includes(query) ||
              order.description?.toLowerCase().includes(query) ||
              order.requested_by?.toLowerCase().includes(query) ||
              order.asset_no?.toString().includes(query) ||
              dealerName.includes(query)
            )
          })
        }
        
        // Apply closed orders filter
        if (showClosed === false) {
          filteredOrders = filteredOrders.filter((order) => !order.fin_date)
        }

        // Apply custom filters
        if (activeFilters.length > 0) {
          filteredOrders = applyFilters(filteredOrders, activeFilters, dealersMap)
        }
        
        setAllData(orders)
        setData(filteredOrders)
        setTotalCount(filteredOrders.length)
      } catch (error) {
        setData([])
        setAllData([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [brightviewFilter, searchQuery, showClosed, activeFilters, refreshKey])

  const columns = useMemo(() => {
    const cols = createColumns(sorting, setSorting, dealers, modelLabels, handleDelete)
    return cols
  }, [sorting, setSorting, dealers, modelLabels, handleDelete])

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
    // Force re-render when columns change
    manualPagination: false,
  })

  const totalPages = Math.ceil(totalCount / pagination.pageSize)
  const currentPage = pagination.pageIndex + 1
  const startRow = pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  )

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 5,
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border shadow-none overflow-hidden">
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border shadow-none flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
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
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="group border-b transition-colors hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-1.5 px-4 align-middle">
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
      <div className="flex-shrink-0 flex items-center gap-4 border-t pt-4 mt-4">
        <div className="text-sm text-foreground min-w-[200px]">
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
                const isActive = page === currentPage
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
          <OrderFilterDialog
            open={filterDialogOpen}
            onOpenChange={setFilterDialogOpen}
            onApply={setActiveFilters}
            dealers={dealers}
          />
          <Button
            variant="ghost"
            size="icon"
            title="Filter"
            className="text-foreground"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Download"
            className="text-foreground"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Refresh"
            className="text-foreground"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

