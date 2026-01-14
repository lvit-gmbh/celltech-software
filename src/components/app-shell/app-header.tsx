"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Bell, Moon, Sun } from "lucide-react"
import ProfileDropdown from "@/components/shadcn-studio/blocks/dropdown-profile"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useUIStore } from "@/stores/ui-store"

export function AppHeader() {
  const darkMode = useUIStore((state) => state.darkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Left Section - Only Sidebar Trigger */}
        <SidebarTrigger className="h-9 w-9" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2">
            {darkMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <ProfileDropdown
            trigger={
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                    SA
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}
