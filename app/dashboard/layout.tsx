import type React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { DashboardThemeProvider } from '@/lib/providers/dashboard-theme-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardThemeProvider>
      <DashboardShell>{children}</DashboardShell>
      <ShadcnToaster />
      <SonnerToaster richColors closeButton />
    </DashboardThemeProvider>
  )
}
