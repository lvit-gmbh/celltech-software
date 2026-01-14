"use client"

import { useState } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderBookTable } from "@/components/trailer-orders/order-book-table"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { useUIStore } from "@/stores/ui-store"
import { FileSpreadsheet, Maximize2, Minimize2, Plus, Save, Search, ShoppingCart, Upload } from "lucide-react"

export default function InventoryPage() {
  const { activeTabs, setActiveTab } = useUIStore()
  const activeTab = activeTabs["inventory"] || "items"
  const [showOnlyOpenOrders, setShowOnlyOpenOrders] = useState(true)
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [itemName, setItemName] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [partType, setPartType] = useState("")
  const [units, setUnits] = useState("")

  const tabs = [
    { value: "items", label: "Items" },
    { value: "assemblies", label: "Assemblies" },
    { value: "options", label: "Options" },
    { value: "models", label: "Models" },
  ]

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files || [])
    if (files.length > 0) {
      const file = files[0]
      // Check if it's an Excel file
      if (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      // TODO: Implement upload logic
      console.log("Uploading file:", selectedFile)
      setUploadDialogOpen(false)
      setSelectedFile(null)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        <PageHeader title="Inventory" />

        {/* Category Tabs with Orders Slider */}
        <div className="flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab("inventory", value)}>
            <TabsList className="h-10">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="min-w-[80px]">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-3xl p-0 flex flex-col rounded-none border-l shadow-none"
            >
              <SheetHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
                <div className="space-y-1 text-left">
                  <SheetTitle>Orders</SheetTitle>
                  <p className="text-sm text-muted-foreground">Overview of all trailer orders</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">only show pending</span>
                  <Switch
                    checked={showOnlyOpenOrders}
                    onCheckedChange={(value) => setShowOnlyOpenOrders(!!value)}
                  />
                </div>
              </SheetHeader>
              <div className="flex-1 min-h-0 px-6 py-4">
                <OrderBookTable showClosed={!showOnlyOpenOrders} />
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button>
                  {/* Icon similar to the screenshot */}
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Place Order
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <Input placeholder="Search Parts" className="h-10 pl-10 rounded-lg border text-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title={allExpanded ? "Collapse All" : "Expand All"}
              onClick={() => setAllExpanded(!allExpanded)}
            >
              {allExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Upload">
                  <Upload className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Parts - Excel Upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-input bg-background"
                    }`}
                  >
                    <FileSpreadsheet className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Select or drag and drop</p>
                    <div className="mt-4">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-xs hover:bg-secondary/90">
                        Choose file
                        <input
                          type="file"
                          className="hidden"
                          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-xs text-muted-foreground">{selectedFile.name}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• Parts without a part number can lead to conflicts, which is why they are ignored for the import.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpload} disabled={!selectedFile}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Add Item">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-name" className="text-right">
                      Item Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="item-name"
                      placeholder="Enter value"
                      className="col-span-3"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="part-number" className="text-right">
                      Part Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="part-number"
                      placeholder="Enter value"
                      className="col-span-3"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="part-type" className="text-right">
                      Part Type <span className="text-destructive">*</span>
                    </Label>
                    <Select value={partType} onValueChange={setPartType}>
                      <SelectTrigger id="part-type" className="col-span-3">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assembly">Assembly</SelectItem>
                        <SelectItem value="component">Component</SelectItem>
                        <SelectItem value="option">Option</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="units" className="text-right">
                      Units <span className="text-destructive">*</span>
                    </Label>
                    <Select value={units} onValueChange={setUnits}>
                      <SelectTrigger id="units" className="col-span-3">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pc">pc</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      // TODO: Implement save logic
                      console.log({ itemName, partNumber, partType, units })
                      setAddItemDialogOpen(false)
                      // Reset form
                      setItemName("")
                      setPartNumber("")
                      setPartType("")
                      setUnits("")
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 min-h-0">
        <InventoryTable tab={activeTab} allExpanded={allExpanded} />
      </div>
    </div>
  )
}
