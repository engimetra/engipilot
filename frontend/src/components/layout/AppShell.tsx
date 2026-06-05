"use client"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { NotificationToast } from "@/components/layout/NotificationToast"

const SHELL_FREE = ["login", "landing", "register"]
const NON_DEFAULT_LOCALES = ["ar", "en"]

function isShellFree(pathname: string): boolean {
  if (pathname === "/") return true
  const parts = pathname.split("/").filter(Boolean)
  const segment = NON_DEFAULT_LOCALES.includes(parts[0]) ? parts[1] : parts[0]
  return !segment || SHELL_FREE.includes(segment)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  if (isShellFree(pathname)) return <>{children}</>

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: fixed on desktop, drawer on mobile/tablet */}
      <div className={[
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>

      <NotificationToast />
    </div>
  )
}
