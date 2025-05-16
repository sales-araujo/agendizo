import { Skeleton } from "@/components/ui/skeleton"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Carregando suas informações..." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(null)
          .map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[350px] rounded-xl" />
        <Skeleton className="col-span-3 h-[350px] rounded-xl" />
      </div>
    </DashboardShell>
  )
}
