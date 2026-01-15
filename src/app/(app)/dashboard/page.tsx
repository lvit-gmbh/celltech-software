"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { useUIStore } from "@/stores/ui-store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Printer, ChevronDown, ChevronRight, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { fetchDashboardData, fetchDealers, updateOrderVIN } from "@/lib/supabase/queries"
import { getOrderStatus, getStatusColor, getStatusLabel, getTrailerBuildSubStatusColor, type OrderStatus } from "@/lib/status-utils"
import type { Order } from "@/types"
import { getSupabaseClient } from "@/lib/supabase/client"

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Extended order with computed status
interface OrderWithStatus extends Order {
  computedStatus: OrderStatus
}

export default function DashboardPage() {
  const { activeTabs, setActiveTab } = useUIStore()
  const primaryTab = (activeTabs["dashboard-primary"] || "schedule") as OrderStatus
  const secondaryTab = activeTabs["dashboard-secondary"] || "all"
  const [searchQuery, setSearchQuery] = useState("")
  const [allOrders, setAllOrders] = useState<OrderWithStatus[]>([])
  const [dealers, setDealers] = useState<Record<number, string>>({})
  const [modelLabels, setModelLabels] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [editingVIN, setEditingVIN] = useState<number | null>(null)
  const [vinValue, setVinValue] = useState<string>("")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportTitle, setExportTitle] = useState<string>("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const secondaryTabs = [
    { value: "all", label: "All" },
    { value: "brightview", label: "BrightView" },
    { value: "standard", label: "Standard" },
  ]

  // Load all data once (always load all, filter later)
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        console.log("Loading dashboard data...")
        const [dealersList, orders] = await Promise.all([
          fetchDealers(),
          fetchDashboardData() // Always load all orders, filter by brightview later
        ])

        console.log(`Loaded ${dealersList.length} dealers and ${orders.length} orders`)

        // Build dealers map
        const dealersMap: Record<number, string> = {}
        dealersList.forEach((dealer: any) => {
          // Handle both string and number IDs
          const dealerId = typeof dealer.id === 'string' ? parseInt(dealer.id, 10) : dealer.id
          if (dealerId && !isNaN(dealerId)) {
            dealersMap[dealerId] = dealer.name || ""
          }
        })
        setDealers(dealersMap)
        console.log(`Built dealers map with ${Object.keys(dealersMap).length} entries`)

        // Load model labels from div_frontend_options (value -> label)
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

        // Map orders with computed status
        const ordersWithStatus = (orders as Order[]).map((order) => ({
          ...order,
          computedStatus: getOrderStatus(order),
        }))
        setAllOrders(ordersWithStatus)
        console.log(`Mapped ${ordersWithStatus.length} orders with status`)
        setError(null)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        console.error("Error details:", error)
        setAllOrders([])
        setError(error instanceof Error ? error.message : "Failed to load dashboard data. Please check your Supabase configuration.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, []) // Load once, don't reload when filter changes

  // Reset sorting when primary tab changes
  useEffect(() => {
    setSortColumn(null)
    setSortDirection(null)
  }, [primaryTab])

  // Memoized status counts - apply brightview filter for counts
  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      schedule: 0,
      welded: 0,
      zink: 0,
      returned: 0,
      assembled: 0,
      "trailer-build": 0,
      special: 0,
      "ready-to-ship": 0,
      shipped: 0,
    }
    
    // Filter orders by brightview if needed
    let ordersToCount = allOrders
    if (secondaryTab !== "all") {
      const isBrightView = secondaryTab === "brightview"
      ordersToCount = allOrders.filter((order) => order.brightview === isBrightView)
    }
    
    ordersToCount.forEach((order) => {
      counts[order.computedStatus]++
    })
    return counts
  }, [allOrders, secondaryTab])

  // Primary tabs with dynamic counts
  const primaryTabs = useMemo(() => [
    { value: "schedule" as OrderStatus, label: "Schedule", count: statusCounts.schedule },
    { value: "welded" as OrderStatus, label: "Welded", count: statusCounts.welded },
    { value: "zink" as OrderStatus, label: "Zink", count: statusCounts.zink },
    { value: "returned" as OrderStatus, label: "Returned", count: statusCounts.returned },
    { value: "assembled" as OrderStatus, label: "Assembled", count: statusCounts.assembled },
    { value: "trailer-build" as OrderStatus, label: "Trailer Build", count: statusCounts["trailer-build"] },
    { value: "special" as OrderStatus, label: "Special", count: statusCounts.special },
    { value: "ready-to-ship" as OrderStatus, label: "Ready to Ship", count: statusCounts["ready-to-ship"] },
    { value: "shipped" as OrderStatus, label: "Shipped", count: statusCounts.shipped },
  ], [statusCounts])

  // Handle column sorting
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }, [sortColumn, sortDirection])

  // Sort function
  const sortData = useCallback((data: OrderWithStatus[], column: string, direction: "asc" | "desc") => {
    const sorted = [...data].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (column) {
        case "dealer":
          aVal = dealers[a.dealer_id] || ""
          bVal = dealers[b.dealer_id] || ""
          break
        case "asset":
          aVal = a.asset_no ? String(a.asset_no) : a.po || ""
          bVal = b.asset_no ? String(b.asset_no) : b.po || ""
          break
        case "model":
          aVal = modelLabels[String(a.model)] || a.model || ""
          bVal = modelLabels[String(b.model)] || b.model || ""
          break
        case "vin":
          aVal = a.vin_num || ""
          bVal = b.vin_num || ""
          break
        case "shipDate":
          aVal = a.ship_date ? new Date(a.ship_date).getTime() : 0
          bVal = b.ship_date ? new Date(b.ship_date).getTime() : 0
          break
        case "finDate":
          aVal = a.fin_date ? new Date(a.fin_date).getTime() : 0
          bVal = b.fin_date ? new Date(b.fin_date).getTime() : 0
          break
        case "status":
          aVal = getStatusLabel(a.computedStatus)
          bVal = getStatusLabel(b.computedStatus)
          break
        default:
          return 0
      }

      // Compare values
      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [dealers, modelLabels])

  // Memoized filtered data by status and search
  const filteredData = useMemo(() => {
    let filtered = allOrders.filter((order) => order.computedStatus === primaryTab)

    // Apply brightview filter
    if (secondaryTab !== "all") {
      const isBrightView = secondaryTab === "brightview"
      filtered = filtered.filter((order) => order.brightview === isBrightView)
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter((order) => {
        return (
          order.po?.toLowerCase().includes(query) ||
          order.model?.toLowerCase().includes(query) ||
          order.vin_num?.toLowerCase().includes(query) ||
          dealers[order.dealer_id]?.toLowerCase().includes(query) ||
          order.asset_no?.toString().includes(query)
        )
      })
    }

    // Apply date range filter for shipped tab
    if (primaryTab === "shipped" && dateRange?.from) {
      filtered = filtered.filter((order) => {
        if (!order.fin_date) return false
        const orderDate = new Date(order.fin_date)
        const from = dateRange.from!
        const to = dateRange.to || from
        return orderDate >= from && orderDate <= to
      })
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = sortData(filtered, sortColumn, sortDirection)
    }

    return filtered
  }, [allOrders, primaryTab, debouncedSearchQuery, dealers, dateRange, sortColumn, sortDirection, sortData, secondaryTab])

  // Group data for Special tab
  const groupedSpecialData = useMemo(() => {
    if (primaryTab !== "special") return {}
    
    const groups: Record<string, OrderWithStatus[]> = {}
    filteredData.forEach((order) => {
      const groupKey = order.sequ ? String(order.sequ) : "NEED FIX"
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(order)
    })
    return groups
  }, [filteredData, primaryTab])

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }, [])

  const isGreenModel = (model: string | null | undefined) => model?.endsWith("-G") ?? false

  // Render model badge
  const renderModel = (model: string | null | undefined) => {
    if (!model) return <span className="text-xs text-foreground">-</span>
    const label = modelLabels[String(model)] || model
    if (isGreenModel(label)) {
      return <Badge className="bg-emerald-600 text-white">{label}</Badge>
    }
    return <span className="text-xs text-foreground">{label}</span>
  }

  // Handle VIN editing
  const handleVINClick = (orderId: number, currentVIN: string | null) => {
    setEditingVIN(orderId)
    setVinValue(currentVIN || "")
  }

  const handleVINSave = async (orderId: number) => {
    try {
      await updateOrderVIN(orderId, vinValue)
      // Update local state
      setAllOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, vin_num: vinValue } : order
        )
      )
      setEditingVIN(null)
      setVinValue("")
    } catch (error) {
      console.error("Error updating VIN:", error)
      alert("Failed to update VIN. Please try again.")
    }
  }

  const handleVINCancel = () => {
    setEditingVIN(null)
    setVinValue("")
  }

  // Render editable VIN cell content
  const renderEditableVIN = (order: OrderWithStatus) => {
    if (editingVIN === order.id) {
      return (
        <Input
          value={vinValue}
          onChange={(e) => setVinValue(e.target.value)}
          onBlur={() => handleVINSave(order.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleVINSave(order.id)
            } else if (e.key === "Escape") {
              handleVINCancel()
            }
          }}
          placeholder="Enter value"
          className="h-8 text-xs"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      )
    }
    return (
      <span
        className="text-xs text-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1 block"
        onClick={() => handleVINClick(order.id, order.vin_num)}
        title="Click to edit VIN"
      >
        {order.vin_num || <span className="text-muted-foreground/50">Enter value</span>}
      </span>
    )
  }

  // Render status select
  const renderStatusSelect = () => (
    <Select>
      <SelectTrigger className="h-auto w-full border-0 bg-transparent px-0 py-0 text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:ring-0 focus:ring-offset-0 shadow-none rounded-none [&>svg]:hidden">
        <SelectValue placeholder="select new status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="welded">Welded</SelectItem>
        <SelectItem value="zink">Zink</SelectItem>
        <SelectItem value="assembled">Assembled</SelectItem>
        <SelectItem value="trailer-build">Trailer Build</SelectItem>
        <SelectItem value="ready-to-ship">Ready to Ship</SelectItem>
        <SelectItem value="shipped">Shipped</SelectItem>
      </SelectContent>
    </Select>
  )

  // Render sortable column header
  const renderSortableHeader = useCallback((column: string, label: string) => {
    const isSorted = sortColumn === column
    const isAsc = sortDirection === "asc"
    const isDesc = sortDirection === "desc"

    return (
      <th 
        className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleSort(column)}
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
  }, [sortColumn, sortDirection, handleSort])

  // Render action button with tooltip
  const renderActionButton = () => (
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement increment status logic
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Increment trailer's status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  // Render table based on current tab
  const renderTable = () => {
    if (loading) {
      return (
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <p className="text-destructive mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-4">Please check the browser console for more details.</p>
        </div>
      )
    }

    // Schedule tab
    if (primaryTab === "schedule") {
      return (
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
            <tr className="border-b">
              {renderSortableHeader("dealer", "Dealer")}
              {renderSortableHeader("asset", "Asset/Order")}
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">BV</th>
              {renderSortableHeader("model", "Model")}
              {renderSortableHeader("vin", "VIN")}
              {renderSortableHeader("shipDate", "Ship Date")}
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b border-l">Move to Status</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {filteredData.length > 0 ? (
              filteredData.map((order) => (
                <tr key={order.id} className="group border-b transition-colors hover:bg-muted/50">
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{dealers[order.dealer_id] || "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{order.asset_no ? `#${order.asset_no}` : order.po ? `PO ${order.po}` : "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{order.brightview ? "BV" : ""}</span></td>
                  <td className="py-1.5 px-4 align-middle">{renderModel(order.model)}</td>
                  <td className="py-1.5 px-4 align-middle">{renderEditableVIN(order)}</td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">-</span></td>
                  <td className="py-1.5 px-4 align-middle border-l">
                    <div className="flex items-center gap-2">
                      {renderStatusSelect()}
                      {renderActionButton()}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="h-24 text-center px-4">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      )
    }

    // Special tab with collapsible groups
    if (primaryTab === "special") {
      const groupEntries = Object.entries(groupedSpecialData)
      return (
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
            <tr className="border-b">
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">Status</th>
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">Dealer ID</th>
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">Model</th>
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">VIN</th>
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b">Ship Date</th>
              <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b border-l">Move to Status</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {groupEntries.length > 0 ? (
              groupEntries.map(([groupKey, orders]) => {
                const isExpanded = expandedGroups.has(groupKey)
                return (
                  <React.Fragment key={groupKey}>
                    <tr 
                      className="cursor-pointer hover:bg-muted/50 bg-muted/20 border-b transition-colors"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <td colSpan={6} className="py-1.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <Badge className={getStatusColor("special")}>{groupKey}</Badge>
                          <span className="text-xs text-muted-foreground">({orders.length})</span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && orders.map((order) => (
                      <tr key={order.id} className="group border-b transition-colors hover:bg-muted/50">
                        <td className="py-1.5 px-4 align-middle"></td>
                        <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{dealers[order.dealer_id] || "STOCK"}</span></td>
                        <td className="py-1.5 px-4 align-middle">{renderModel(order.model)}</td>
                        <td className="py-1.5 px-4 align-middle">{renderEditableVIN(order)}</td>
                        <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">-</span></td>
                        <td className="py-1.5 px-4 align-middle border-l">
                          <div className="flex items-center gap-2">
                            {renderStatusSelect()}
                            {renderActionButton()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="h-24 text-center px-4">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      )
    }

    // Ready to Ship tab
    if (primaryTab === "ready-to-ship") {
      return (
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
            <tr className="border-b">
              {renderSortableHeader("dealer", "Dealer")}
              {renderSortableHeader("model", "Model")}
              {renderSortableHeader("vin", "VIN")}
              {renderSortableHeader("shipDate", "Ship Date")}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {filteredData.length > 0 ? (
              filteredData.map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{dealers[order.dealer_id] || "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle">{renderModel(order.model)}</td>
                  <td className="py-1.5 px-4 align-middle">{renderEditableVIN(order)}</td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">-</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="h-24 text-center px-4">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      )
    }

    // Shipped tab
    if (primaryTab === "shipped") {
      return (
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
            <tr className="border-b">
              {renderSortableHeader("dealer", "Dealer")}
              {renderSortableHeader("asset", "Asset/Order")}
              {renderSortableHeader("model", "Model")}
              {renderSortableHeader("vin", "VIN")}
              {renderSortableHeader("finDate", "Shipped on")}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {filteredData.length > 0 ? (
              filteredData.map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{dealers[order.dealer_id] || "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{order.asset_no ? `#${order.asset_no}` : order.po ? `PO ${order.po}` : "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle">{renderModel(order.model)}</td>
                  <td className="py-1.5 px-4 align-middle">{renderEditableVIN(order)}</td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-sm text-foreground">{order.fin_date ? new Date(order.fin_date).toLocaleDateString() : "-"}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="h-24 text-center px-4">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      )
    }

    // Welded, Zink, Returned, Assembled, Trailer Build tabs
    return (
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-20 bg-background [&_tr]:border-b">
          <tr className="border-b">
            {renderSortableHeader("status", "Status")}
            {renderSortableHeader("dealer", "Dealer")}
            {renderSortableHeader("asset", "Asset/Order")}
            {renderSortableHeader("model", "Model")}
            {renderSortableHeader("vin", "VIN")}
            {renderSortableHeader("shipDate", "Ship Date")}
            <th className="h-9 px-4 py-1.5 text-left align-middle font-medium text-muted-foreground bg-background border-b border-l">Move to Status</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {filteredData.length > 0 ? (
            filteredData.map((order) => {
              // For trailer-build, show meaningful status from sequ or use computed status
              let subStatus: string
              if (primaryTab === "trailer-build") {
                const sequStr = order.sequ ? String(order.sequ).toLowerCase() : ""
                // Map sequ values to readable status
                if (sequStr.includes("wire")) {
                  subStatus = "WIRE"
                } else if (sequStr.includes("floor")) {
                  subStatus = "FLOOR"
                } else if (sequStr.includes("mount")) {
                  subStatus = "MOUNT"
                } else if (sequStr && sequStr.length > 0 && !sequStr.match(/^\d+$/)) {
                  // If sequ is not just a number, use it (uppercase)
                  subStatus = sequStr.toUpperCase()
                } else {
                  // Default to computed status label
                  subStatus = getStatusLabel(order.computedStatus)
                }
              } else {
                subStatus = getStatusLabel(order.computedStatus)
              }
              
              const statusColor = primaryTab === "trailer-build" 
                ? getTrailerBuildSubStatusColor(subStatus)
                : getStatusColor(order.computedStatus)
              
              return (
                <tr key={order.id} className="group border-b transition-colors hover:bg-muted/50">
                  <td className="py-1.5 px-4 align-middle">
                    <Badge className={statusColor}>{subStatus}</Badge>
                  </td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{dealers[order.dealer_id] || "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">{order.asset_no ? `#${order.asset_no}` : order.po ? `PO ${order.po}` : "-"}</span></td>
                  <td className="py-1.5 px-4 align-middle">{renderModel(order.model)}</td>
                  <td className="py-1.5 px-4 align-middle">{renderEditableVIN(order)}</td>
                  <td className="py-1.5 px-4 align-middle"><span className="text-xs text-foreground">-</span></td>
                  <td className="py-1.5 px-4 align-middle border-l">
                    <div className="flex items-center gap-2">
                      {renderStatusSelect()}
                      {renderActionButton()}
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={7} className="h-24 text-center px-4">No results.</td>
            </tr>
          )}
        </tbody>
      </table>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        actions={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      {/* Primary Status Links */}
      <div className="flex flex-wrap gap-4 items-center">
        {primaryTabs.map((tab) => {
          const isActive = primaryTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab("dashboard-primary", tab.value)}
              className={`flex items-center gap-2 transition-colors ${
                isActive
                  ? "font-bold text-foreground"
                  : "font-normal text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>
                {tab.label}
                {tab.value !== "shipped" && (
                  <span
                    className={`${
                      isActive ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                    }`}
                  >
                    {" "}({tab.count})
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <Separator className="w-full" />

      {/* Secondary Filter Tabs + Search + Date Range (for Shipped) */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
        {/* Spalte 1: Secondary Tabs */}
        <div className="w-2/3 justify-self-start">
          <Tabs value={secondaryTab} onValueChange={(value) => setActiveTab("dashboard-secondary", value)}>
            <TabsList className="h-10 w-full">
              {secondaryTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Spalte 2: Searchbar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Orders"
            className="h-10 pl-10 rounded-lg w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Spalte 3: Date Range for Shipped tab */}
        <div className="w-1/2 justify-self-end flex items-center justify-end">
          {primaryTab === "shipped" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">Ship Period</span>
                  {dateRange?.from && (
                    <span className="text-xs">
                      {format(dateRange.from, "MM/dd/yy")}
                      {dateRange.to && ` - ${format(dateRange.to, "MM/dd/yy")}`}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Dashboard Table - Scrollable */}
      <div className="flex h-full flex-col">
        <div className="overflow-hidden rounded-lg border shadow-none h-[calc(100vh-300px)]">
          <div className="h-full overflow-auto">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dashboard - Export</DialogTitle>
            <DialogDescription>
              Please enter a title that should be displayed on the dashboard export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-title">Title</Label>
              <Input
                id="export-title"
                placeholder="Enter export title"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setExportDialogOpen(false)
                  setExportTitle("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log("Exporting with title:", exportTitle)
                  setExportDialogOpen(false)
                  setExportTitle("")
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
