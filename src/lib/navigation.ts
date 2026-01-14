import {
  LayoutDashboard,
  ClipboardList,
  Hammer,
  Truck,
  Users,
  Package,
  Coins,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
  Package2,
  Store,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
  children?: NavItem[]
  disabled?: boolean
}

export const navigation: NavItem[] = [
  {
    title: "Trailer Orders",
    href: "/trailer-orders",
    icon: ClipboardList,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Build Schedule",
    href: "/build-schedule",
    icon: Hammer,
  },
  {
    title: "Ship Schedule",
    href: "/ship-schedule",
    icon: Truck,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
    children: [
      {
        title: "Dealers",
        href: "/contacts/dealers",
        icon: Building2,
      },
      {
        title: "Shipping Companies",
        href: "/contacts/shipping-companies",
        icon: Package2,
      },
      {
        title: "Vendors",
        href: "/contacts/vendors",
        icon: Store,
      },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Pricing",
    href: "/pricing",
    icon: Coins,
  },
  {
    title: "Reporting",
    href: "/reporting",
    icon: BarChart3,
    disabled: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

