import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Truck,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  Ship,
  Store,
  LogIn,
  Bug,
  FlaskConical,
  ArrowRight,
} from "lucide-react"

const appPages = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Trailer Orders", href: "/trailer-orders", icon: ShoppingCart },
  { title: "Build Schedule", href: "/build-schedule", icon: Wrench },
  { title: "Ship Schedule", href: "/ship-schedule", icon: Truck },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Pricing", href: "/pricing", icon: DollarSign },
  { title: "Reporting", href: "/reporting", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
]

const contactPages = [
  { title: "Dealers", href: "/contacts/dealers", icon: Building2 },
  { title: "Shipping Companies", href: "/contacts/shipping-companies", icon: Ship },
  { title: "Vendors", href: "/contacts/vendors", icon: Store },
]

const otherPages = [
  { title: "Login", href: "/auth/login", icon: LogIn },
  { title: "Debug", href: "/debug", icon: Bug },
  { title: "Test", href: "/test", icon: FlaskConical },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Header with Logo */}
        <div className="flex flex-col items-center space-y-6">
          <Image
            src="/logo.png"
            alt="Celltech Logo"
            height={48}
            width={240}
            className="h-12 w-auto object-contain"
            priority
          />
          <p className="text-muted-foreground text-lg">Trailer Management Application</p>
        </div>

        {/* Quick Access CTA */}
        <div className="flex justify-center">
          <Link
            href="/trailer-orders"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold text-lg">Zur Anwendung</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Main App Pages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80 px-1">Hauptanwendung</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {appPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent hover:border-accent transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-background transition-colors">
                  <page.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="font-medium text-sm">{page.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Contacts */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80 px-1 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contactPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card hover:bg-accent hover:border-accent transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-background transition-colors">
                  <page.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="font-medium text-sm">{page.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Other Pages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80 px-1">Weitere Seiten</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-accent hover:border-accent transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-background transition-colors">
                  <page.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="font-medium text-sm text-muted-foreground group-hover:text-foreground transition-colors">{page.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            production v0.1.10 (Live)
          </p>
        </footer>
      </div>
    </div>
  )
}
