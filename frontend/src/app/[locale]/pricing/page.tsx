"use client"
// Page des tarifs avec intégration Stripe Checkout
import { useState } from "react"
import { CheckCircle, X } from "lucide-react"

// Définition des plans tarifaires ENGIPILOT
const PLANS = [
  {
    name: "Starter",
    prix: "499 MAD",
    periode: "/ mois",
    description: "Idéal pour les petites équipes",
    features: [
      { ok: true,  t: "5 chantiers max" },
      { ok: true,  t: "Dashboard basique" },
      { ok: true,  t: "Rapports journaliers" },
      { ok: true,  t: "Export PDF" },
      { ok: false, t: "KPIs EVM avancés" },
      { ok: false, t: "Module IA prédictions" },
    ],
    couleur: "border-border hover:border-primary/40",
    btnClass: "bg-primary text-white hover:bg-primary-hover",
  },
  {
    name: "Pro",
    prix: "1 490 MAD",
    periode: "/ mois · annuel",
    description: "Pour les bureaux d'études professionnels",
    populaire: true,
    features: [
      { ok: true, t: "20 chantiers" },
      { ok: true, t: "KPIs EVM complets" },
      { ok: true, t: "Module IA prédictions" },
      { ok: true, t: "Export PDF illimité" },
      { ok: true, t: "Kanban + Gantt" },
      { ok: true, t: "Support prioritaire" },
    ],
    couleur: "border-primary border-2",
    btnClass: "bg-primary text-white hover:bg-primary-hover",
  },
  {
    name: "Enterprise",
    prix: "Sur devis",
    periode: "Multi-organisations",
    description: "Solutions sur mesure pour grandes entreprises",
    features: [
      { ok: true, t: "Chantiers illimités" },
      { ok: true, t: "Multi-tenant SaaS" },
      { ok: true, t: "IA personnalisée" },
      { ok: true, t: "API accès complet" },
      { ok: true, t: "SSO + SAML" },
      { ok: true, t: "SLA 99.9%" },
    ],
    couleur: "border-border hover:border-success/40",
    btnClass: "bg-success text-white hover:bg-success/90",
  },
]

export default function PricingPage() {
  // État de chargement pour le bouton en cours de traitement
  const [loading, setLoading] = useState<string | null>(null)

  // Déclenche le processus de paiement Stripe pour le plan sélectionné
  async function handleCheckout(plan: string) {
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: "guest" }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.erreur ?? "Erreur lors de la création du paiement")
      }

      // Redirection vers la page de paiement Stripe
      window.location.href = data.url
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.")
      console.error("Erreur Stripe Checkout :", err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8 page-enter">
      {/* En-tête de la page */}
      <div className="text-center">
        <h1 className="page-title">Choisissez votre plan</h1>
        <p className="text-sm text-muted-fg mt-1">
          Tarifs en Dirham Marocain (MAD) · TVA non incluse
        </p>
      </div>

      {/* Grille des plans tarifaires */}
      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white border rounded-2xl p-6 relative flex flex-col shadow-card transition-all ${plan.couleur}`}
          >
            {/* Badge "Populaire" pour le plan Pro */}
            {plan.populaire && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Le plus populaire ✓
              </div>
            )}

            {/* Informations du plan */}
            <div className="mb-4">
              <h3 className="font-black text-lg text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-fg mt-0.5">{plan.description}</p>
              <div className="mt-3">
                <span className="text-2xl font-black text-foreground">{plan.prix}</span>
                <span className="text-sm text-muted-fg ml-1">{plan.periode}</span>
              </div>
            </div>

            <div className="h-px bg-border mb-4" />

            {/* Liste des fonctionnalités */}
            <div className="space-y-2 flex-1 mb-6">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={f.ok ? "text-success" : "text-muted-fg/40"}>
                    {f.ok ? "✓" : "✗"}
                  </span>
                  <span className={f.ok ? "text-foreground" : "text-muted-fg"}>{f.t}</span>
                </div>
              ))}
            </div>

            {/* Bouton d'action — Stripe pour Starter/Pro, mailto pour Enterprise */}
            {plan.name === "Enterprise" ? (
              <a
                href="mailto:contact@engipilot.ma"
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all text-center block ${plan.btnClass}`}
              >
                Nous contacter →
              </a>
            ) : (
              <button
                onClick={() => handleCheckout(plan.name.toLowerCase())}
                disabled={loading === plan.name.toLowerCase()}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${plan.btnClass} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading === plan.name.toLowerCase() ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Redirection…
                  </span>
                ) : (
                  `Choisir ${plan.name} →`
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Note de bas de page */}
      <p className="text-center text-xs text-muted-fg">
        Paiement sécurisé par Stripe · Annulation à tout moment · Sans engagement
      </p>
    </div>
  )
}
