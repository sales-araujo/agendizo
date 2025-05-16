import { headers } from "next/headers"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session

        if (session.client_reference_id) {
          const userId = session.client_reference_id
          const subscriptionId = session.subscription as string

          // Obter detalhes da assinatura
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Determinar o plano e ciclo de cobrança
          let planId: string | null = null
          let billingCycle: "monthly" | "yearly" = "monthly"

          const { data: plans } = await supabase
            .from("subscription_plans")
            .select("id, stripe_price_id_monthly, stripe_price_id_yearly")

          if (plans) {
            for (const plan of plans) {
              if (plan.stripe_price_id_monthly === priceId) {
                planId = plan.id
                billingCycle = "monthly"
                break
              } else if (plan.stripe_price_id_yearly === priceId) {
                planId = plan.id
                billingCycle = "yearly"
                break
              }
            }
          }

          if (planId) {
            // Verificar se o usuário já tem uma assinatura
            const { data: existingSubscription } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("user_id", userId)
              .single()

            if (existingSubscription) {
              // Atualizar assinatura existente
              await supabase
                .from("subscriptions")
                .update({
                  plan_id: planId,
                  status: "active",
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  cancel_at_period_end: subscription.cancel_at_period_end,
                  stripe_subscription_id: subscriptionId,
                  stripe_customer_id: subscription.customer as string,
                  billing_cycle: billingCycle,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingSubscription.id)
            } else {
              // Criar nova assinatura
              await supabase.from("subscriptions").insert({
                user_id: userId,
                plan_id: planId,
                status: "active",
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: subscription.customer as string,
                billing_cycle: billingCycle,
              })
            }

            // Atualizar o perfil do usuário
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                subscription_tier:
                  planId === process.env.STRIPE_BASIC_PRICE_MONTHLY || planId === process.env.STRIPE_BASIC_PRICE_YEARLY
                    ? "basic"
                    : planId === process.env.STRIPE_PRO_PRICE_MONTHLY || planId === process.env.STRIPE_PRO_PRICE_YEARLY
                      ? "professional"
                      : "enterprise",
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId)
          }
        }
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription
        const stripeSubscriptionId = updatedSubscription.id

        // Atualizar assinatura no banco de dados
        const { data: subToUpdate } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single()

        if (subToUpdate) {
          await supabase
            .from("subscriptions")
            .update({
              status:
                updatedSubscription.status === "active"
                  ? "active"
                  : updatedSubscription.status === "past_due"
                    ? "past_due"
                    : updatedSubscription.status === "canceled"
                      ? "cancelled"
                      : "inactive",
              current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: updatedSubscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subToUpdate.id)

          // Atualizar o perfil do usuário
          await supabase
            .from("profiles")
            .update({
              subscription_status:
                updatedSubscription.status === "active"
                  ? "active"
                  : updatedSubscription.status === "past_due"
                    ? "past_due"
                    : updatedSubscription.status === "canceled"
                      ? "cancelled"
                      : "inactive",
              subscription_end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subToUpdate.user_id)
        }
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        const deletedSubscriptionId = deletedSubscription.id

        // Atualizar assinatura no banco de dados
        const { data: subToCancel } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .eq("stripe_subscription_id", deletedSubscriptionId)
          .single()

        if (subToCancel) {
          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", subToCancel.id)

          // Atualizar o perfil do usuário
          await supabase
            .from("profiles")
            .update({
              subscription_status: "inactive",
              updated_at: new Date().toISOString(),
            })
            .eq("id", subToCancel.user_id)
        }
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Webhook error", { status: 400 })
  }
}
