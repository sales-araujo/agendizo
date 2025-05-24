"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface DashboardShellProps {
  children: React.ReactNode
}

function DashboardShellHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 flex flex-col gap-2">{children}</div>
}

function DashboardShellTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold">{children}</h1>
}

function DashboardShellDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>
}

function DashboardShellContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsSidebarOpen(!event.detail.isCollapsed)
    }
    window.addEventListener("sidebar-toggle" as any, handleSidebarToggle)
    return () => {
      window.removeEventListener("sidebar-toggle" as any, handleSidebarToggle)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 ease-in-out",
          isSidebarOpen ? "lg:ml-[250px] md:ml-[70px]" : "lg:ml-[70px] md:ml-0",
          "ml-0"
        )}
      >
        <DashboardHeader>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DashboardHeader>
        <main className="min-h-[calc(100vh-4rem)] w-full">
          <div className="h-full w-full p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

DashboardShell.Header = DashboardShellHeader
DashboardShell.Title = DashboardShellTitle
DashboardShell.Description = DashboardShellDescription
DashboardShell.Content = DashboardShellContent
