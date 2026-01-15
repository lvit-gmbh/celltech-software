"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { FrontendOption } from "@/types"
import { fetchFrontendOptions } from "@/lib/supabase/queries"

interface TypeGroup {
  type: string
  count: number
  options: FrontendOption[]
}

const colorOptions = [
  "bg-blue-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-green-500",
]

export function FrontendOptionsTable() {
  const [allOptions, setAllOptions] = useState<FrontendOption[]>([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const options = await fetchFrontendOptions()
        setAllOptions(options || [])
      } catch (error) {
        console.error("Error loading frontend options:", error)
        setAllOptions([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Group options by type
  const groupedData = useMemo(() => {
    if (!allOptions || allOptions.length === 0) {
      return []
    }

    const grouped = allOptions.reduce((acc: Record<string, FrontendOption[]>, option: FrontendOption) => {
      const key = option.type || "Unknown"
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(option)
      return acc
    }, {})

    return Object.entries(grouped).map(([type, options]) => ({
      type,
      count: options.length,
      options: options as FrontendOption[],
    }))
  }, [allOptions])

  // Sort options within each group
  const data = useMemo(() => {
    if (!sortConfig) return groupedData
    
    return groupedData.map((group) => {
      const sortedOptions = [...group.options].sort((a, b) => {
        let aValue: string | null = null
        let bValue: string | null = null
        
        switch (sortConfig.key) {
          case "label":
            aValue = a.label || ""
            bValue = b.label || ""
            break
          case "value":
            aValue = a.value || ""
            bValue = b.value || ""
            break
          case "abbreviation":
            aValue = a.abbreviation || ""
            bValue = b.abbreviation || ""
            break
        }
        
        if (aValue === null || bValue === null) return 0
        
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
        options: sortedOptions,
      }
    })
  }, [groupedData, sortConfig])

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
    <div className="flex flex-col rounded-lg border shadow-none overflow-hidden h-[calc(100vh-220px)]">
      {/* Sticky Header mit Spalten-Titeln */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="grid grid-cols-4 gap-4 px-3 py-2 text-sm font-medium text-muted-foreground">
          <div>Type</div>
          <button
            onClick={() => handleSort("label")}
            className="text-left flex items-center hover:text-foreground transition-colors group"
          >
            <span className="text-xs">Label</span>
            {getSortIcon("label")}
          </button>
          <button
            onClick={() => handleSort("value")}
            className="text-left flex items-center hover:text-foreground transition-colors group"
          >
            <span className="text-xs">Value</span>
            {getSortIcon("value")}
          </button>
          <button
            onClick={() => handleSort("abbreviation")}
            className="text-left flex items-center hover:text-foreground transition-colors group"
          >
            <span className="text-xs">Abbreviation</span>
            {getSortIcon("abbreviation")}
          </button>
        </div>
      </div>
      
      {/* Scrollbarer Inhalt */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" className="w-full">
          {data.map((group, index) => {
            const colorClass = colorOptions[index % colorOptions.length]
            return (
              <AccordionItem key={group.type} value={`group-${group.type}`} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                    <Badge className={`${colorClass} text-white`}>
                      {group.type}
                    </Badge>
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                      {group.count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-2">
                    {group.options.length > 0 ? (
                      group.options.map((option) => (
                        <div 
                          key={option.id} 
                          className="grid grid-cols-4 gap-4 px-4 py-1.5 text-xs hover:bg-muted/30 border-b border-border/50 last:border-b-0"
                        >
                          <div>{/* Type placeholder */}</div>
                          <div className="font-medium">{option.label}</div>
                          <div>{option.value}</div>
                          <div>{option.abbreviation || "-"}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No options in this type group
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        
        {data.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No frontend options found
          </div>
        )}
      </div>
    </div>
  )
}
