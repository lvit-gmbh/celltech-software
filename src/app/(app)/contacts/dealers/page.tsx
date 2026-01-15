"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { DealerTable } from "@/components/contacts/dealers/dealer-table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DealerTemplateType = "brightview" | "standard"

export default function DealersPage() {
  const router = useRouter()
  const { activeTabs, setActiveTab } = useUIStore()
  const activeTab = activeTabs["dealers"] || "all"

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<DealerTemplateType | null>(null)

  const tabs = [
    { value: "all", label: "All" },
    { value: "brightview", label: "BrightView" },
    { value: "standard", label: "Standard" },
  ]

  const openConfirm = (type: DealerTemplateType) => {
    setPendingTemplate(type)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!pendingTemplate) return
    setConfirmOpen(false)
    router.push(`/contacts/dealers/new?type=${pendingTemplate}`)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPendingTemplate(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <PageHeader title="Dealer Overview" />

        {/* Tabs + Search + Buttons */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
          {/* Spalte 1: Tabs */}
          <div className="w-2/3 justify-self-start">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab("dealers", value)}>
              <TabsList className="h-10">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="min-w-[90px]">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Spalte 2: Searchbar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input placeholder="Search Dealers" className="h-10 pl-10 rounded-lg border text-foreground w-full" />
          </div>

          {/* Spalte 3: Add Buttons */}
          <div className="w-1/2 justify-self-end flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openConfirm("brightview")}
            >
              <Plus className="h-4 w-4" />
              Brightview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openConfirm("standard")}
            >
              <Plus className="h-4 w-4" />
              Standard
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-hidden">
        <DealerTable />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add new Dealer?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
