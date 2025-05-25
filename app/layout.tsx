import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Agendizo - Sistema de Agendamento Online",
  description: "Simplifique o agendamento do seu negócio com nossa plataforma completa e intuitiva."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              {children}
              <Toaster />
              <SonnerToaster richColors />
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
