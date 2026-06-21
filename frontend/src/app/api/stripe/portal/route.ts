// Endpoint POST — création d'une session Stripe Customer Portal
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialisation du client Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()

    // Vérification que l'identifiant client est fourni
    if (!customerId) {
      return NextResponse.json(
        { erreur: "L'identifiant client Stripe est requis." },
        { status: 400 }
      )
    }

    // Création de la session du portail de facturation Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      // URL de retour après gestion de l'abonnement
      return_url: process.env.NEXT_PUBLIC_APP_URL + "/facturation",
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Erreur création session portail Stripe :", err)
    return NextResponse.json(
      { erreur: "Impossible d'ouvrir le portail de gestion." },
      { status: 500 }
    )
  }
}
