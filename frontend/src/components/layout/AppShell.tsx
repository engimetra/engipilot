"use client"
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

  if (isShellFree(pathname)) return <>{children}</>

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
      <NotificationToast />
    </div>
  )
}
