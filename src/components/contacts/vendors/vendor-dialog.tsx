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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail } from "lucide-react"

type VendorDialogProps = {
  /**
   * Trigger button is rendered via `asChild` so the consumer can style the button.
   */
  children: React.ReactNode
}

export function VendorDialog({ children }: VendorDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    contactName: "",
    phone: "",
    email: "",
  })

  const handleChange =
    (field: keyof typeof formData) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleStateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, state: value }))
  }

  const handleSave = () => {
    // TODO: Persist new vendor via Supabase/API
    // For now we just close the dialog
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl shadow-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Add Vendor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-foreground">
              Enter Name <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-10"
              placeholder="Vendor Name"
              value={formData.name}
              onChange={handleChange("name")}
            />
          </div>

          {/* Address section label */}
          <div className="border-b border-border pb-1 text-sm font-medium text-muted-foreground">
            Address
          </div>

          {/* Address fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-foreground">
                Street
              </Label>
              <Input
                className="h-10"
                placeholder="Enter Street"
                value={formData.street}
                onChange={handleChange("street")}
              />
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-foreground">
                City
              </Label>
              <Input
                className="h-10"
                placeholder="Enter City"
                value={formData.city}
                onChange={handleChange("city")}
              />
              <Select value={formData.state} onValueChange={handleStateChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="al">Alabama</SelectItem>
                  <SelectItem value="ak">Alaska</SelectItem>
                  <SelectItem value="az">Arizona</SelectItem>
                  <SelectItem value="ar">Arkansas</SelectItem>
                  <SelectItem value="ca">California</SelectItem>
                  <SelectItem value="co">Colorado</SelectItem>
                  <SelectItem value="ct">Connecticut</SelectItem>
                  <SelectItem value="de">Delaware</SelectItem>
                  <SelectItem value="fl">Florida</SelectItem>
                  <SelectItem value="ga">Georgia</SelectItem>
                  <SelectItem value="hi">Hawaii</SelectItem>
                  <SelectItem value="id">Idaho</SelectItem>
                  <SelectItem value="il">Illinois</SelectItem>
                  <SelectItem value="in">Indiana</SelectItem>
                  <SelectItem value="ia">Iowa</SelectItem>
                  <SelectItem value="ks">Kansas</SelectItem>
                  <SelectItem value="ky">Kentucky</SelectItem>
                  <SelectItem value="la">Louisiana</SelectItem>
                  <SelectItem value="me">Maine</SelectItem>
                  <SelectItem value="md">Maryland</SelectItem>
                  <SelectItem value="ma">Massachusetts</SelectItem>
                  <SelectItem value="mi">Michigan</SelectItem>
                  <SelectItem value="mn">Minnesota</SelectItem>
                  <SelectItem value="ms">Mississippi</SelectItem>
                  <SelectItem value="mo">Missouri</SelectItem>
                  <SelectItem value="mt">Montana</SelectItem>
                  <SelectItem value="ne">Nebraska</SelectItem>
                  <SelectItem value="nv">Nevada</SelectItem>
                  <SelectItem value="nh">New Hampshire</SelectItem>
                  <SelectItem value="nj">New Jersey</SelectItem>
                  <SelectItem value="nm">New Mexico</SelectItem>
                  <SelectItem value="ny">New York</SelectItem>
                  <SelectItem value="nc">North Carolina</SelectItem>
                  <SelectItem value="nd">North Dakota</SelectItem>
                  <SelectItem value="oh">Ohio</SelectItem>
                  <SelectItem value="ok">Oklahoma</SelectItem>
                  <SelectItem value="or">Oregon</SelectItem>
                  <SelectItem value="pa">Pennsylvania</SelectItem>
                  <SelectItem value="ri">Rhode Island</SelectItem>
                  <SelectItem value="sc">South Carolina</SelectItem>
                  <SelectItem value="sd">South Dakota</SelectItem>
                  <SelectItem value="tn">Tennessee</SelectItem>
                  <SelectItem value="tx">Texas</SelectItem>
                  <SelectItem value="ut">Utah</SelectItem>
                  <SelectItem value="vt">Vermont</SelectItem>
                  <SelectItem value="va">Virginia</SelectItem>
                  <SelectItem value="wa">Washington</SelectItem>
                  <SelectItem value="wv">West Virginia</SelectItem>
                  <SelectItem value="wi">Wisconsin</SelectItem>
                  <SelectItem value="wy">Wyoming</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-10"
                placeholder="Enter ZIP"
                value={formData.zipCode}
                onChange={handleChange("zipCode")}
              />
            </div>
          </div>

          {/* Contact section label */}
          <div className="border-b border-border pb-1 text-sm font-medium text-muted-foreground">
            Contact
          </div>

          {/* Contact fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-foreground">
                Contact Name
              </Label>
              <Input
                className="h-10"
                placeholder="Enter Name"
                value={formData.contactName}
                onChange={handleChange("contactName")}
              />
            </div>
            <div className="grid grid-cols-[140px_140px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-foreground">
                Phone
              </Label>
              <div className="flex h-10 items-center justify-center rounded-lg border bg-muted text-xs font-medium text-muted-foreground px-3">
                us&nbsp;&nbsp;+1
              </div>
              <Input
                className="h-10"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange("phone")}
              />
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 pl-9"
                  type="email"
                  placeholder="mail@example.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

