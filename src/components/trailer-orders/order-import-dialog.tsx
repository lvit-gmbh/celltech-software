"use client"

import { useCallback, useState } from "react"
import { UploadCloud } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type OrderImportDialogProps = {
  /**
   * Trigger button is rendered via `asChild` so the consumer can style the button.
   */
  children: React.ReactNode
}

export function OrderImportDialog({ children }: OrderImportDialogProps) {
  const [activeTab, setActiveTab] = useState<"brightview" | "standard">("brightview")
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files || [])
    if (!files.length) return

    // TODO: Implement upload logic for each tab
    console.log("Dropped files for", activeTab, files)
  }, [activeTab])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (!files.length) return

      // TODO: Implement upload logic for each tab
      console.log("Selected files for", activeTab, files)
    },
    [activeTab]
  )

  const DragAndDropArea = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-input bg-background"
      }`}
    >
      <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">Select or drag and drop</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Supported formats depend on the selected import type.
      </p>
      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-xs hover:bg-secondary/90">
          Choose file
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Order Import</DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value === "standard" ? "standard" : "brightview")
          }
          className="mt-2"
        >
          <TabsList className="w-full justify-start rounded-2xl bg-muted/60 px-1 py-1">
            <TabsTrigger value="brightview" className="flex-1 rounded-xl">
              BrightView
            </TabsTrigger>
            <TabsTrigger value="standard" className="flex-1 rounded-xl">
              Standard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="brightview" className="mt-4">
            {DragAndDropArea}
          </TabsContent>
          <TabsContent value="standard" className="mt-4">
            {DragAndDropArea}
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-6">
          <Button type="button" disabled>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

