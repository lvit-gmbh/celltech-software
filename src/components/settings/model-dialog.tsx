"use client"

import { useState, type ChangeEvent } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"

type ModelDialogProps = {
  /**
   * Trigger button is rendered via `asChild` so the consumer can style the button.
   */
  children: React.ReactNode
}

type ModelFormState = {
  size: string
  rearDoor: string
  axleRating: string
  axleType: string
  color: string
  tiresWheels: string
  brightView: boolean
}

const initialFormState: ModelFormState = {
  size: "",
  rearDoor: "",
  axleRating: "",
  axleType: "",
  color: "",
  tiresWheels: "",
  brightView: false,
}

export function ModelDialog({ children }: ModelDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<ModelFormState>(initialFormState)

  const handleChange =
    (field: keyof ModelFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleSelectChange =
    (field: keyof ModelFormState) =>
    (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleBrightViewChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, brightView: checked }))
  }

  const handleCancel = () => {
    setOpen(false)
    setFormData(initialFormState)
  }

  const handleSave = () => {
    // TODO: Persist new model via Supabase/API
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
            Add Model
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto px-6 py-4 space-y-4">
          {/* Size */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Size <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.size}
              onValueChange={handleSelectChange("size")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="36">36</SelectItem>
                <SelectItem value="48">48</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="72">72</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rear Door */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Rear Door <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.rearDoor}
              onValueChange={handleSelectChange("rearDoor")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="barn">Barn</SelectItem>
                <SelectItem value="ramp">Ramp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Axle Rating */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Axle Rating <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.axleRating}
              onChange={handleChange("axleRating")}
            />
          </div>

          {/* Axle Type */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Axle Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.axleType}
              onValueChange={handleSelectChange("axleType")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tandem">Tandem</SelectItem>
                <SelectItem value="triple">Triple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Color <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.color}
              onValueChange={handleSelectChange("color")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tires & Wheels */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Tires &amp; Wheels <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.tiresWheels}
              onChange={handleChange("tiresWheels")}
            />
          </div>

          {/* BrightView Toggle */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              BrightView
            </Label>
            <div className="flex items-center justify-between gap-4">
              <Switch
                checked={formData.brightView}
                onCheckedChange={handleBrightViewChange}
              />
            </div>
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

