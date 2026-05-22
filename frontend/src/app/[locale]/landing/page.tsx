"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const modules = [
    { title: "Gestion de projets",  desc: "Planifiez, suivez et livrez vos projets dans les délais", icon: "📅" },
    { title: "Planning & Gantt",    desc: "Visualisez vos plannings et dépendances",                  icon: "📊" },
    { title: "Tâches & Kanban",     desc: "Collaborez efficacement avec vos équipes",                 icon: "📋" },
    { title: "Documents",           desc: "Centralisez et sécurisez tous vos documents",              icon: "📄" },
    { title: "Équipes & RH",        desc: "Gérez vos ressources et compétences",                      icon: "👥" },
    { title: "HSE",                 desc: "Suivez la sécurité et les incidents en temps réel",        icon: "🦺" },
    { title: "Qualité",             desc: "Contrôles, inspections et non-conformités",                icon: "✅" },
    { title: "Approvisionnement",   desc: "Gérez achats, stocks et fournisseurs",                     icon: "📦" },
    { title: "Facturation",         desc: "Suivi financier et facturation multi-projets",             icon: "💰" },
    { title: "Rapports & BI",       desc: "Tableaux de bord et rapports personnalisés",               icon: "📈" },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const NAV_LINKS = [
    { label: "Fonctionnalités", action: () => scrollTo("features")  },
    { label: "Modules",         action: () => scrollTo("modules")   },
    { label: "Solutions",       action: () => scrollTo("solutions") },
    { label: "Tarifs",          action: () => scrollTo("tarifs")    },
    { label: "Ressources",      action: () => scrollTo("ressources")},
    { label: "À propos",        action: () => scrollTo("a-propos")  },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B132B]">

      {/* ── Navbar ── */}
      <header className="w-full border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <button
            onClick={() => scrollTo("hero")}
            className="text-3xl font-black text-blue-600 hover:opacity-80 transition"
          >
            ENGIPILOT
          </button>

          <nav className="hidden lg:flex items-center gap-10 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                className="text-[#0B132B] hover:text-blue-600 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-3 rounded-xl font-semibold shadow-lg"
            >
              Commencer gratuitement
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="hero" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              🚀 LA PLATEFORME TOUT-EN-UN POUR LE BTP
            </div>

            <h2 className="text-6xl font-black leading-tight">
              Pilotez vos projets<br />
              BTP avec{" "}
              <span className="text-blue-600">intelligence</span>
            </h2>

            <p className="mt-8 text-lg text-gray-600 leading-relaxed max-w-xl">
              ENGIPILOT centralise la gestion de vos chantiers, équipes,
              documents et performances dans une plateforme collaborative
              boostée par l'IA.
            </p>

            <div className="mt-10 flex gap-5 flex-wrap">
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-4 rounded-2xl font-semibold shadow-xl"
              >
                Commencer gratuitement →
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="border border-gray-300 bg-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition"
              >
                ▶ Voir les fonctionnalités
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-gray-600">
              <div>☁️ Cloud sécurisé</div>
              <div>🤖 IA intégrée</div>
              <div>⚡ Temps réel</div>
              <div>🏗️ Multi-projets</div>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-white rounded-[32px] shadow-2xl border p-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Avancement", value: "72%" },
                { label: "Budget",     value: "64%" },
                { label: "Tâches",     value: "128" },
                { label: "Incidents",  value: "7"   },
              ].map((k) => (
                <div key={k.label} className="bg-[#F7F9FC] rounded-2xl p-5">
                  <p className="text-gray-500 text-sm">{k.label}</p>
                  <h3 className="text-4xl font-black mt-2">{k.value}</h3>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div className="bg-[#F7F9FC] rounded-2xl p-6 h-64">
                <h4 className="font-bold mb-5">Avancement des projets</h4>
                <div className="flex items-end gap-3 h-40">
                  {[20, 40, 35, 60, 70, 85].map((h, i) => (
                    <div key={i} className="bg-blue-500 rounded-t-xl flex-1" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="bg-[#F7F9FC] rounded-2xl p-6 h-64 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full border-[18px] border-blue-500 border-t-cyan-300 border-r-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted by ── */}
      <section id="solutions" className="py-12 border-y bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-400 text-sm uppercase tracking-widest mb-10">
            Ils nous font confiance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-center font-black text-2xl text-gray-400">
            {["BOUYGUES", "EIFFAGE", "SOGEA", "VINCI", "RAZEL-BEC", "PFO"].map((n) => (
              <div key={n} className="hover:text-blue-600 transition-colors cursor-default">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black">
              Une plateforme complète pour tous vos besoins
            </h2>
            <p className="mt-5 text-gray-500 text-lg">
              Des modules intégrés pour gérer chaque aspect de vos projets de construction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {modules.map((module) => (
              <button
                key={module.title}
                onClick={() => router.push("/login")}
                className="bg-white border rounded-3xl p-8 hover:shadow-2xl hover:border-blue-200 transition duration-300 text-left"
              >
                <div className="text-5xl mb-6">{module.icon}</div>
                <h3 className="text-xl font-bold mb-3">{module.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{module.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── IA / Fonctionnalités ── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-[#001B5E] to-[#0036C7] rounded-[40px] p-14 text-white grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex bg-blue-500/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🤖 IA INTÉGRÉE
              </div>
              <h2 className="text-5xl font-black leading-tight">
                L'IA au service de vos projets
              </h2>
              <p className="mt-8 text-blue-100 leading-relaxed text-lg">
                ENGIPILOT analyse vos données en temps réel pour prédire les
                risques, optimiser les ressources et améliorer les performances
                de vos chantiers.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-10 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition"
              >
                Découvrir nos capacités IA →
              </button>
            </div>

            <div className="bg-white/10 rounded-[32px] p-10 backdrop-blur-xl space-y-4">
              {[
                { icon: "🔮", label: "Prédiction des retards",   href: "/ia"        },
                { icon: "⚠️", label: "Détection d'anomalies",    href: "/dashboard" },
                { icon: "💰", label: "Optimisation des coûts",   href: "/analytics" },
                { icon: "🤝", label: "Assistant intelligent",    href: "/chat"      },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push("/login")}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-2xl p-5 text-left transition-colors flex items-center gap-3"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black">Nos tarifs</h2>
            <p className="mt-5 text-gray-500 text-lg">
              Des plans adaptés à chaque taille d'organisation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter", price: "Gratuit", sub: "pour toujours",
                features: ["3 chantiers", "Dashboard & KPIs", "Rapports journaliers", "1 utilisateur"],
                cta: "Commencer gratuitement", highlight: false,
              },
              {
                name: "Pro", price: "1 490 MAD", sub: "/ mois",
                features: ["20 chantiers", "KPIs EVM complets", "Module IA prédictif", "25 utilisateurs", "Support 24/7"],
                cta: "Démarrer l'essai gratuit", highlight: true,
              },
              {
                name: "Enterprise", price: "Sur devis", sub: "",
                features: ["Chantiers illimités", "IA personnalisée", "API complète", "Utilisateurs illimités", "Account manager"],
                cta: "Nous contacter", highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-10 border flex flex-col gap-6 ${
                  plan.highlight
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xl scale-105"
                    : "bg-white border-gray-200"
                }`}
              >
                <div>
                  <h3 className={`text-2xl font-black ${plan.highlight ? "text-white" : ""}`}>{plan.name}</h3>
                  <div className="mt-3">
                    <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-blue-600"}`}>
                      {plan.price}
                    </span>
                    {plan.sub && (
                      <span className={`text-sm ml-1 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>
                        {plan.sub}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-blue-100" : "text-gray-600"}`}>
                      <span className={plan.highlight ? "text-white" : "text-blue-600"}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push("/login")}
                  className={`w-full py-4 rounded-2xl font-bold transition ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ressources ── */}
      <section id="ressources" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black">Ressources</h2>
            <p className="mt-5 text-gray-500 text-lg">Tout ce dont vous avez besoin pour démarrer</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: "📖", title: "Documentation",     desc: "Guides complets et référence API",           cta: "Consulter" },
              { icon: "🎬", title: "Vidéos tutoriels",  desc: "Apprenez ENGIPILOT en moins de 15 minutes",  cta: "Regarder"  },
              { icon: "📊", title: "Modèles Excel",     desc: "Templates import chantiers prêts à l'emploi", cta: "Télécharger" },
              { icon: "🎧", title: "Support",           desc: "Notre équipe répond en moins de 2h",         cta: "Contacter" },
            ].map((r) => (
              <div key={r.title} className="bg-white border rounded-3xl p-8 hover:shadow-xl transition duration-300 flex flex-col gap-4">
                <div className="text-5xl">{r.icon}</div>
                <h3 className="text-xl font-bold">{r.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{r.desc}</p>
                <button
                  onClick={() => scrollTo("ressources")}
                  className="text-blue-600 font-semibold text-sm hover:underline text-left"
                >
                  {r.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section id="a-propos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-black mb-6">À propos d'ENGIPILOT</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              ENGIPILOT est né d'un constat simple : les professionnels du BTP méritent
              des outils à la hauteur de leurs défis. Notre plateforme combine la
              puissance de l'IA avec une expérience utilisateur pensée pour le terrain.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              Développée par des ingénieurs passionnés de construction et de technologie,
              ENGIPILOT accompagne aujourd'hui plus de 2 400 chantiers dans 15 pays.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition"
            >
              Rejoindre ENGIPILOT →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "2 400+", label: "Projets supervisés" },
              { value: "15",     label: "Pays couverts"      },
              { value: "−34%",   label: "Réduction des coûts"},
              { value: "99.9%",  label: "Disponibilité SLA"  },
            ].map((s) => (
              <div key={s.label} className="bg-[#F7F9FC] rounded-2xl p-8 text-center">
                <div className="text-4xl font-black text-blue-600">{s.value}</div>
                <div className="text-gray-500 text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Démo ── */}
      <section id="demo" className="pb-24 pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-[40px] border p-14 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="text-5xl font-black">
                Prêt à transformer la gestion de vos projets ?
              </h2>
              <p className="mt-6 text-lg text-gray-500 max-w-2xl">
                Rejoignez les entreprises qui font confiance à ENGIPILOT pour
                piloter leurs projets avec succès.
              </p>
            </div>
            <div className="flex flex-col gap-5 flex-shrink-0">
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition"
              >
                Commencer gratuitement →
              </button>
              <button
                onClick={() => scrollTo("a-propos")}
                className="border border-gray-300 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="footer" className="bg-[#00154A] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-12">
          <div>
            <button
              onClick={() => scrollTo("hero")}
              className="text-3xl font-black hover:opacity-80 transition"
            >
              ENGIPILOT
            </button>
            <p className="mt-5 text-blue-100 leading-relaxed">
              La plateforme tout-en-un pour piloter vos projets BTP avec
              intelligence et performance.
            </p>
          </div>

          {[
            { title: "Produit",    links: [
              { label: "Fonctionnalités", action: () => scrollTo("features")   },
              { label: "Modules",         action: () => scrollTo("modules")    },
              { label: "Tarifs",          action: () => scrollTo("tarifs")     },
              { label: "Mises à jour",    action: () => scrollTo("hero")       },
            ]},
            { title: "Solutions",  links: [
              { label: "Par type de projet", action: () => scrollTo("modules")    },
              { label: "Par département",    action: () => scrollTo("modules")    },
              { label: "Intégrations",       action: () => router.push("/login")  },
              { label: "API",                action: () => router.push("/login")  },
            ]},
            { title: "Ressources", links: [
              { label: "Documentation", action: () => scrollTo("ressources") },
              { label: "Blog",          action: () => scrollTo("ressources") },
              { label: "Guides",        action: () => scrollTo("ressources") },
              { label: "Support",       action: () => scrollTo("ressources") },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-bold mb-5">{col.title}</h4>
              <ul className="space-y-3 text-blue-100">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="hover:text-white transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold mb-5">Newsletter</h4>
            <div className="flex overflow-hidden rounded-xl">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-3 text-black outline-none"
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 px-5 transition"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-14 pt-8 border-t border-white/10 text-sm text-blue-100 flex flex-col lg:flex-row justify-between gap-5">
          <p>© 2026 ENGIPILOT. Tous droits réservés.</p>
          <div className="flex gap-8">
            <button onClick={() => scrollTo("a-propos")} className="hover:text-white transition-colors">Confidentialité</button>
            <button onClick={() => scrollTo("a-propos")} className="hover:text-white transition-colors">Conditions d'utilisation</button>
            <button onClick={() => scrollTo("a-propos")} className="hover:text-white transition-colors">Mentions légales</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
