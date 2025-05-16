import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
})

export const getStripeSession = async ({
  priceId,
  successUrl,
  cancelUrl,
  clientReferenceId,
  customerEmail,
}: {
  priceId: string
  successUrl: string
  cancelUrl: string
  clientReferenceId: string
  customerEmail?: string
}) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: clientReferenceId,
    customer_email: customerEmail,
    locale: "pt-BR",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: {
      userId: clientReferenceId,
    },
  })

  return session
}

export const getStripeProducts = async () => {
  const basicMonthly = await stripe.prices.retrieve(process.env.STRIPE_BASIC_PRICE_MONTHLY!)
  const basicYearly = await stripe.prices.retrieve(process.env.STRIPE_BASIC_PRICE_YEARLY!)
  const proMonthly = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_MONTHLY!)
  const proYearly = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_YEARLY!)
  const enterpriseMonthly = await stripe.prices.retrieve(process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY!)
  const enterpriseYearly = await stripe.prices.retrieve(process.env.STRIPE_ENTERPRISE_PRICE_YEARLY!)

  return {
    basicMonthly,
    basicYearly,
    proMonthly,
    proYearly,
    enterpriseMonthly,
    enterpriseYearly,
  }
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100)
}
