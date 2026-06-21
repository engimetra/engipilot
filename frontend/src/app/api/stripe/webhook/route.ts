// Endpoint POST — réception des webhooks Stripe
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Exécution dans le runtime Node.js pour accéder au buffer brut
export const runtime = "nodejs"

// Initialisation du client Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  // Lecture du corps brut de la requête pour vérification de signature
  const arrayBuffer = await req.arrayBuffer()
  const body = Buffer.from(arrayBuffer)

  // Récupération de la signature Stripe depuis les en-têtes
  const sig = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event

  try {
    // Vérification de l'authenticité de l'événement Stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Signature webhook Stripe invalide :", err)
    return NextResponse.json(
      { erreur: "Signature invalide" },
      { status: 400 }
    )
  }

  // Traitement des différents types d'événements Stripe
  switch (event.type) {
    case "checkout.session.completed": {
      // Abonnement activé après paiement réussi
      const session = event.data.object as Stripe.Checkout.Session
      console.log("Abonnement activé :", {
        plan: session.metadata?.plan,
        userId: session.metadata?.userId,
        sessionId: session.id,
      })
      break
    }

    case "customer.subscription.deleted": {
      // Abonnement annulé (fin de période ou résiliation immédiate)
      const subscription = event.data.object as Stripe.Subscription
      console.log("Abonnement annulé :", {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      })
      break
    }

    case "invoice.payment_failed": {
      // Échec de paiement — l'utilisateur doit mettre à jour ses informations
      const invoice = event.data.object as Stripe.Invoice
      console.log("Paiement échoué :", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        montant: invoice.amount_due,
      })
      break
    }

    default:
      // Événement non géré — on retourne 200 quand même pour éviter les renvois Stripe
      console.log(`Événement Stripe non géré : ${event.type}`)
  }

  // Retourner 200 pour confirmer la réception à Stripe
  return NextResponse.json({ reçu: true }, { status: 200 })
}
