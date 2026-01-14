"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save } from "lucide-react"
import { fetchFrontendOptions } from "@/lib/supabase/queries"

type FrontendOptionDialogProps = {
  /**
   * Trigger button is rendered via `asChild` so the consumer can style the button.
   */
  children: React.ReactNode
}

type FrontendOptionFormState = {
  label: string
  type: string
}

const initialFormState: FrontendOptionFormState = {
  label: "",
  type: "",
}

export function FrontendOptionDialog({ children }: FrontendOptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FrontendOptionFormState>(initialFormState)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])

  useEffect(() => {
    async function loadTypes() {
      try {
        const options = await fetchFrontendOptions()
        // Extract unique types from existing options
        const types = Array.from(new Set(options.map((opt) => opt.type).filter(Boolean)))
        setAvailableTypes(types.sort())
      } catch (error) {
        console.error("Error loading types:", error)
        setAvailableTypes([])
      }
    }
    if (open) {
      loadTypes()
    }
  }, [open])

  const handleChange =
    (field: keyof FrontendOptionFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleSelectChange =
    (field: keyof FrontendOptionFormState) =>
    (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleCancel = () => {
    setOpen(false)
    setFormData(initialFormState)
  }

  const handleSave = () => {
    // TODO: Persist new frontend option via Supabase/API
    // For now we just close the dialog
    setOpen(false)
    setFormData(initialFormState)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl shadow-none p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add Frontend Option
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto px-6 py-4 space-y-4">
          {/* Label */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Enter label"
              value={formData.label}
              onChange={handleChange("label")}
            />
          </div>

          {/* Type */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={handleSelectChange("type")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
