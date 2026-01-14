"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { X, Save } from "lucide-react"

type DealerTemplateType = "brightview" | "standard"

export default function NewDealerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const templateType = useMemo<DealerTemplateType>(() => {
    const t = searchParams.get("type")
    return t === "brightview" ? "brightview" : "standard"
  }, [searchParams])

  const [formData, setFormData] = useState({
    branchName: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    urn: "",
    rfpIdentification: "",
    branchNumber: "",
    miles: 0,
    shippingCostPerMile: 0,
    shippingCostTotal: 0,
    discount: 0,
    active: true,
  })

  const handleChange =
    (field: keyof typeof formData) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === "number" ? Number(e.target.value) : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleSave = () => {
    // TODO: Persist new dealer via Supabase/API
    // For now just go back to dealers overview
    router.push("/contacts/dealers")
  }

  const handleCancel = () => {
    router.push("/contacts/dealers")
  }

  // Empty orders array for now - will be populated from API later
  const orders: any[] = [];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden px-6 pt-6 pb-6 gap-4">
      {/* Header with Title */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold text-foreground">New Dealer</h1>
      </div>

      {/* Content - Form and Table */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        {/* Form Section */}
        <Card className="rounded-2xl shadow-none border flex-shrink-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Branch Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.branchName}
                    onChange={handleChange("branchName")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Contact</Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.contact}
                    onChange={handleChange("contact")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Phone</Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.phone}
                    onChange={handleChange("phone")}
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

              {/* Right column */}
              <div className="space-y-3">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleChange("address")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.city}
                    onChange={handleChange("city")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Select an option"
                    value={formData.state}
                    onChange={handleChange("state")}
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">
                    ZIP Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-10"
                    placeholder="Enter value"
                    value={formData.zipCode}
                    onChange={handleChange("zipCode")}
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Active</Label>
                  <div className="flex items-center">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, active: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-sm font-medium text-foreground">Discount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-10 w-20"
                      type="number"
                      value={formData.discount}
                      onChange={handleChange("discount")}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                {/* BrightView Section with Divider */}
                {templateType === "brightview" && (
                  <div className="relative my-3">
                    <Separator />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                      <Label className="text-sm font-medium text-foreground">BrightView</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal aligned fields: URN/Miles, RFP Identification/Shipping Cost per Mile, Branch #/Shipping Cost TOTAL */}
            {templateType === "brightview" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                {/* Left column - URN, RFP Identification, Branch # */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">URN</Label>
                    <Input
                      className="h-10"
                      placeholder="Enter value"
                      value={formData.urn}
                      onChange={handleChange("urn")}
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">
                      RFP Identification
                    </Label>
                    <Input
                      className="h-10"
                      placeholder="Enter value"
                      value={formData.rfpIdentification}
                      onChange={handleChange("rfpIdentification")}
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">Branch #</Label>
                    <Input
                      className="h-10"
                      placeholder="Enter value"
                      value={formData.branchNumber}
                      onChange={handleChange("branchNumber")}
                    />
                  </div>
                </div>

                {/* Right column - Miles, Shipping Cost per Mile, Shipping Cost TOTAL */}
                <div className="space-y-3">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">Miles</Label>
                    <Input
                      className="h-10"
                      type="number"
                      value={formData.miles}
                      onChange={handleChange("miles")}
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">
                      Shipping Cost per Mile
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-10 flex-1"
                        type="number"
                        step="0.01"
                        value={formData.shippingCostPerMile}
                        onChange={handleChange("shippingCostPerMile")}
                      />
                      <span className="text-sm text-muted-foreground">$</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-sm font-medium text-foreground">
                      Shipping Cost TOTAL
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-10 flex-1"
                        type="number"
                        step="0.01"
                        value={formData.shippingCostTotal}
                        onChange={handleChange("shippingCostTotal")}
                      />
                      <span className="text-sm text-muted-foreground">$</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If not brightview, show URN, RFP Identification, Branch # in left column */}
            {templateType !== "brightview" && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">URN</Label>
                      <Input
                        className="h-10"
                        placeholder="Enter value"
                        value={formData.urn}
                        onChange={handleChange("urn")}
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">
                        RFP Identification
                      </Label>
                      <Input
                        className="h-10"
                        placeholder="Enter value"
                        value={formData.rfpIdentification}
                        onChange={handleChange("rfpIdentification")}
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <Label className="text-sm font-medium text-foreground">Branch #</Label>
                      <Input
                        className="h-10"
                        placeholder="Enter value"
                        value={formData.branchNumber}
                        onChange={handleChange("branchNumber")}
                      />
                    </div>
                  </div>
                  <div></div>
                </div>
              </div>
            )}

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

        {/* Table Section */}
        <Card className="rounded-2xl shadow-none border flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-background">
                  <TableRow>
                    <TableHead className="bg-background">ORD/AST</TableHead>
                    <TableHead className="bg-background">Order date</TableHead>
                    <TableHead className="bg-background">Model</TableHead>
                    <TableHead className="bg-background">VIN</TableHead>
                    <TableHead className="bg-background">Ship date</TableHead>
                    <TableHead className="bg-background">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.asset_no ? `AST ${order.asset_no}` : order.po ? `PO ${order.po}` : "-"}
                        </TableCell>
                        <TableCell>
                          {order.order_date
                            ? new Date(order.order_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{order.model || "-"}</TableCell>
                        <TableCell>{order.vin_num || "-"}</TableCell>
                        <TableCell>
                          {order.ship_date
                            ? new Date(order.ship_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {order.price
                            ? `$${order.price.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

