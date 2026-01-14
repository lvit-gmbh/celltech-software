"use client"

import { useState, useEffect, useMemo } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"
import type { Model } from "@/types"
import { fetchModels } from "@/lib/supabase/queries"
import { getSupabaseClient } from "@/lib/supabase/client"

interface SizeGroup {
  size: string
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

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const models = await fetchModels()
        setAllModels(models || [])
        
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
  const data = useMemo(() => {
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

    return Object.entries(grouped).map(([size, models]) => ({
      size,
      count: models.length,
      models: models as Model[],
    }))
  }, [filteredModels])

  if (loading) {
    return (
      <div className="rounded-2xl border shadow-none overflow-hidden">
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border shadow-none overflow-hidden h-[calc(100vh-220px)]">
      {/* Sticky Header mit Spalten-Titeln */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="grid grid-cols-7 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div>Size</div>
          <div>Model</div>
          <div>Rear door</div>
          <div>Axle rating</div>
          <div>Axle type</div>
          <div>Tires & Wheels</div>
          <div>BrightView</div>
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
                      {group.size}
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
                          className="grid grid-cols-7 gap-4 px-4 py-2 text-sm hover:bg-muted/30 border-b border-border/50 last:border-b-0"
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
