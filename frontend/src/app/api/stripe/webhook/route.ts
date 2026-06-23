import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://engipilot-backend:8080/api/v1"

async function notifyBackend(path: string, body: unknown) {
  const secret = process.env.WEBHOOK_INTERNAL_SECRET ?? "internal-webhook-secret"
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.error(`[stripe-webhook] Backend ${path} erreur ${res.status}`)
    return res.ok
  } catch (e) {
    console.error(`[stripe-webhook] Backend ${path} inaccessible:`, e)
    return false
  }
}

export async function POST(req: NextRequest) {
  const arrayBuffer = await req.arrayBuffer()
  const body = Buffer.from(arrayBuffer)
  const sig  = req.headers.get("stripe-signature") ?? ""
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const organisationId = session.metadata?.organisationId ?? session.metadata?.userId
      if (organisationId) {
        await notifyBackend("/stripe/subscription-activated", {
          organisationId,
          plan: (session.metadata?.plan ?? "STARTER").toUpperCase(),
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        })
      }
      break
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription & { current_period_end: number }
      await notifyBackend("/stripe/subscription-updated", {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      })
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await notifyBackend("/stripe/subscription-cancelled", { stripeSubscriptionId: sub.id, stripeCustomerId: sub.customer })
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      await notifyBackend("/stripe/payment-failed", { stripeCustomerId: invoice.customer, invoiceId: invoice.id, amountDue: invoice.amount_due })
      break
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      await notifyBackend("/stripe/payment-succeeded", { stripeCustomerId: invoice.customer, stripeSubscriptionId: invoice.subscription, amountPaid: invoice.amount_paid })
      break
    }
    default: break
  }
  return NextResponse.json({ received: true })
}
