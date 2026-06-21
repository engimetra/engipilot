// Endpoint POST — création d'une session Stripe Checkout
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialisation du client Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Tarifs en centimes (MAD × 100)
const TARIFS: Record<string, number> = {
  starter: 49900,  // 499 MAD
  pro: 149000,     // 1 490 MAD
}

// Noms des plans pour l'affichage dans Stripe
const NOMS_PLANS: Record<string, string> = {
  starter: "ENGIPILOT Starter",
  pro: "ENGIPILOT Pro",
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json()

    // Vérification que le plan est valide
    if (!plan || !TARIFS[plan]) {
      return NextResponse.json(
        { erreur: "Plan invalide. Choisissez 'starter' ou 'pro'." },
        { status: 400 }
      )
    }

    // Création de la session Stripe Checkout en mode abonnement
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "mad",
            unit_amount: TARIFS[plan],
            recurring: {
              interval: "month",
            },
            product_data: {
              name: NOMS_PLANS[plan],
              description: `Abonnement mensuel ENGIPILOT — plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
            },
          },
          quantity: 1,
        },
      ],
      // URL de redirection après paiement réussi
      success_url: process.env.NEXT_PUBLIC_APP_URL + "/accueil?payment=success",
      // URL de retour en cas d'annulation
      cancel_url: process.env.NEXT_PUBLIC_APP_URL + "/pricing",
      // Métadonnées pour identifier l'utilisateur et le plan
      metadata: {
        plan,
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Erreur création session Stripe Checkout :", err)
    return NextResponse.json(
      { erreur: "Impossible de créer la session de paiement." },
      { status: 500 }
    )
  }
}
