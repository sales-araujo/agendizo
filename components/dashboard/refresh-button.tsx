"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RefreshButton({ onClick, className = "" }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onClick()
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleRefresh} className={className} disabled={isRefreshing}>
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      <span className="sr-only">Atualizar</span>
    </Button>
  )
}
