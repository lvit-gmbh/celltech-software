import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppHeader } from "@/components/app-shell/app-header"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

