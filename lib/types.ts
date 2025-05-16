export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  bio?: string
  subscription_status?: string
  subscription_tier?: string
  created_at?: string
  updated_at?: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  type?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  banner_url?: string
  logo_size?: string
  primary_color?: string
  secondary_color?: string
  font_family?: string
  theme?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration: number
  price: number
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  business_id: string
  service_id: string
  client_id: string
  start_time: string
  end_time?: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes?: string
  created_at: string
  updated_at: string
  service?: Service
  client?: Client
}

export interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  completed: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string
  stripe_price_id_yearly: string
  features?: string[]
  created_at?: string
  updated_at?: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at?: string
  amount: number
  currency: string
  interval: string
  created_at: string
  updated_at: string
  plan: SubscriptionPlan
  cycle: "monthly" | "yearly"
  lastFour?: string
  invoices?: {
    id: string
    amount: number
    status: string
    date: string
    url: string
  }[]
}

export interface Feedback {
  id: string
  business_id: string
  client_name: string
  client_email?: string
  rating: number
  comment: string
  created_at: string
  updated_at?: string
  client?: Client
}
