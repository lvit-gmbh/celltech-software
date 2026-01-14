// Type definitions for CELLTECH application
// Phase 1: UI-only types (no backend integration yet)

export interface Order {
  idx: number
  id: number
  dealer_id: number
  order_date: string | null
  fin_date: string | null
  model: string
  color: number
  price: number
  notes: string | null
  order_num: string | null
  spare_tire: boolean | null
  tires_and_wheel: string | null
  build_date: string | null
  next: string | null
  vin_num: string
  stock_num: string | null
  shipment_id: number | null
  brightview: boolean
  template: string | null
  vin_sticker: string | null
  build_notes: string | null
  po: string
  requested_by: string
  description: string
  gas_tank: boolean
  side_door: boolean
  discount_type: string
  discount_percent: number | null
  discount_total: number
  asset_no: number
  tax: number
  beavertail: boolean
  height: string
  sequ: string | null
}

export interface Dealer {
  id: string
  name: string
  dealerContact: string
  contact: string
  phone: string | null
  mail: string | null
  active: boolean
  city: string
  zipCode: string
  discount: number | null
}

export interface ShippingCompany {
  id: string
  name: string
  contact: string
  phone: string
  area: string | string[]
  minDistance: number
  notes: string | null
  mail: string | null
  state: string | null
}

export interface Vendor {
  id: string
  name: string
  contactData: string
  address: string
  zipCode: string
  mail: string | null
  phone: string | null
}

export interface BuildSchedule {
  id: string
  startDate: string
  orderAsset: string
  frame: string
  door: string
  height: string
  dealer: string
  vin: string
  status: string
  buildNotes: string
}

export interface ShipmentOrder {
  id: number
  vin_num: string | null
  modelLabel: string | null
  asset_no?: number | null
  po?: string | null
  order_date?: string | null
  build_date?: string | null
  price?: number
  order_num?: string | null
}

export interface Shipment {
  id: string
  shippingId: string
  dealer: string
  customer: string
  vin: string | null
  hasShipper: boolean
  date: string
  model?: string | null
  assetNo?: number | null
  po?: string | null
  shipperName?: string | null
  status?: string | null
  notes?: string | null
  orders?: ShipmentOrder[]
  shipped?: boolean | null
}

export interface InventoryItem {
  id: string
  partType: string
  label: string
  pn: string
  unit: string
  min: number
  available: number
  onHand: number
  reserved: number
}

export interface PricingItem {
  id: string
  type: string
  name: string
  pn: string
  subtype: string | null
  maxAmount: number | null
  unit: string
  status: string
  pricePerUnit: number
  pricePerUnitBV: number | null
  modelId?: number | null
  optionId?: number | null
  modelName?: string | null
  optionName?: string | null
  fullName?: string | null
}

export interface Model {
  id: string
  size: string
  model: string
  rearDoor: string
  axleRating: string
  axleType: string
  tiresWheels: string
  brightView: boolean
}

export interface FrontendOption {
  id: string
  type: string
  label: string
  value: string
  abbreviation: string | null
}

