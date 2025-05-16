import { createClient } from "@/lib/supabase/client"
import type {
  Appointment,
  AppointmentStats,
  Business,
  Client,
  Service,
  Subscription,
  SubscriptionPlan,
  User,
  Feedback,
} from "@/lib/types"

// Perfil do usuário
export async function getUserProfile(): Promise<User | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Buscar detalhes adicionais do perfil
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return {
        ...user,
        id: user.id,
        full_name: user.user_metadata?.full_name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        email: user.email || "",
      } as User
    }

    return {
      ...user,
      ...profile,
    } as User
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Atualizar perfil do usuário
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User | null> {
  const supabase = createClient()

  try {
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error
    return updatedProfile
  } catch (error) {
    console.error("Error updating user profile:", error)
    return null
  }
}

// Negócios
export async function getBusinessByUserId(userId: string): Promise<Business[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return []
  }
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching business:", error)
    return null
  }
}

// Adicionar a função getBusiness que está faltando
export async function getBusiness(id: string): Promise<Business | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching business:", error)
    return null
  }
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle()

    if (error) {
      console.error("Error fetching business by slug:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching business by slug:", error)
    return null
  }
}

// Serviços
export async function getServices(businessId: string): Promise<Service[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

// Clientes
export async function getClients(
  businessId: string,
  page = 1,
  limit = 10,
  search?: string,
): Promise<{ clients: Client[]; total: number }> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    let query = supabase.from("clients").select("*", { count: "exact" }).eq("business_id", businessId)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query.order("name", { ascending: true }).range(offset, offset + limit - 1)

    if (error) throw error
    return { clients: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error fetching clients:", error)
    return { clients: [], total: 0 }
  }
}

// Agendamentos
export async function getAppointments(
  businessId: string,
  page = 1,
  limit = 10,
  filters?: {
    startDate?: string
    endDate?: string
    status?: string
    clientId?: string
    serviceId?: string
  },
): Promise<{ appointments: Appointment[]; total: number }> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from("appointments")
      .select("*, service:services(*), client:clients(*)", { count: "exact" })
      .eq("business_id", businessId)

    if (filters?.startDate) {
      query = query.gte("start_time", filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte("start_time", filters.endDate)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.clientId) {
      query = query.eq("client_id", filters.clientId)
    }

    if (filters?.serviceId) {
      query = query.eq("service_id", filters.serviceId)
    }

    const { data, error, count } = await query
      .order("start_time", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { appointments: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return { appointments: [], total: 0 }
  }
}

export async function getUpcomingAppointments(businessId: string, limit = 5): Promise<Appointment[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, service:services(*), client:clients(*)")
      .eq("business_id", businessId)
      .gte("start_time", now)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error)
    return []
  }
}

export async function getAppointmentStats(
  businessId: string,
  startDate?: string,
  endDate?: string,
): Promise<AppointmentStats> {
  const supabase = createClient()

  try {
    let query = supabase.from("appointments").select("status").eq("business_id", businessId)

    if (startDate) {
      query = query.gte("start_time", startDate)
    }

    if (endDate) {
      query = query.lte("start_time", endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const stats: AppointmentStats = {
      total: data.length,
      pending: data.filter((a) => a.status === "pending").length,
      confirmed: data.filter((a) => a.status === "confirmed").length,
      cancelled: data.filter((a) => a.status === "cancelled").length,
      completed: data.filter((a) => a.status === "completed").length,
    }

    return stats
  } catch (error) {
    console.error("Error fetching appointment stats:", error)
    return { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  }
}

// Feedbacks
export async function getFeedbacks(
  businessId: string,
  page = 1,
  limit = 10,
): Promise<{ feedbacks: Feedback[]; total: number }> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  try {
    const { data, error, count } = await supabase
      .from("feedbacks")
      .select("*, client:clients(*)", { count: "exact" })
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { feedbacks: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return { feedbacks: [], total: 0 }
  }
}

// Planos de assinatura
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_monthly", { ascending: true })

    if (error) {
      console.error("Error fetching subscription plans:", error)
      return []
    }

    // Adicionar features com base no plano
    return (
      data.map((plan) => {
        let features: string[] = []

        if (plan.id === "basic") {
          features = [
            "Até 50 agendamentos por mês",
            "1 usuário",
            "1 negócio",
            "Agendamento online",
            "Lembretes por email",
            "Suporte por email",
            "7 dias grátis",
          ]
        } else if (plan.id === "pro") {
          features = [
            "Agendamentos ilimitados",
            "Até 3 usuários",
            "Até 3 negócios",
            "Agendamento online",
            "Lembretes por email e SMS",
            "Integração com Google Calendar",
            "Relatórios básicos",
            "Suporte prioritário",
            "7 dias grátis",
          ]
        } else if (plan.id === "enterprise") {
          features = [
            "Agendamentos ilimitados",
            "Usuários ilimitados",
            "Negócios ilimitados",
            "Agendamento online",
            "Lembretes por email, SMS e WhatsApp",
            "Integração com Google Calendar",
            "Relatórios avançados",
            "API personalizada",
            "Suporte VIP",
            "7 dias grátis",
          ]
        }

        return {
          ...plan,
          features,
        }
      }) || []
    )
  } catch (error) {
    console.error("Error in getSubscriptionPlans:", error)
    return []
  }
}

export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", planId).maybeSingle()

    if (error) {
      console.error("Erro ao buscar plano:", error)
      return null
    }

    if (!data) {
      console.error("Plano não encontrado:", planId)
      return null
    }

    // Definir features com base no plano
    let features: string[] = []

    if (data.id === "basic") {
      features = [
        "Até 50 agendamentos por mês",
        "1 usuário",
        "1 negócio",
        "Agendamento online",
        "Lembretes por email",
        "Suporte por email",
        "7 dias grátis",
      ]
    } else if (data.id === "pro") {
      features = [
        "Agendamentos ilimitados",
        "Até 3 usuários",
        "Até 3 negócios",
        "Agendamento online",
        "Lembretes por email e SMS",
        "Integração com Google Calendar",
        "Relatórios básicos",
        "Suporte prioritário",
        "7 dias grátis",
      ]
    } else if (data.id === "enterprise") {
      features = [
        "Agendamentos ilimitados",
        "Usuários ilimitados",
        "Negócios ilimitados",
        "Agendamento online",
        "Lembretes por email, SMS e WhatsApp",
        "Integração com Google Calendar",
        "Relatórios avançados",
        "API personalizada",
        "Suporte VIP",
        "7 dias grátis",
      ]
    }

    return {
      ...data,
      features,
    }
  } catch (error) {
    console.error("Error in getSubscriptionPlanById:", error)
    return null
  }
}

// Assinatura do usuário
export async function getUserSubscription(userId?: string): Promise<Subscription | null> {
  const supabase = createClient()

  try {
    // Se não for fornecido um ID, tentar pegar do usuário atual
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        return null
      }
      userId = userData.user.id
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) throw error

    // Se não houver assinatura, retornar um objeto de assinatura padrão
    if (!data) {
      return {
        id: null,
        user_id: userId,
        plan: {
          id: "free",
          name: "free",
          price_monthly: 0,
          price_yearly: 0,
          features: ["Versão gratuita do Agendizo"],
        },
        status: "inactive",
        amount: 0,
        cycle: "monthly",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        invoices: [],
      } as Subscription
    }

    return data
  } catch (error) {
    console.error("Error fetching user subscription:", error)
    return null
  }
}
