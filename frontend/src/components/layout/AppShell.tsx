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
  const parts   = pathname.split("/").filter(Boolean)
  const segment = NON_DEFAULT_LOCALES.includes(parts[0]) ? parts[1] : parts[0]
  return !segment || SHELL_FREE.includes(segment)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  if (isShellFree(pathname)) return <>{children}</>

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--color-background)",
        overflow: "hidden",
      }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 30,
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
          className="page-enter sm:p-5 lg:p-6"
        >
          {children}
        </main>
      </div>

      <NotificationToast />
    </div>
  )
}
