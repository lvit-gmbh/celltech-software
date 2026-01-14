"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Contacts dropdown state
  contactsDropdownOpen: boolean
  setContactsDropdownOpen: (open: boolean) => void
  toggleContactsDropdown: () => void

  // Page-specific filter states
  trailerOrdersShowClosed: boolean
  setTrailerOrdersShowClosed: (show: boolean) => void

  shipScheduleView: "week" | "month"
  setShipScheduleView: (view: "week" | "month") => void

  // Active tab states per page
  activeTabs: Record<string, string>
  setActiveTab: (page: string, tab: string) => void

  // Dark mode state
  darkMode: boolean
  setDarkMode: (enabled: boolean) => void
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Contacts dropdown
      contactsDropdownOpen: false,
      setContactsDropdownOpen: (open) => set({ contactsDropdownOpen: open }),
      toggleContactsDropdown: () =>
        set((state) => ({
          contactsDropdownOpen: !state.contactsDropdownOpen,
        })),

      // Trailer Orders
      trailerOrdersShowClosed: false,
      setTrailerOrdersShowClosed: (show) =>
        set({ trailerOrdersShowClosed: show }),

      // Ship Schedule
      shipScheduleView: "week",
      setShipScheduleView: (view) => set({ shipScheduleView: view }),

      // Active tabs
      activeTabs: {},
      setActiveTab: (page, tab) =>
        set((state) => ({
          activeTabs: { ...state.activeTabs, [page]: tab },
        })),

      // Dark mode
      darkMode: false,
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
)

