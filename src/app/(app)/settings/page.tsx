"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Input } from "@/components/ui/input"
import { RefreshCw, Plus, Search, Grid3x3, FileText, ClipboardList, List, Building2, Store } from "lucide-react"
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
    { value: "all", label: "All", icon: List },
    { value: "brightview", label: "BrightView", icon: Building2 },
    { value: "standard", label: "Standard", icon: Store },
  ]

  const handleToggleView = () => {
    setViewMode(viewMode === "models" ? "frontend-options" : "models")
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
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
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
        {/* Spalte 1: Tabs (nur wenn viewMode === "models") */}
        <div className="w-2/3 justify-self-start">
          {viewMode === "models" && (
            <ExpandableTabs
              tabs={tabs.map(tab => ({ value: tab.value, title: tab.label, icon: tab.icon }))}
              value={activeTab}
              onValueChange={(value) => setActiveTab("settings", value)}
            />
          )}
        </div>

        {/* Spalte 2: Searchbar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
          <Input placeholder="Search..." className="h-10 pl-10 rounded-lg border text-foreground w-full" />
        </div>

        {/* Spalte 3: Add Button */}
        <div className="w-1/2 justify-self-end flex items-center justify-end">
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
      </div>

      {viewMode === "models" ? (
        <ModelsTable activeTab={activeTab as "all" | "brightview" | "standard"} />
      ) : (
        <FrontendOptionsTable />
      )}
    </div>
  )
}
