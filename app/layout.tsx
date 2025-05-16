import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Agendizo - Sistema de Agendamento Online",
  description: "Simplifique o agendamento do seu negócio com nossa plataforma completa e intuitiva.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
