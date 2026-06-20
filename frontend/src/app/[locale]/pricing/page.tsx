"use client"

import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

const PLANS = [
  {
    name: "Starter",
    price: "499",
    currency: "MAD",
    period: "/mois",
    description: "Parfait pour les petites équipes qui démarrent",
    features: [
      "3 utilisateurs",
      "5 projets actifs",
      "Chat IA intégré",
      "Dashboard & KPIs de base",
      "Rapports journaliers",
      "Support email",
    ],
    cta: "Démarrer l'essai gratuit",
    badge: "14 jours gratuits, sans carte bancaire",
    highlighted: false,
    href: "/register?plan=starter",
    isEnterprise: false,
  },
  {
    name: "Pro",
    price: "1 490",
    currency: "MAD",
    period: "/mois",
    description: "Pour les équipes ambitieuses avec des projets complexes",
    features: [
      "15 utilisateurs",
      "Projets illimités",
      "IA avancée & prédictive",
      "KPIs EVM complets",
      "Rapports avancés PDF/Excel",
      "Support prioritaire 24/7",
    ],
    cta: "Démarrer l'essai gratuit",
    badge: "14 jours gratuits, sans carte bancaire",
    highlighted: true,
    href: "/register?plan=pro",
    isEnterprise: false,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    currency: null,
    period: null,
    description: "Solution sur mesure pour les grandes organisations",
    features: [
      "Utilisateurs illimités",
      "Projets illimités",
      "Accès API complet",
      "IA personnalisée",
      "SLA 99,9 % garanti",
      "Support dédié & account manager",
    ],
    cta: "Nous contacter",
    badge: null,
    highlighted: false,
    href: "mailto:contact@engipilot.ma",
    isEnterprise: true,
  },
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/landing")}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
          >
            <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl text-[#0F172A]">ENGIPILOT</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-[#475569] hover:text-[#0F172A] font-medium transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Commencer gratuitement
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        <section className="py-16 text-center px-5">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            💳 Tarifs transparents
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-[#0F172A] leading-tight">
            Des plans pour chaque<br />organisation BTP
          </h1>
          <p className="mt-5 text-lg text-[#475569] max-w-xl mx-auto">
            Commencez avec 14 jours gratuits, sans carte bancaire. Passez au plan supérieur quand vous êtes prêt.
          </p>
        </section>

        <section className="pb-20 px-5">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 flex flex-col h-full ${
                  plan.highlighted
                    ? "shadow-2xl scale-[1.03]"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#1E3A8A]" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap z-10">
                      ⭐ RECOMMANDÉ
                    </div>
                  </>
                )}

                <div className="relative p-8 flex flex-col gap-6 flex-1">

                  <div>
                    <h2 className={`text-xl font-black ${plan.highlighted ? "text-white" : "text-[#0F172A]"}`}>
                      {plan.name}
                    </h2>
                    <p className={`text-sm mt-1 ${plan.highlighted ? "text-white/60" : "text-[#475569]"}`}>
                      {plan.description}
                    </p>
                    <div className="mt-4 flex items-end gap-1">
                      {plan.currency ? (
                        <>
                          <span className={`text-4xl font-black ${plan.highlighted ? "text-white" : "text-[#2563EB]"}`}>
                            {plan.price}
                          </span>
                          <span className={`text-sm mb-1 font-semibold ${plan.highlighted ? "text-white/60" : "text-[#475569]"}`}>
                            {plan.currency}{plan.period}
                          </span>
                        </>
                      ) : (
                        <span className={`text-3xl font-black ${plan.highlighted ? "text-white" : "text-[#2563EB]"}`}>
                          {plan.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {plan.badge && (
                    <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
                      plan.highlighted
                        ? "bg-white/15 text-white"
                        : "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      <span>✓</span>
                      {plan.badge}
                    </div>
                  )}

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-center gap-3 text-sm ${plan.highlighted ? "text-white/85" : "text-[#475569]"}`}>
                        <svg
                          className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-blue-200" : "text-[#2563EB]"}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.href}
                    className={`mt-2 block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all shadow-md ${
                      plan.highlighted
                        ? "bg-white text-[#2563EB] hover:bg-blue-50"
                        : plan.isEnterprise
                          ? "bg-[#0F172A] text-white hover:bg-[#1E3A8A]"
                          : "bg-[#2563EB] text-white hover:bg-[#1E3A8A]"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-sm text-[#475569]">
            Tous les prix sont HT · Essai gratuit sans engagement · Annulation à tout moment
          </p>
        </section>

        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-5">
            <h2 className="text-2xl font-black text-center text-[#0F172A] mb-10">Questions fréquentes</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  q: "L'essai gratuit nécessite-t-il une carte bancaire ?",
                  a: "Non. Vous pouvez démarrer votre essai de 14 jours sans aucune information de paiement.",
                },
                {
                  q: "Puis-je changer de plan à tout moment ?",
                  a: "Oui. Vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace compte.",
                },
                {
                  q: "Que se passe-t-il à la fin de l'essai ?",
                  a: "Votre compte passe en mode lecture seule. Vos données sont conservées 30 jours supplémentaires.",
                },
                {
                  q: "L'Enterprise inclut-il un SLA ?",
                  a: "Oui. L'offre Enterprise inclut un SLA de 99,9 % de disponibilité avec support dédié 24/7.",
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-[#F8FAFC] rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-[#0F172A] text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-[#0F172A] text-white py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© 2026 ENGIPILOT. Tous droits réservés.</p>
          <div className="flex gap-6">
            <button onClick={() => router.push("/landing")} className="hover:text-white transition-colors">Accueil</button>
            <a href="mailto:contact@engipilot.ma" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
