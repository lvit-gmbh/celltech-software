"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { RefreshCw, Plus, Search } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { ModelsTable } from "@/components/settings/models-table"
import { FrontendOptionsTable } from "@/components/settings/frontend-options-table"
import { ModelDialog } from "@/components/settings/model-dialog"
import { FrontendOptionDialog } from "@/components/settings/frontend-option-dialog"

type ViewMode = "models" | "frontend-options"

export default function SettingsPage() {
  const { activeTabs, setActiveTab } = useUIStore()
  const activeTab = activeTabs["settings"] || "all"
  const [viewMode, setViewMode] = useState<ViewMode>("models")

  const tabs = [
    { value: "all", label: "All" },
    { value: "brightview", label: "BrightView" },
    { value: "standard", label: "Standard" },
  ]

  const handleToggleView = () => {
    setViewMode(viewMode === "models" ? "frontend-options" : "models")
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={viewMode === "models" ? "Models" : "Frontend Options"}
        actions={
          <Button variant="outline" className="gap-2" onClick={handleToggleView}>
            <RefreshCw className="h-4 w-4" />
            {viewMode === "models" ? "Frontend Options" : "Models"}
          </Button>
        }
      />

      {/* Tabs + Search + Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {viewMode === "models" && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab("settings", value)}>
              <TabsList className="h-10">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="min-w-[90px]">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input placeholder="Search..." className="h-10 pl-10 rounded-lg border text-foreground" />
          </div>
        </div>
        {viewMode === "models" ? (
          <ModelDialog>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </ModelDialog>
        ) : (
          <FrontendOptionDialog>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </FrontendOptionDialog>
        )}
      </div>

      {viewMode === "models" ? (
        <ModelsTable activeTab={activeTab as "all" | "brightview" | "standard"} />
      ) : (
        <FrontendOptionsTable />
      )}
    </div>
  )
}
