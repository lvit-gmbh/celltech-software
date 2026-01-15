"use client"

import { useState, useEffect, useMemo, useRef, useCallback, startTransition, memo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight, Download, Filter, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { InventoryItem } from "@/types"
import { InventoryFilterDialog, type FilterRule } from "./inventory-filter-dialog"

interface InventoryGroup {
  partType: string
  count: number
  items: InventoryItem[]
}

interface InventoryTableProps {
  tab: string
  allExpanded?: boolean
}

const colorOptions = [
  "bg-green-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-slate-500",
]

export function InventoryTable({ tab, allExpanded = false }: InventoryTableProps) {
  const [data, setData] = useState<InventoryGroup[]>([])
  const [allData, setAllData] = useState<InventoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([])
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const prevAllExpandedRef = useRef(allExpanded)
  const isExpandingAllRef = useRef(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/inventory?tab=${tab}`)
        if (!response.ok) {
          throw new Error("Failed to fetch inventory data")
        }
        const inventory = await response.json()
        
        if (inventory && inventory.length > 0) {
          // Group inventory items by part type
          const grouped = inventory.reduce((acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
            const key = item.partType || "Unknown"
            if (!acc[key]) {
              acc[key] = []
            }
            acc[key].push(item)
            return acc
          }, {})

          const groups: InventoryGroup[] = Object.entries(grouped).map(([partType, items]) => ({
            partType,
            count: items.length,
            items: items as InventoryItem[],
          }))

          setData(groups)
          setAllData(groups)
        } else {
          setData([])
          setAllData([])
        }
      } catch (error) {
        console.error("Error loading inventory:", error)
        setData([])
        setAllData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tab, refreshKey])

  // Apply filters to data
  useEffect(() => {
    if (activeFilters.length === 0) {
      setData(allData)
      return
    }

    const applyFilter = (item: InventoryItem, rule: FilterRule): boolean => {
      const { field, operator, value } = rule
      const filterValue = value.toLowerCase().trim()

      let itemValue: string | number | null = null

      switch (field) {
        case "partType":
          itemValue = item.partType || ""
          break
        case "label":
          itemValue = item.label || ""
          break
        case "pn":
          itemValue = item.pn || ""
          break
        case "unit":
          itemValue = item.unit || ""
          break
        case "min":
          itemValue = item.min || 0
          break
        case "available":
          itemValue = item.available || 0
          break
        case "onHand":
          itemValue = item.onHand || 0
          break
        case "reserved":
          itemValue = item.reserved || 0
          break
      }

      if (itemValue === null || itemValue === "") {
        return false
      }

      const itemValueStr = String(itemValue).toLowerCase()
      const filterValueNum = parseFloat(filterValue)

      switch (operator) {
        case "equals":
          return itemValueStr === filterValue
        case "not_equals":
          return itemValueStr !== filterValue
        case "includes":
          return itemValueStr.includes(filterValue)
        case "not_includes":
          return !itemValueStr.includes(filterValue)
        case "greater_than":
          if (typeof itemValue === "number") {
            return itemValue > filterValueNum
          }
          return itemValueStr > filterValue
        case "less_than":
          if (typeof itemValue === "number") {
            return itemValue < filterValueNum
          }
          return itemValueStr < filterValue
        case "greater_equal":
          if (typeof itemValue === "number") {
            return itemValue >= filterValueNum
          }
          return itemValueStr >= filterValue
        case "less_equal":
          if (typeof itemValue === "number") {
            return itemValue <= filterValueNum
          }
          return itemValueStr <= filterValue
        default:
          return true
      }
    }

    const applyFilters = (items: InventoryItem[], filters: FilterRule[]): InventoryItem[] => {
      if (filters.length === 0) {
        return items
      }

      return items.filter((item) => {
        let result = true
        let lastLogic: "and" | "or" = "and"

        for (let i = 0; i < filters.length; i++) {
          const rule = filters[i]
          const ruleResult = applyFilter(item, rule)

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

    // Apply filters to all items and regroup
    const filteredGroups: InventoryGroup[] = []
    allData.forEach((group) => {
      const filteredItems = applyFilters(group.items, activeFilters)
      if (filteredItems.length > 0) {
        filteredGroups.push({
          partType: group.partType,
          count: filteredItems.length,
          items: filteredItems,
        })
      }
    })

    setData(filteredGroups)
  }, [activeFilters, allData])

  // Sort items within each group
  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    
    return data.map((group) => {
      const sortedItems = [...group.items].sort((a, b) => {
        let aValue: string | number | null = null
        let bValue: string | number | null = null
        
        switch (sortConfig.key) {
          case "partType":
            aValue = a.partType || ""
            bValue = b.partType || ""
            break
          case "label":
            aValue = a.label || ""
            bValue = b.label || ""
            break
          case "pn":
            aValue = a.pn || ""
            bValue = b.pn || ""
            break
          case "unit":
            aValue = a.unit || ""
            bValue = b.unit || ""
            break
          case "min":
            aValue = a.min || 0
            bValue = b.min || 0
            break
          case "available":
            aValue = a.available || 0
            bValue = b.available || 0
            break
          case "onHand":
            aValue = a.onHand || 0
            bValue = b.onHand || 0
            break
          case "reserved":
            aValue = a.reserved || 0
            bValue = b.reserved || 0
            break
        }
        
        if (aValue === null || bValue === null) return 0
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        if (sortConfig.direction === "asc") {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
      
      return {
        ...group,
        items: sortedItems,
      }
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" 
          ? { key, direction: "desc" }
          : null
      }
      return { key, direction: "asc" }
    })
  }

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1.5 h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
    }
    return sortConfig.direction === "asc"
      ? <ArrowUp className="ml-1.5 h-2.5 w-2.5" />
      : <ArrowDown className="ml-1.5 h-2.5 w-2.5" />
  }

  const totalItems = useMemo(() => sortedData.reduce((sum, group) => sum + group.count, 0), [sortedData])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleExportCSV = () => {
    const headers = [
      "Part Type",
      "Label",
      "PN",
      "Unit",
      "Min.",
      "Available",
      "On Hand",
      "Reserved",
    ]

    const rows: string[][] = []
    data.forEach((group) => {
      group.items.forEach((item) => {
        rows.push([
          item.partType || "",
          item.label || "",
          item.pn || "",
          item.unit || "",
          item.min?.toString() || "",
          item.available?.toString() || "",
          item.onHand?.toString() || "",
          item.reserved?.toString() || "",
        ])
      })
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `inventory-${tab}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFilter = () => {
    setFilterDialogOpen(true)
  }

  // Handler for accordion value changes - direct update for immediate response
  const handleAccordionValueChange = useCallback((value: string[]) => {
    setAccordionValue(value)
  }, [])

  // Sync accordion value with allExpanded prop - immediate update for fast response
  useEffect(() => {
    // Only update if allExpanded actually changed (not just data.length)
    if (prevAllExpandedRef.current !== allExpanded) {
      isExpandingAllRef.current = true
      const allGroupIds = data.map((_, index) => `group-${index}`)
      if (allExpanded) {
        // Expand all items - direct synchronous update for immediate response
        setAccordionValue(allGroupIds)
      } else {
        // Collapse all items - direct synchronous update
        setAccordionValue([])
      }
      prevAllExpandedRef.current = allExpanded
      // Reset flag after a short delay to allow animations to complete
      setTimeout(() => {
        isExpandingAllRef.current = false
      }, 150)
    }
  }, [allExpanded, data])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border shadow-none">
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
    <div className="flex flex-col h-full rounded-lg border shadow-none overflow-hidden">
      {/* Column Headers - Fixed */}
      <div className="flex-shrink-0 border-b bg-background px-3 py-2 z-10">
        <div className="grid grid-cols-8 gap-4 text-xs font-medium text-muted-foreground">
          <button
            onClick={() => handleSort("partType")}
            className="text-left flex items-center hover:text-foreground transition-colors group"
          >
            <span className="text-xs">Part type</span>
            {getSortIcon("partType")}
          </button>
          <button
            onClick={() => handleSort("label")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Label
            {getSortIcon("label")}
          </button>
          <button
            onClick={() => handleSort("pn")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            PN
            {getSortIcon("pn")}
          </button>
          <button
            onClick={() => handleSort("unit")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Unit
            {getSortIcon("unit")}
          </button>
          <button
            onClick={() => handleSort("min")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Min.
            {getSortIcon("min")}
          </button>
          <button
            onClick={() => handleSort("available")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Available
            {getSortIcon("available")}
          </button>
          <button
            onClick={() => handleSort("onHand")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            On Hand
            {getSortIcon("onHand")}
          </button>
          <button
            onClick={() => handleSort("reserved")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Reserved
            {getSortIcon("reserved")}
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto min-h-0">
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={handleAccordionValueChange}
          className={`w-full ${isExpandingAllRef.current ? '[&_[data-state=open]]:!transition-none' : ''}`}
        >
          {sortedData.map((group, index) => {
            const colorClass = colorOptions[index % colorOptions.length]
            return (
              <AccordionItem key={index} value={`group-${index}`} className="border-b">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <ChevronRight className="h-4 w-4 transition-transform" />
                    <Badge className={`${colorClass} text-white`}>
                      {group.partType}
                    </Badge>
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                      {group.count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent 
                  className={isExpandingAllRef.current ? "!animate-none [&>div]:!transition-none" : ""}
                  style={isExpandingAllRef.current ? { animation: 'none', transition: 'none' } : undefined}
                >
                  <div className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part type</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>PN</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Min.</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>On Hand</TableHead>
                          <TableHead>Reserved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.length > 0 ? (
                          group.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.partType}</TableCell>
                              <TableCell>{item.label}</TableCell>
                              <TableCell>{item.pn}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>{item.min}</TableCell>
                              <TableCell>{item.available}</TableCell>
                              <TableCell>{item.onHand}</TableCell>
                              <TableCell>{item.reserved}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No items in this group
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
          {data.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No data available
            </div>
          )}
        </Accordion>
      </div>
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 border-t bg-background px-3 py-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{totalItems} results</span>
          <div className="flex items-center gap-2">
            <InventoryFilterDialog
              open={filterDialogOpen}
              onOpenChange={setFilterDialogOpen}
              onApply={setActiveFilters}
            />
            <Button
              variant="ghost"
              size="icon"
              title="Filter"
              className="text-foreground"
              onClick={handleFilter}
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
    </div>
  )
}
