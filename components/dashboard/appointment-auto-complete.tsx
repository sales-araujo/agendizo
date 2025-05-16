"use client"

import { useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

export function AppointmentAutoComplete() {
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkAndCompleteAppointments = async () => {
      try {
        // Get all non-completed appointments that have passed their end time
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("*")
          .neq("status", "completed")
          .neq("status", "cancelled")
          .lt("end_time", new Date().toISOString())

        if (error) throw error

        // Update each appointment to completed status
        if (appointments && appointments.length > 0) {
          const updates = appointments.map((appointment) =>
            supabase
              .from("appointments")
              .update({ status: "completed" })
              .eq("id", appointment.id)
          )

          await Promise.all(updates)
        }
      } catch (error) {
        console.error("Error auto-completing appointments:", error)
      }
    }

    // Check every minute
    const interval = setInterval(checkAndCompleteAppointments, 60000)

    // Initial check
    checkAndCompleteAppointments()

    return () => clearInterval(interval)
  }, [supabase])

  return null
} 