"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
import type { PricingItem } from "@/types"
import { fetchPricing } from "@/lib/supabase/queries"

interface SubtypeGroup {
  subtype: string
  items: PricingItem[]
  totalItems: number
}

interface TypeGroup {
  type: string
  subtypes: SubtypeGroup[]
  totalItems: number
}

export function PricingTable() {
  const [allData, setAllData] = useState<TypeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 25

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const pricing = await fetchPricing()
        
        if (pricing && pricing.length > 0) {
          // Filter out items where type = 'Model' AND subtype = 'Main' (as per SQL query)
          const filteredPricing = pricing.filter((item) => {
            return !(item.type === 'Model' && item.subtype === 'Main')
          })

          // Separate items by top-level type (Model vs Option)
          const modelItems: PricingItem[] = []
          const optionItems: PricingItem[] = []
          
          filteredPricing.forEach((item) => {
            // Check if item is a Model type based on type field
            const itemType = item.type?.toLowerCase() || ""
            const isModel = itemType.includes("model") || (item.type === "Model")
            
            if (isModel) {
              modelItems.push(item)
            } else {
              // Everything else is an Option (including "Option", "BV Option", etc.)
              optionItems.push(item)
            }
          })

          // Group Model items by subtype (Axle, Color, Rear Door, Size, etc.)
          const modelSubtypeMap = new Map<string, PricingItem[]>()
          modelItems.forEach((item) => {
            const subtypeKey = item.subtype || "Other"
            if (!modelSubtypeMap.has(subtypeKey)) {
              modelSubtypeMap.set(subtypeKey, [])
            }
            modelSubtypeMap.get(subtypeKey)!.push(item)
          })

          // Sort items within each subtype by pn, then full_name (as per SQL query)
          modelSubtypeMap.forEach((items) => {
            items.sort((a, b) => {
              const pnCompare = (a.pn || "").localeCompare(b.pn || "")
              if (pnCompare !== 0) return pnCompare
              return (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "")
            })
          })

          const modelSubtypeGroups: SubtypeGroup[] = Array.from(modelSubtypeMap.entries()).map(([subtype, items]) => ({
            subtype,
            items,
            totalItems: items.length,
          }))
          modelSubtypeGroups.sort((a, b) => a.subtype.localeCompare(b.subtype))

          // Group Option items by subtype as well (Axle, DOOR, FLOOR, etc.)
          const optionSubtypeMap = new Map<string, PricingItem[]>()
          optionItems.forEach((item) => {
            const subtypeKey = item.subtype || "Other"
            if (!optionSubtypeMap.has(subtypeKey)) {
              optionSubtypeMap.set(subtypeKey, [])
            }
            optionSubtypeMap.get(subtypeKey)!.push(item)
          })

          // Sort option items within each subtype by pn, then full_name
          optionSubtypeMap.forEach((items) => {
            items.sort((a, b) => {
              const pnCompare = (a.pn || "").localeCompare(b.pn || "")
              if (pnCompare !== 0) return pnCompare
              return (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "")
            })
          })

          const optionSubtypeGroups: SubtypeGroup[] = Array.from(optionSubtypeMap.entries()).map(([subtype, items]) => ({
            subtype,
            items,
            totalItems: items.length,
          }))
          optionSubtypeGroups.sort((a, b) => a.subtype.localeCompare(b.subtype))

          // Create TypeGroups - only 2: Model and Option
          const typeGroups: TypeGroup[] = []
          
          if (modelSubtypeGroups.length > 0) {
            typeGroups.push({
              type: "Model",
              subtypes: modelSubtypeGroups,
              totalItems: modelItems.length,
            })
          }
          
          if (optionSubtypeGroups.length > 0) {
            typeGroups.push({
              type: "Option",
              subtypes: optionSubtypeGroups,
              totalItems: optionItems.length,
            })
          }

          setAllData(typeGroups)
        } else {
          setAllData([])
        }
      } catch (error) {
        console.error("Error loading pricing:", error)
        setAllData([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalItems = useMemo(() => allData.reduce((sum, group) => sum + group.totalItems, 0), [allData])
  
  // Collect all items from all subtypes for pagination
  const allItems = useMemo(() => {
    const items: PricingItem[] = []
    allData.forEach((typeGroup) => {
      typeGroup.subtypes.forEach((subtypeGroup) => {
        items.push(...subtypeGroup.items)
      })
    })
    return items
  }, [allData])
  
  // Sort items within subtypes
  const sortedData = useMemo(() => {
    if (!sortConfig) return allData
    
    return allData.map((typeGroup) => ({
      ...typeGroup,
      subtypes: typeGroup.subtypes.map((subtypeGroup) => {
        const sortedItems = [...subtypeGroup.items].sort((a, b) => {
          let aValue: string | number | null = null
          let bValue: string | number | null = null
          
          switch (sortConfig.key) {
            case "type":
              aValue = a.type || ""
              bValue = b.type || ""
              break
            case "name":
              aValue = a.name || a.fullName || ""
              bValue = b.name || b.fullName || ""
              break
            case "pn":
              aValue = a.pn || ""
              bValue = b.pn || ""
              break
            case "subtype":
              aValue = a.subtype || ""
              bValue = b.subtype || ""
              break
            case "maxAmount":
              aValue = a.maxAmount || 0
              bValue = b.maxAmount || 0
              break
            case "unit":
              aValue = a.unit || ""
              bValue = b.unit || ""
              break
            case "status":
              aValue = a.status || ""
              bValue = b.status || ""
              break
            case "pricePerUnit":
              aValue = a.pricePerUnit || 0
              bValue = b.pricePerUnit || 0
              break
            case "pricePerUnitBV":
              aValue = a.pricePerUnitBV || 0
              bValue = b.pricePerUnitBV || 0
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
          ...subtypeGroup,
          items: sortedItems,
        }
      }),
    }))
  }, [allData, sortConfig])

  // Paginate all items
  const totalPages = Math.ceil(allItems.length / pageSize)
  const startIndex = pageIndex * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = allItems.slice(startIndex, endIndex)

  // Create a map of item IDs to their paginated status
  const paginatedItemIds = useMemo(() => {
    return new Set(paginatedItems.map(item => item.id))
  }, [paginatedItems])

  // Filter sortedData to only show items that are on the current page
  const paginatedData = useMemo(() => {
    return sortedData.map((typeGroup) => ({
      ...typeGroup,
      subtypes: typeGroup.subtypes.map((subtypeGroup) => ({
        ...subtypeGroup,
        items: subtypeGroup.items.filter((item) => paginatedItemIds.has(item.id)),
      })).filter((subtypeGroup) => subtypeGroup.items.length > 0),
    })).filter((typeGroup) => typeGroup.subtypes.length > 0)
  }, [sortedData, paginatedItemIds])

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: pageIndex + 1,
    totalPages,
    paginationItemsToDisplay: 5,
  })

  const startRow = allItems.length > 0 ? startIndex + 1 : 0
  const endRow = Math.min(endIndex, allItems.length)

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border shadow-none overflow-hidden">
          <div className="p-4 space-y-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="overflow-hidden rounded-lg border shadow-none flex flex-col h-[calc(100vh-300px)]">
        <div className="sticky top-0 z-20 border-b bg-background px-3 py-2 flex-shrink-0">
          <div className="grid grid-cols-9 gap-4 text-xs font-medium text-muted-foreground">
            <button
              onClick={() => handleSort("type")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Type
              {getSortIcon("type")}
            </button>
            <button
              onClick={() => handleSort("name")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Name
              {getSortIcon("name")}
            </button>
            <button
              onClick={() => handleSort("pn")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              PN
              {getSortIcon("pn")}
            </button>
            <button
              onClick={() => handleSort("subtype")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Subtype
              {getSortIcon("subtype")}
            </button>
            <button
              onClick={() => handleSort("maxAmount")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Max Amount
              {getSortIcon("maxAmount")}
            </button>
            <button
              onClick={() => handleSort("unit")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Unit
              {getSortIcon("unit")}
            </button>
            <button
              onClick={() => handleSort("status")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Status
              {getSortIcon("status")}
            </button>
            <button
              onClick={() => handleSort("pricePerUnit")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Price p. U.
              {getSortIcon("pricePerUnit")}
            </button>
            <button
              onClick={() => handleSort("pricePerUnitBV")}
              className="text-left flex items-center hover:text-foreground transition-colors"
            >
              Price p. U. (BV)
              {getSortIcon("pricePerUnitBV")}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <Accordion type="multiple" className="w-full">
            {paginatedData.map((typeGroup, typeIndex) => (
              <AccordionItem key={`type-${typeGroup.type}`} value={`type-${typeIndex}`} className="border-b">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <ChevronRight className="h-4 w-4 transition-transform" />
                    <span className="font-medium">{typeGroup.type}</span>
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                      {typeGroup.totalItems}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4">
                    <Accordion type="multiple" className="w-full">
                      {/* Render Subtypes for Model */}
                      {typeGroup.type === "Model" && typeGroup.subtypes.map((subtypeGroup, subtypeIndex) => (
                        <AccordionItem 
                          key={`subtype-${subtypeGroup.subtype}-${subtypeIndex}`} 
                          value={`subtype-${typeIndex}-${subtypeIndex}`}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2 flex-1">
                              <ChevronRight className="h-4 w-4 transition-transform" />
                              <span className="font-medium">{subtypeGroup.subtype}</span>
                              <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                                {subtypeGroup.totalItems}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>PN</TableHead>
                                    <TableHead>Subtype</TableHead>
                                    <TableHead>Max Amount</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price p. U.</TableHead>
                                    <TableHead>Price p. U. (BV)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subtypeGroup.items.length > 0 ? (
                                    subtypeGroup.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">
                                            {item.type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{item.name || item.fullName || "-"}</TableCell>
                                        <TableCell>{item.pn}</TableCell>
                                        <TableCell>{item.subtype || "-"}</TableCell>
                                        <TableCell>{item.maxAmount || "-"}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                                        <TableCell>{item.pricePerUnitBV ? `$${item.pricePerUnitBV.toFixed(2)}` : "-"}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        No items
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}

                      {/* Render Subtypes for Option in the same way */}
                      {typeGroup.type === "Option" && typeGroup.subtypes.map((subtypeGroup, subtypeIndex) => (
                        <AccordionItem 
                          key={`option-subtype-${subtypeGroup.subtype}-${subtypeIndex}`} 
                          value={`option-subtype-${typeIndex}-${subtypeIndex}`}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2 flex-1">
                              <ChevronRight className="h-4 w-4 transition-transform" />
                              <span className="font-medium">{subtypeGroup.subtype}</span>
                              <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                                {subtypeGroup.totalItems}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>PN</TableHead>
                                    <TableHead>Subtype</TableHead>
                                    <TableHead>Max Amount</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price p. U.</TableHead>
                                    <TableHead>Price p. U. (BV)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subtypeGroup.items.length > 0 ? (
                                    subtypeGroup.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">
                                            {item.type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{item.name || item.fullName || "-"}</TableCell>
                                        <TableCell>{item.pn}</TableCell>
                                        <TableCell>{item.subtype || "-"}</TableCell>
                                        <TableCell>{item.maxAmount || "-"}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>{item.status}</TableCell>
                                        <TableCell>${item.pricePerUnit.toFixed(2)}</TableCell>
                                        <TableCell>{item.pricePerUnitBV ? `$${item.pricePerUnitBV.toFixed(2)}` : "-"}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        No items
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4 px-3">
        <div className="text-sm text-muted-foreground min-w-[200px]">
          Showing {startRow}-{endRow} of {allItems.length} items
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={pageIndex === 0}
                />
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map((page) => {
                const isActive = page === pageIndex + 1
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={isActive}
                      onClick={() => setPageIndex(page - 1)}
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
                  onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={pageIndex >= totalPages - 1}
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
