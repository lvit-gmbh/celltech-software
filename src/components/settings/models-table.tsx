"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { Model } from "@/types"
import { fetchModels } from "@/lib/supabase/queries"
import { getSupabaseClient } from "@/lib/supabase/client"

interface SizeGroup {
  size: string
  sizeLabel: string
  count: number
  models: Model[]
}

interface ModelsTableProps {
  activeTab?: "all" | "brightview" | "standard"
}

const colorOptions = [
  "bg-pink-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-slate-500",
]

export function ModelsTable({ activeTab = "all" }: ModelsTableProps) {
  const [allModels, setAllModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [modelLabels, setModelLabels] = useState<Record<string, string>>({})
  const [sizeLabels, setSizeLabels] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()

        // Load models
        const models = await fetchModels()
        setAllModels(models || [])

        // Load model labels from div_frontend_options
        try {
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

        // Load size labels from div_frontend_options
        try {
          const { data: sizeOptions, error: sizeError } = await supabase
            .from("div_frontend_options")
            .select("value, label")
            .eq("type", "Size")

          if (!sizeError && sizeOptions) {
            const sizeLabelsMap: Record<string, string> = {}
            sizeOptions.forEach((opt: any) => {
              sizeLabelsMap[String(opt.value)] = opt.label || ""
            })
            setSizeLabels(sizeLabelsMap)
          }
        } catch (e) {
          console.warn("Could not load size labels:", e)
        }
      } catch (error) {
        console.error("Error loading models:", error)
        setAllModels([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter models based on active tab
  // All = alle Modelle, BrightView = brightView true, Standard = brightView false
  const filteredModels = useMemo(() => {
    if (activeTab === "all") {
      return allModels
    } else if (activeTab === "brightview") {
      return allModels.filter((model) => model.brightView)
    } else {
      // standard - nicht BrightView
      return allModels.filter((model) => !model.brightView)
    }
  }, [allModels, activeTab])

  // Group filtered models by size
  const groupedData = useMemo(() => {
    if (!filteredModels || filteredModels.length === 0) {
      return []
    }

    const grouped = filteredModels.reduce((acc: Record<string, Model[]>, model: Model) => {
      const key = model.size || "Unknown"
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(model)
      return acc
    }, {})

    return Object.entries(grouped).map(([size, models]) => {
      // Get label from sizeLabels, fallback to size value or "Unknown"
      const sizeLabel = sizeLabels[size] || size || "Unknown"
      return {
        size,
        sizeLabel,
        count: models.length,
        models: models as Model[],
      }
    })
  }, [filteredModels, sizeLabels])

  // Sort models within each group
  const data = useMemo(() => {
    if (!sortConfig) return groupedData
    
    return groupedData.map((group) => {
      const sortedModels = [...group.models].sort((a, b) => {
        let aValue: string | null = null
        let bValue: string | null = null
        
        switch (sortConfig.key) {
          case "model":
            aValue = modelLabels[String(a.model)] || a.model || ""
            bValue = modelLabels[String(b.model)] || b.model || ""
            break
          case "rearDoor":
            aValue = a.rearDoor || ""
            bValue = b.rearDoor || ""
            break
          case "axleRating":
            aValue = a.axleRating || ""
            bValue = b.axleRating || ""
            break
          case "axleType":
            aValue = a.axleType || ""
            bValue = b.axleType || ""
            break
          case "tiresWheels":
            aValue = a.tiresWheels || ""
            bValue = b.tiresWheels || ""
            break
          case "brightView":
            aValue = a.brightView ? "Yes" : "No"
            bValue = b.brightView ? "Yes" : "No"
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
        models: sortedModels,
      }
    })
  }, [groupedData, sortConfig, modelLabels])

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
    <div className="flex flex-col rounded-lg border shadow-none overflow-hidden h-[calc(100vh-300px)]">
      {/* Sticky Header mit Spalten-Titeln */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="grid grid-cols-7 gap-4 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <div>Size</div>
          <button
            onClick={() => handleSort("model")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Model
            {getSortIcon("model")}
          </button>
          <button
            onClick={() => handleSort("rearDoor")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Rear door
            {getSortIcon("rearDoor")}
          </button>
          <button
            onClick={() => handleSort("axleRating")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Axle rating
            {getSortIcon("axleRating")}
          </button>
          <button
            onClick={() => handleSort("axleType")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Axle type
            {getSortIcon("axleType")}
          </button>
          <button
            onClick={() => handleSort("tiresWheels")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Tires & Wheels
            {getSortIcon("tiresWheels")}
          </button>
          <button
            onClick={() => handleSort("brightView")}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            BrightView
            {getSortIcon("brightView")}
          </button>
        </div>
      </div>
      
      {/* Scrollbarer Inhalt */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" className="w-full">
          {data.map((group, index) => {
            const colorClass = colorOptions[index % colorOptions.length]
            return (
              <AccordionItem key={group.size} value={`group-${group.size}`} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                    <Badge className={`${colorClass} text-white`}>
                      {group.sizeLabel}
                    </Badge>
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[24px] px-1.5 text-xs font-semibold bg-muted">
                      {group.count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-2">
                    {group.models.length > 0 ? (
                      group.models.map((model) => (
                        <div 
                          key={model.id} 
                          className="grid grid-cols-7 gap-4 px-4 py-1.5 text-xs hover:bg-muted/30 border-b border-border/50 last:border-b-0"
                        >
                          <div>{/* Size placeholder */}</div>
                          <div className="font-medium">
                            {modelLabels[String(model.model)] || model.model}
                          </div>
                          <div>{model.rearDoor}</div>
                          <div>{model.axleRating}</div>
                          <div>{model.axleType}</div>
                          <div>{model.tiresWheels}</div>
                          <div>
                            <Badge variant={model.brightView ? "default" : "secondary"}>
                              {model.brightView ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No models in this size group
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
            {activeTab === "all" 
              ? "No models found" 
              : activeTab === "brightview" 
                ? "No BrightView models found" 
                : "No Standard models found"}
          </div>
        )}
      </div>
    </div>
  )
}
