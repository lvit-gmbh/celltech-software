"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterOperator = "equals" | "not_equals" | "includes" | "not_includes" | "greater_than" | "less_than" | "greater_equal" | "less_equal"

export type FilterField = "partType" | "label" | "pn" | "unit" | "min" | "available" | "onHand" | "reserved"

export type FilterLogic = "and" | "or"

export interface FilterRule {
  id: string
  field: FilterField
  operator: FilterOperator
  value: string
  logic?: FilterLogic
}

interface InventoryFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (filters: FilterRule[]) => void
}

const FIELD_OPTIONS: { value: FilterField; label: string }[] = [
  { value: "partType", label: "Part Type" },
  { value: "label", label: "Label" },
  { value: "pn", label: "PN" },
  { value: "unit", label: "Unit" },
  { value: "min", label: "Min." },
  { value: "available", label: "Available" },
  { value: "onHand", label: "On Hand" },
  { value: "reserved", label: "Reserved" },
]

const OPERATOR_OPTIONS: { value: FilterOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "includes", label: "includes" },
  { value: "not_includes", label: "not includes" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "greater_equal", label: ">=" },
  { value: "less_equal", label: "<=" },
]

export function InventoryFilterDialog({
  open,
  onOpenChange,
  onApply,
}: InventoryFilterDialogProps) {
  const [rules, setRules] = useState<FilterRule[]>([
    {
      id: "1",
      field: "partType",
      operator: "includes",
      value: "",
    },
  ])

  const addRule = (afterId?: string) => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      field: "partType",
      operator: "includes",
      value: "",
      logic: "and",
    }

    if (afterId) {
      const index = rules.findIndex((r) => r.id === afterId)
      if (index >= 0) {
        const newRules = [...rules]
        newRules.splice(index + 1, 0, newRule)
        setRules(newRules)
      } else {
        setRules([...rules, newRule])
      }
    } else {
      setRules([...rules, newRule])
    }
  }

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id))
  }

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const handleApply = () => {
    onApply(rules.filter((r) => r.value.trim() !== ""))
    onOpenChange(false)
  }

  const handleClear = () => {
    setRules([
      {
        id: "1",
        field: "partType",
        operator: "includes",
        value: "",
      },
    ])
    onApply([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Inventory</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 min-w-[100px]">
                {index === 0 ? (
                  <span className="text-xs font-medium text-foreground">Where</span>
                ) : (
                  <Select
                    value={rule.logic || "and"}
                    onValueChange={(value: FilterLogic) =>
                      updateRule(rule.id, { logic: value })
                    }
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">And</SelectItem>
                      <SelectItem value="or">Or</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Select
                value={rule.field}
                onValueChange={(value: FilterField) =>
                  updateRule(rule.id, { field: value })
                }
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={rule.operator}
                onValueChange={(value: FilterOperator) =>
                  updateRule(rule.id, { operator: value })
                }
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Enter value"
                className="flex-1 h-8"
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-opacity hover:opacity-80"
                onClick={() => removeRule(rule.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 transition-colors"
            onClick={() => addRule()}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleClear} className="text-destructive">
            Clear filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
