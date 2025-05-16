import type React from "react"

interface PageShellProps {
  children: React.ReactNode
}

interface HeaderProps {
  children: React.ReactNode
}

interface TitleProps {
  children: React.ReactNode
}

interface DescriptionProps {
  children: React.ReactNode
}

interface ContentProps {
  children: React.ReactNode
}

function PageShellHeader({ children }: HeaderProps) {
  return <div className="flex flex-col gap-2 mb-6">{children}</div>
}

function PageShellTitle({ children }: TitleProps) {
  return <h1 className="text-2xl font-bold">{children}</h1>
}

function PageShellDescription({ children }: DescriptionProps) {
  return <p className="text-muted-foreground">{children}</p>
}

function PageShellContent({ children }: ContentProps) {
  return <div className="space-y-6">{children}</div>
}

export function PageShell({ children }: PageShellProps) {
  return <div className="space-y-6">{children}</div>
}

PageShell.Header = PageShellHeader
PageShell.Title = PageShellTitle
PageShell.Description = PageShellDescription
PageShell.Content = PageShellContent 