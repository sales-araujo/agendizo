'use client'

import { Calendar, AlertTriangle } from "lucide-react"

interface EmptyPlaceholderProps {
  children: React.ReactNode
}

export function EmptyPlaceholder({ children }: EmptyPlaceholderProps) {
  return (
    <div className="flex min-h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({ name }: { name: string }) {
  const icons = {
    calendar: Calendar,
    warning: AlertTriangle,
  }

  const Icon = icons[name as keyof typeof icons]

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
      <Icon className="h-10 w-10 text-muted-foreground" />
    </div>
  )
}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-4 text-lg font-semibold">{children}</h3>
}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-center text-sm text-muted-foreground">{children}</p>
} 