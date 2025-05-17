"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, CheckCircle, Clock, XCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

interface ChartDataItem {
  label: string
  value: number
  color: string
  icon: JSX.Element
}

// Componente de gráfico de barras simples
function BarChart({ data }: { data: ChartDataItem[] }) {
  const total = data.reduce((acc: number, item: ChartDataItem) => acc + item.value, 0)

  return (
    <div className="mt-4">
      {data.map((item: ChartDataItem, index: number) => (
        <div key={index} className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium flex items-center">
              {item.icon}
              <span className="ml-1">{item.label}</span>
            </span>
            <span className="text-sm font-medium">
              {item.value} ({total ? Math.round((item.value / total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${total ? (item.value / total) * 100 : 0}%`,
                backgroundColor: item.color,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface MetricsChartProps {
  businessId: string
}

export function MetricsChart({ businessId }: MetricsChartProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [metricsData, setMetricsData] = useState({
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    total: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!businessId) {
        setIsLoading(false)
        return
      }

      try {
        // Buscar agendamentos do negócio
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("status")
          .eq("business_id", businessId)

        if (error) throw error

        if (!appointments) {
          setIsLoading(false)
          return
        }

        // Calcular métricas
        const confirmed = appointments.filter((a) => a.status === "confirmed").length
        const pending = appointments.filter((a) => a.status === "pending").length
        const cancelled = appointments.filter((a) => a.status === "cancelled").length
        const completed = appointments.filter((a) => a.status === "completed").length
        const total = appointments.length

        setMetricsData({
          confirmed,
          pending,
          cancelled,
          completed,
          total,
        })
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [businessId])

  // Preparar dados para o gráfico
  const chartData = [
    {
      label: "Confirmados",
      value: metricsData.confirmed,
      color: "#10b981", // verde
      icon: <CheckCircle className="h-3 w-3 text-green-500" />,
    },
    {
      label: "Pendentes",
      value: metricsData.pending,
      color: "#f59e0b", // âmbar
      icon: <Clock className="h-3 w-3 text-amber-500" />,
    },
    {
      label: "Cancelados",
      value: metricsData.cancelled,
      color: "#ef4444", // vermelho
      icon: <XCircle className="h-3 w-3 text-red-500" />,
    },
    {
      label: "Concluídos",
      value: metricsData.completed,
      color: "#3b82f6", // azul
      icon: <CheckCircle className="h-3 w-3 text-blue-500" />,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Activity className="h-5 w-5 mr-2 text-[#eb07a4]" />
          Métricas de Agendamentos
        </CardTitle>
        <CardDescription>Visão geral do status dos seus agendamentos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : metricsData.total === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhum agendamento encontrado. Comece a agendar para ver suas métricas.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 rounded-md bg-muted">
                <h4 className="text-sm font-medium text-muted-foreground">Total</h4>
                <p className="text-2xl font-bold">{metricsData.total}</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted">
                <h4 className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</h4>
                <p className="text-2xl font-bold">
                  {metricsData.total ? Math.round((metricsData.completed / metricsData.total) * 100) : 0}%
                </p>
              </div>
            </div>
            <BarChart data={chartData} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
