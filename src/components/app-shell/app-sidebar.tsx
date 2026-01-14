"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, LogOut } from "lucide-react"
import { navigation } from "@/lib/navigation"
import { useUIStore } from "@/stores/ui-store"
import { CelltechLogo } from "./celltech-logo"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const pathname = usePathname()
  const { contactsDropdownOpen, setContactsDropdownOpen } = useUIStore()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Schließe Dropdown beim Einklappen der Sidebar
  useEffect(() => {
    if (isCollapsed) {
      setContactsDropdownOpen(false)
      // Verhindere Tooltips während der Transition
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 300) // Warte auf die Sidebar-Transition (200ms + Puffer)
      return () => clearTimeout(timer)
    } else {
      setIsTransitioning(false)
    }
  }, [isCollapsed, setContactsDropdownOpen])

  const isActive = (href: string) => {
    if (href === "/contacts") {
      return pathname.startsWith("/contacts")
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      <Sidebar className="border-r-0" collapsible="icon">
        {/* Header with Logo - Always visible with transition */}
        <SidebarHeader className="p-4 pb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center transition-all duration-300 w-full group-data-[collapsible=icon]:w-full"
          >
            <CelltechLogo size={isCollapsed ? "sm" : "md"} />
          </Link>
        </SidebarHeader>

        <Separator className="mx-4 w-auto" />

        {/* Navigation */}
        <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0">
          <SidebarGroup className="group-data-[collapsible=icon]:p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
                {navigation.map((item) => {
                  if (item.children) {
                    // Wenn Sidebar eingeklappt ist, verwende DropdownMenu
                    if (isCollapsed) {
                      return (
                        <DropdownMenu key={item.href} open={contactsDropdownOpen} onOpenChange={setContactsDropdownOpen}>
                          <SidebarMenuItem>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive(item.href)}
                                    className="h-10 rounded-xl transition-all hover:bg-accent group-data-[collapsible=icon]:justify-center"
                                  >
                                    <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" strokeWidth={2.5} />
                                    <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                                  </SidebarMenuButton>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              {!isTransitioning && (
                                <TooltipContent side="right">
                                  <p>{item.title}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              sideOffset={8}
                              className="min-w-[200px] rounded-xl"
                            >
                              {item.children.map((child) => (
                                <DropdownMenuItem key={child.href} asChild>
                                  <Link
                                    href={child.href}
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => setContactsDropdownOpen(false)}
                                  >
                                    <child.icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                                    <span>{child.title}</span>
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </SidebarMenuItem>
                        </DropdownMenu>
                      )
                    }

                    // Wenn Sidebar ausgeklappt ist, verwende Collapsible
                    return (
                      <Collapsible
                        key={item.href}
                        asChild
                        open={contactsDropdownOpen}
                        onOpenChange={setContactsDropdownOpen}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive(item.href)}
                              className="h-10 rounded-xl transition-all hover:bg-accent group-data-[collapsible=icon]:justify-center"
                            >
                              <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" strokeWidth={2.5} />
                              <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                              <ChevronDown
                                className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                                  contactsDropdownOpen ? "rotate-180" : ""
                                }`}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-1">
                            <SidebarMenuSub className="ml-4 border-l-2 border-muted pl-2 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:pl-0">
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(child.href)}
                                    className="h-9 rounded-lg"
                                  >
                                    <Link href={child.href} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                                      <child.icon className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:mx-auto" strokeWidth={2.5} />
                                      <span className="group-data-[collapsible=icon]:hidden">{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.href} className={item.disabled ? "cursor-not-allowed" : ""}>
                      <Tooltip>
                        <TooltipTrigger asChild className={item.disabled ? "cursor-not-allowed" : ""}>
                          {item.disabled ? (
                            <SidebarMenuButton
                              disabled
                              isActive={false}
                              className="h-10 rounded-xl transition-all opacity-50 cursor-not-allowed group-data-[collapsible=icon]:justify-center"
                            >
                              <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto cursor-not-allowed" strokeWidth={2.5} />
                              <span className="font-medium group-data-[collapsible=icon]:hidden cursor-not-allowed">{item.title}</span>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(item.href)}
                              className="h-10 rounded-xl transition-all hover:bg-accent group-data-[collapsible=icon]:justify-center"
                            >
                              <Link href={item.href} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                                <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" strokeWidth={2.5} />
                                <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          )}
                        </TooltipTrigger>
                        {isCollapsed && !isTransitioning && (
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="p-4 pt-2">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/50 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9 rounded-lg shrink-0">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              SA
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold truncate">Samy Abuaisheh</p>
            <p className="text-xs text-muted-foreground truncate">
              s.abuaisheh@lvit.de
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto h-8 w-8 rounded-lg group-data-[collapsible=icon]:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {isCollapsed && !isTransitioning && (
              <TooltipContent side="right">
                <p>Abmelden</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
