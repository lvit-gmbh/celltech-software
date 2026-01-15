"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"
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
  // No pagination needed - we only have 2 types max
  const paginatedData = useMemo(() => allData, [allData])

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
      <div className="flex-shrink-0 flex items-center justify-between gap-4 border-t pt-4 mt-4 px-4">
        <div className="text-sm text-muted-foreground min-w-[200px]">
          {allData.length} {allData.length === 1 ? 'type' : 'types'} ({totalItems} total items)
        </div>
        <div className="flex-1"></div>
        <div className="min-w-[200px]"></div>
      </div>
    </div>
  )
}
