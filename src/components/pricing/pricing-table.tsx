"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"
import type { PricingItem } from "@/types"
import { fetchPricing } from "@/lib/supabase/queries"
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

interface OptionGroup {
  optionId: number | null
  optionName: string
  items: PricingItem[]
}

interface ModelGroup {
  modelId: number | null
  modelName: string
  options: OptionGroup[]
  totalItems: number
}

export function PricingTable() {
  const [allData, setAllData] = useState<ModelGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const pricing = await fetchPricing()
        
        if (pricing && pricing.length > 0) {
          // Group by Model first
          const modelMap = new Map<number | string, PricingItem[]>()
          
          pricing.forEach((item) => {
            // Use model_id if available, otherwise use modelName or "Unknown"
            const modelKey = item.modelId ?? item.modelName ?? "Unknown"
            
            if (!modelMap.has(modelKey)) {
              modelMap.set(modelKey, [])
            }
            modelMap.get(modelKey)!.push(item)
          })

          // Create ModelGroups with nested OptionGroups
          const modelGroups: ModelGroup[] = Array.from(modelMap.entries()).map(([modelKey, items]) => {
            // Group items by option
            const optionMap = new Map<number | string, PricingItem[]>()
            
            items.forEach((item) => {
              const optionKey = item.optionId ?? item.optionName ?? "No Option"
              
              if (!optionMap.has(optionKey)) {
                optionMap.set(optionKey, [])
              }
              optionMap.get(optionKey)!.push(item)
            })

            // Create OptionGroups
            const optionGroups: OptionGroup[] = Array.from(optionMap.entries()).map(([optionKey, optionItems]) => ({
              optionId: typeof optionKey === 'number' ? optionKey : null,
              optionName: typeof optionKey === 'string' ? optionKey : optionItems[0]?.optionName || "Unknown",
              items: optionItems,
            }))

            const modelId = typeof modelKey === 'number' ? modelKey : null
            const modelName = typeof modelKey === 'string' ? modelKey : items[0]?.modelName || "Unknown"

            return {
              modelId,
              modelName,
              options: optionGroups,
              totalItems: items.length,
            }
          })

          // Sort by model name
          modelGroups.sort((a, b) => a.modelName.localeCompare(b.modelName))

          setAllData(modelGroups)
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
  const totalPages = Math.ceil(allData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = useMemo(() => allData.slice(startIndex, endIndex), [allData, startIndex, endIndex])

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay: 5,
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border shadow-none overflow-hidden">
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
      <div className="flex-1 overflow-hidden rounded-2xl border shadow-none flex flex-col">
        <div className="sticky top-0 z-20 border-b bg-background px-4 py-3 flex-shrink-0">
          <div className="grid grid-cols-9 gap-4 text-sm font-medium text-muted-foreground">
            <div>Type</div>
            <div>Name</div>
            <div>PN</div>
            <div>Subtype</div>
            <div>Max Amount</div>
            <div>Unit</div>
            <div>Status</div>
            <div>Price p. U.</div>
            <div>Price p. U. (BV)</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <Accordion type="multiple" className="w-full">
            {paginatedData.map((modelGroup, modelIndex) => {
              const globalModelIndex = startIndex + modelIndex
              return (
                <AccordionItem key={`model-${modelGroup.modelId || globalModelIndex}`} value={`model-${globalModelIndex}`} className="border-b">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2 flex-1">
                      <ChevronRight className="h-4 w-4 transition-transform" />
                      <span className="font-medium">Model: {modelGroup.modelName}</span>
                      <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                        {modelGroup.totalItems}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-4 pb-4">
                      <Accordion type="multiple" className="w-full">
                        {modelGroup.options.map((optionGroup, optionIndex) => (
                          <AccordionItem 
                            key={`option-${optionGroup.optionId || optionIndex}`} 
                            value={`option-${globalModelIndex}-${optionIndex}`}
                            className="border-b last:border-b-0"
                          >
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2 flex-1">
                                <ChevronRight className="h-4 w-4 transition-transform" />
                                <span className="font-medium">Option: {optionGroup.optionName}</span>
                                <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                                  {optionGroup.items.length}
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
                                    {optionGroup.items.length > 0 ? (
                                      optionGroup.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell>{item.type}</TableCell>
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
                                          No items in this option
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
              )
            })}
          </Accordion>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4 px-4">
        <div className="text-sm text-muted-foreground min-w-[200px]">
          Showing {startIndex + 1}-{Math.min(endIndex, allData.length)} of {allData.length} models ({totalItems} total items)
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
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
                      onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
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
