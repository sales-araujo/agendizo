import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AppointmentAutoComplete } from "@/components/dashboard/appointment-auto-complete"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Toaster } from "@/components/ui/toaster"
import { DashboardThemeProvider } from "@/lib/providers/dashboard-theme-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardThemeProvider>
      <DashboardShell>
        {children}
        <Toaster />
      </DashboardShell>
    </DashboardThemeProvider>
  )
}
