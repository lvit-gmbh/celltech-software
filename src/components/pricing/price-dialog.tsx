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
import { DollarSign, Save } from "lucide-react"

type PriceDialogProps = {
  /**
   * Trigger button is rendered via `asChild` so the consumer can style the button.
   */
  children: React.ReactNode
}

type PriceFormState = {
  fullName: string
  label: string
  partNumber: string
  priceType: string
  subtype: string
  unit: string
  status: string
  size: string
  axle: string
  maxAmount: string
  pricePerUnit: string
  pricePerUnitBV: string
}

const initialFormState: PriceFormState = {
  fullName: "",
  label: "",
  partNumber: "",
  priceType: "",
  subtype: "",
  unit: "",
  status: "",
  size: "",
  axle: "",
  maxAmount: "0",
  pricePerUnit: "",
  pricePerUnitBV: "",
}

export function PriceDialog({ children }: PriceDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<PriceFormState>(initialFormState)

  const handleChange =
    (field: keyof PriceFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleSelectChange =
    (field: keyof PriceFormState) =>
    (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleCancel = () => {
    setOpen(false)
    setFormData(initialFormState)
  }

  const handleSave = () => {
    // TODO: Persist new price via Supabase/API
    // For now we just close the dialog
    setOpen(false)
    setFormData(initialFormState)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl shadow-none p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add Price
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto px-6 py-4 space-y-4">
          {/* Full Name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.fullName}
              onChange={handleChange("fullName")}
            />
          </div>

          {/* Label */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.label}
              onChange={handleChange("label")}
            />
          </div>

          {/* Part Number */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Part Number
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.partNumber}
              onChange={handleChange("partNumber")}
            />
          </div>

          {/* Price Type */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Price Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.priceType}
              onValueChange={handleSelectChange("priceType")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="surcharge">Surcharge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subtype */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Subtype <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.subtype}
              onValueChange={handleSelectChange("subtype")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Unit
            </Label>
            <Select
              value={formData.unit}
              onValueChange={handleSelectChange("unit")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ea">Each</SelectItem>
                <SelectItem value="set">Set</SelectItem>
                <SelectItem value="hour">Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={handleSelectChange("status")}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Size
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.size}
              onChange={handleChange("size")}
            />
          </div>

          {/* Axle */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Axle
            </Label>
            <Input
              className="h-10"
              placeholder="Enter value"
              value={formData.axle}
              onChange={handleChange("axle")}
            />
          </div>

          {/* Max Amount */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Max. Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              type="number"
              value={formData.maxAmount}
              onChange={handleChange("maxAmount")}
            />
          </div>

          {/* Price per Unit */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Price per Unit
            </Label>
            <div className="relative">
              <Input
                className="h-10 pr-8"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.pricePerUnit}
                onChange={handleChange("pricePerUnit")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground text-xs">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Price per Unit Brightview */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm font-medium text-foreground">
                Price per Unit
              </Label>
              <span className="text-xs text-muted-foreground">Brightview</span>
            </div>
            <div className="relative">
              <Input
                className="h-10 pr-8"
                type="number"
                step="0.01"
                placeholder="Enter value"
                value={formData.pricePerUnitBV}
                onChange={handleChange("pricePerUnitBV")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground text-xs">
                <DollarSign className="h-4 w-4" />
              </span>
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

