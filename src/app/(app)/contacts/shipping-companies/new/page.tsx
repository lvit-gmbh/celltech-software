"use client"

import { useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Save } from "lucide-react"

export default function NewShippingCompanyPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    companyName: "",
    contact: "",
    phoneNumber: "",
    email: "",
    states: "default",
    minMiles: 0,
    notes: "",
  })

  const handleChange =
    (field: keyof typeof formData) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "number" ? Number(e.target.value) : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, states: value }))
  }

  const handleSave = () => {
    // TODO: Persist new shipping company via Supabase/API
    // For now just go back to shipping companies overview
    router.push("/contacts/shipping-companies")
  }

  const handleCancel = () => {
    router.push("/contacts/shipping-companies")
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden px-6 pt-6 pb-6 gap-4">
      {/* Header with Title */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold text-foreground">New Shipping Company</h1>
      </div>

      {/* Content - Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Form Section */}
        <Card className="rounded-2xl shadow-none border flex-shrink-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Company Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.companyName}
                    onChange={handleChange("companyName")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Contact <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.contact}
                    onChange={handleChange("contact")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Phone Number</Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.phoneNumber}
                    onChange={handleChange("phoneNumber")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">E-Mail</Label>
                  <Input
                    className="h-10"
                    type="email"
                    placeholder="Enter value"
                    value={formData.email}
                    onChange={handleChange("email")}
                  />
                </div>
              </div>

              {/* Right Column - Shipping Details & Notes */}
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">States</Label>
                  <Select value={formData.states} onValueChange={handleSelectChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (All)</SelectItem>
                      <SelectItem value="alabama">Alabama</SelectItem>
                      <SelectItem value="alaska">Alaska</SelectItem>
                      <SelectItem value="arizona">Arizona</SelectItem>
                      <SelectItem value="arkansas">Arkansas</SelectItem>
                      <SelectItem value="california">California</SelectItem>
                      <SelectItem value="colorado">Colorado</SelectItem>
                      <SelectItem value="connecticut">Connecticut</SelectItem>
                      <SelectItem value="delaware">Delaware</SelectItem>
                      <SelectItem value="florida">Florida</SelectItem>
                      <SelectItem value="georgia">Georgia</SelectItem>
                      <SelectItem value="hawaii">Hawaii</SelectItem>
                      <SelectItem value="idaho">Idaho</SelectItem>
                      <SelectItem value="illinois">Illinois</SelectItem>
                      <SelectItem value="indiana">Indiana</SelectItem>
                      <SelectItem value="iowa">Iowa</SelectItem>
                      <SelectItem value="kansas">Kansas</SelectItem>
                      <SelectItem value="kentucky">Kentucky</SelectItem>
                      <SelectItem value="louisiana">Louisiana</SelectItem>
                      <SelectItem value="maine">Maine</SelectItem>
                      <SelectItem value="maryland">Maryland</SelectItem>
                      <SelectItem value="massachusetts">Massachusetts</SelectItem>
                      <SelectItem value="michigan">Michigan</SelectItem>
                      <SelectItem value="minnesota">Minnesota</SelectItem>
                      <SelectItem value="mississippi">Mississippi</SelectItem>
                      <SelectItem value="missouri">Missouri</SelectItem>
                      <SelectItem value="montana">Montana</SelectItem>
                      <SelectItem value="nebraska">Nebraska</SelectItem>
                      <SelectItem value="nevada">Nevada</SelectItem>
                      <SelectItem value="new-hampshire">New Hampshire</SelectItem>
                      <SelectItem value="new-jersey">New Jersey</SelectItem>
                      <SelectItem value="new-mexico">New Mexico</SelectItem>
                      <SelectItem value="new-york">New York</SelectItem>
                      <SelectItem value="north-carolina">North Carolina</SelectItem>
                      <SelectItem value="north-dakota">North Dakota</SelectItem>
                      <SelectItem value="ohio">Ohio</SelectItem>
                      <SelectItem value="oklahoma">Oklahoma</SelectItem>
                      <SelectItem value="oregon">Oregon</SelectItem>
                      <SelectItem value="pennsylvania">Pennsylvania</SelectItem>
                      <SelectItem value="rhode-island">Rhode Island</SelectItem>
                      <SelectItem value="south-carolina">South Carolina</SelectItem>
                      <SelectItem value="south-dakota">South Dakota</SelectItem>
                      <SelectItem value="tennessee">Tennessee</SelectItem>
                      <SelectItem value="texas">Texas</SelectItem>
                      <SelectItem value="utah">Utah</SelectItem>
                      <SelectItem value="vermont">Vermont</SelectItem>
                      <SelectItem value="virginia">Virginia</SelectItem>
                      <SelectItem value="washington">Washington</SelectItem>
                      <SelectItem value="west-virginia">West Virginia</SelectItem>
                      <SelectItem value="wisconsin">Wisconsin</SelectItem>
                      <SelectItem value="wyoming">Wyoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Min. Miles</Label>
                  <Input
                    className="h-10"
                    type="number"
                    placeholder="0"
                    value={formData.minMiles}
                    onChange={handleChange("minMiles")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <Label className="text-sm font-medium text-foreground pt-2.5">Notes</Label>
                  <Textarea
                    placeholder="Enter value"
                    value={formData.notes}
                    onChange={handleChange("notes")}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons at bottom of form */}
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
