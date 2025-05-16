import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookingPage } from "@/components/booking/booking-page"

export const revalidate = 3600 // Revalidar a cada hora

export default async function BusinessPage({ params }) {
  const { slug } = params
  const supabase = createClient()

  try {
    // Buscar negócio pelo slug
    const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", slug).single()

    if (error || !business) {
      console.error("Error fetching business:", error)
      notFound()
    }

    // Buscar serviços do negócio
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .order("price", { ascending: true })

    if (servicesError) {
      console.error("Error fetching services:", servicesError)
    }

    // Buscar horários de funcionamento
    const { data: workingHours, error: workingHoursError } = await supabase
      .from("working_hours")
      .select("*")
      .eq("business_id", business.id)

    if (workingHoursError) {
      console.error("Error fetching working hours:", workingHoursError)
    }

    // Buscar feriados
    const { data: holidays, error: holidaysError } = await supabase
      .from("holidays")
      .select("*")
      .eq("business_id", business.id)
      .gte("date", new Date().toISOString().split("T")[0])

    if (holidaysError) {
      console.error("Error fetching holidays:", holidaysError)
    }

    // Buscar perfil do proprietário para redes sociais
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("social_media")
      .eq("id", business.owner_id)
      .maybeSingle()

    if (profileError && !profileError.message.includes("No rows found")) {
      console.error("Error fetching profile:", profileError)
    }

    // Buscar avaliações
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (feedbacksError) {
      console.error("Error fetching feedbacks:", feedbacksError)
    }

    // Calcular média das avaliações
    const rating = feedbacks?.length ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length : 0

    return (
      <BookingPage
        business={business}
        services={services || []}
        workingHours={workingHours || []}
        holidays={holidays || []}
        feedbacks={feedbacks || []}
        rating={rating}
        socialMedia={profile?.social_media || {}}
      />
    )
  } catch (error) {
    console.error("Error in BusinessPage:", error)
    notFound()
  }
}
