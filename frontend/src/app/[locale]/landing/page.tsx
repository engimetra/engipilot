"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

/* ─── Types ─────────────────────────────────────────────── */
type NavItem = {
  label: string;
  scrollTo?: string;
  dropdown?: {
    columns: {
      heading?: string;
      items: { icon: string; title: string; desc: string; scroll?: string }[];
    }[];
  };
};

/* ─── Nav structure ──────────────────────────────────────── */
const NAV: NavItem[] = [
  {
    label: "Fonctionnalités",
    dropdown: {
      columns: [
        {
          heading: "Planification",
          items: [
            { icon: "📅", title: "Gestion de projets",  desc: "Pilotez chaque chantier de A à Z",     scroll: "features" },
            { icon: "📊", title: "Planning & Gantt",    desc: "Visualisez délais et dépendances",      scroll: "features" },
            { icon: "📋", title: "Tâches & Kanban",     desc: "Collaborez avec vos équipes",           scroll: "features" },
          ],
        },
        {
          heading: "Contrôle",
          items: [
            { icon: "📈", title: "Rapports & BI",       desc: "Tableaux de bord en temps réel",        scroll: "features" },
            { icon: "✅", title: "Qualité",             desc: "Inspections et non-conformités",        scroll: "features" },
            { icon: "🦺", title: "HSE",                 desc: "Sécurité et incidents",                 scroll: "features" },
          ],
        },
        {
          heading: "IA & Analyse",
          items: [
            { icon: "🔮", title: "Prédiction IA",       desc: "Anticiper retards et dérives",          scroll: "features" },
            { icon: "💰", title: "Optimisation coûts",  desc: "Réduire les surcoûts de 34 %",         scroll: "features" },
            { icon: "🤝", title: "Assistant intelligent",desc: "Copilote IA pour vos décisions",       scroll: "features" },
          ],
        },
      ],
    },
  },
  {
    label: "Modules",
    dropdown: {
      columns: [
        {
          heading: "Opérations",
          items: [
            { icon: "📄", title: "Documents",         desc: "GED centralisée et sécurisée",      scroll: "modules" },
            { icon: "👥", title: "Équipes & RH",      desc: "Ressources et compétences",         scroll: "modules" },
            { icon: "📦", title: "Approvisionnement", desc: "Achats, stocks, fournisseurs",      scroll: "modules" },
          ],
        },
        {
          heading: "Finance",
          items: [
            { icon: "💰", title: "Facturation",       desc: "Suivi financier multi-projets",     scroll: "modules" },
            { icon: "📊", title: "EVM & KPIs",        desc: "Indicateurs de valeur acquise",     scroll: "modules" },
            { icon: "📉", title: "Budget & Coûts",    desc: "Contrôle budgétaire en direct",     scroll: "modules" },
          ],
        },
      ],
    },
  },
  {
    label: "Solutions",
    dropdown: {
      columns: [
        {
          heading: "Par type de projet",
          items: [
            { icon: "🏗️", title: "Génie civil",         desc: "Routes, ponts, ouvrages d'art",  scroll: "solutions" },
            { icon: "🏢", title: "Bâtiment",            desc: "Résidentiel et tertiaire",        scroll: "solutions" },
            { icon: "⚡", title: "Énergie & Industrie", desc: "Centrales, usines, réseaux",      scroll: "solutions" },
          ],
        },
        {
          heading: "Par département",
          items: [
            { icon: "👷", title: "Conducteurs de travaux", desc: "Suivi terrain en temps réel",  scroll: "solutions" },
            { icon: "📐", title: "BET & Ingénierie",       desc: "Études, plans, livrables",      scroll: "solutions" },
            { icon: "🏦", title: "Direction générale",     desc: "Vision globale et reporting",   scroll: "solutions" },
          ],
        },
      ],
    },
  },
  { label: "Tarifs",    scrollTo: "tarifs"    },
  {
    label: "Ressources",
    dropdown: {
      columns: [
        {
          items: [
            { icon: "📖", title: "Documentation",    desc: "Guides complets et référence API",          scroll: "ressources" },
            { icon: "🎬", title: "Vidéos tutoriels", desc: "Apprenez ENGIPILOT en 15 minutes",         scroll: "ressources" },
            { icon: "📊", title: "Modèles Excel",    desc: "Templates import chantiers",                scroll: "ressources" },
            { icon: "🎧", title: "Support",          desc: "Réponse garantie en moins de 2 h",         scroll: "ressources" },
          ],
        },
      ],
    },
  },
  { label: "À propos",  scrollTo: "a-propos"  },
];

/* ─── Dropdown component ─────────────────────────────────── */
function NavDropdown({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const router = useRouter();
  if (!item.dropdown) return null;
  const { columns } = item.dropdown;

  function go(scroll?: string) {
    onClose();
    if (scroll) {
      setTimeout(() => document.getElementById(scroll)?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ minWidth: columns.length === 1 ? 280 : columns.length === 2 ? 520 : 760 }}
    >
      {/* arrow */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45 shadow-[-2px_-2px_4px_rgba(0,0,0,0.04)]" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className={`grid gap-0 divide-x divide-gray-100`} style={{ gridTemplateColumns: `repeat(${columns.length},1fr)` }}>
          {columns.map((col, ci) => (
            <div key={ci} className="p-5">
              {col.heading && (
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3 px-1">{col.heading}</p>
              )}
              <div className="space-y-1">
                {col.items.map((it) => (
                  <button
                    key={it.title}
                    onClick={() => go(it.scroll)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-[#F0F7F2] group transition-colors text-left"
                  >
                    <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{it.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1e512d] transition-colors">{it.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{it.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA bar */}
        <div className="bg-gradient-to-r from-[#F0F7F2] to-[#FFF4EE] px-5 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-xs text-gray-500">Essai gratuit · Sans carte bancaire</p>
          <button
            onClick={() => { onClose(); router.push("/login"); }}
            className="text-xs font-bold text-[#1e512d] hover:text-[#174024] transition-colors"
          >
            Commencer maintenant →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [openNav, setOpenNav] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenNav(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function scroll(id: string) {
    setMobileOpen(false);
    setOpenNav(null);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

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

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B132B]">

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header
        className={`w-full sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_24px_rgba(0,0,0,0.08)] border-b border-gray-100"
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6" ref={navRef}>
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <button
              onClick={() => scroll("hero")}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e512d] to-[#2d7a42] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-black">EP</span>
              </div>
              <span className="text-xl font-black text-[#0B132B] tracking-tight group-hover:text-[#1e512d] transition-colors">
                ENGIPILOT
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => {
                const isOpen = openNav === item.label;
                const hasDropdown = !!item.dropdown;
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => {
                        if (item.scrollTo) { scroll(item.scrollTo); setOpenNav(null); }
                        else setOpenNav(isOpen ? null : item.label);
                      }}
                      onMouseEnter={() => { if (hasDropdown) setOpenNav(item.label); }}
                      onMouseLeave={() => { if (hasDropdown && !isOpen) setOpenNav(null); }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isOpen
                          ? "bg-[#F0F7F2] text-[#1e512d]"
                          : "text-gray-600 hover:text-[#0B132B] hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      {hasDropdown && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#1e512d]" : "text-gray-400"}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {isOpen && hasDropdown && (
                      <div
                        onMouseEnter={() => setOpenNav(item.label)}
                        onMouseLeave={() => setOpenNav(null)}
                      >
                        <NavDropdown item={item} onClose={() => setOpenNav(null)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* CTA buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-gray-600 hover:text-[#1e512d] px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 bg-[#1e512d] hover:bg-[#174024] transition-all text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-[0_2px_12px_rgba(30,81,45,0.35)] hover:shadow-[0_4px_20px_rgba(30,81,45,0.45)] hover:-translate-y-0.5"
              >
                Commencer gratuitement
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-gray-100 pb-4 pt-2 space-y-1">
              {NAV.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (item.scrollTo) { scroll(item.scrollTo); }
                      else setMobileExpanded(mobileExpanded === item.label ? null : item.label);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#1e512d] hover:bg-[#F0F7F2] rounded-lg transition-colors"
                  >
                    {item.label}
                    {item.dropdown && (
                      <svg className={`w-4 h-4 transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {mobileExpanded === item.label && item.dropdown && (
                    <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-[#E4F0E7] pl-3">
                      {item.dropdown.columns.flatMap(c => c.items).map((it) => (
                        <button
                          key={it.title}
                          onClick={() => { setMobileOpen(false); if (it.scroll) scroll(it.scroll); }}
                          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:text-[#1e512d] rounded-lg hover:bg-[#F0F7F2] transition-colors text-left"
                        >
                          <span>{it.icon}</span> {it.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 px-1">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-2.5 text-sm font-bold text-white bg-[#1e512d] rounded-xl hover:bg-[#174024] transition-colors"
                >
                  Commencer gratuitement →
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section id="hero" className="py-24 relative overflow-hidden">
        {/* background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb33_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb33_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-white to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E4F0E7] text-[#1e512d] px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-[#C5DFC9]">
              <span className="w-2 h-2 bg-[#1e512d] rounded-full animate-pulse" />
              PLATEFORME TOUT-EN-UN POUR LE BTP
            </div>

            <h1 className="text-6xl font-black leading-[1.05] tracking-tight">
              Pilotez vos projets<br />
              BTP avec{" "}
              <span className="relative">
                <span className="text-[#1e512d]">intelligence</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6 C50 2, 150 2, 198 6" stroke="#ff751f" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="mt-10 text-lg text-gray-500 leading-relaxed max-w-xl">
              ENGIPILOT centralise la gestion de vos chantiers, équipes,
              documents et performances dans une plateforme collaborative
              boostée par l'IA.
            </p>

            <div className="mt-10 flex gap-4 flex-wrap">
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 bg-[#1e512d] hover:bg-[#174024] transition-all text-white px-8 py-4 rounded-2xl font-bold shadow-[0_4px_24px_rgba(30,81,45,0.4)] hover:shadow-[0_8px_32px_rgba(30,81,45,0.5)] hover:-translate-y-0.5"
              >
                Commencer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => scroll("features")}
                className="flex items-center gap-2 border border-gray-200 bg-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <svg className="w-4 h-4 text-[#1e512d]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Voir la démo
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: "☁️", text: "Cloud sécurisé" },
                { icon: "🤖", text: "IA intégrée" },
                { icon: "⚡", text: "Temps réel" },
                { icon: "🏗️", text: "Multi-projets" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <span>{f.icon}</span> {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero image — real construction site */}
          <div className="relative">
            {/* Glow halo */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[#1e512d]/15 to-[#ff751f]/15 rounded-[48px] blur-3xl" />

            <div className="relative rounded-[28px] overflow-hidden shadow-2xl border border-gray-100" style={{ aspectRatio: "4/3" }}>
              {/* Real photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1100&q=80&fit=crop&crop=center"
                alt="Équipe ingénieurs sur chantier"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay — bottom fade for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A0F]/70 via-transparent to-transparent" />

              {/* Top-left badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#1e512d] animate-pulse" />
                <span className="text-[11px] font-bold text-[#0B132B]">ENGIPILOT — Live</span>
              </div>

              {/* Floating KPI cards at the bottom */}
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Avancement global", value: "72%",   color: "#1e512d", icon: "📈" },
                  { label: "Budget consommé",   value: "64%",   color: "#ff751f", icon: "💰" },
                  { label: "Tâches actives",    value: "128",   color: "#6366f1", icon: "📋" },
                  { label: "Alertes HSE",       value: "7",     color: "#ef4444", icon: "🦺" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-md flex items-center gap-2.5"
                  >
                    <span className="text-lg leading-none">{k.icon}</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{k.label}</p>
                      <p className="text-lg font-black leading-none" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted by ─────────────────────────────────────── */}
      <section id="solutions" className="py-12 border-y bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-400 text-xs uppercase tracking-[0.2em] mb-10 font-semibold">
            Ils nous font confiance
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 text-center font-black text-xl text-gray-300">
            {["BOUYGUES", "EIFFAGE", "SOGEA", "VINCI", "RAZEL-BEC", "PFO"].map((n) => (
              <div key={n} className="hover:text-[#1e512d] transition-colors duration-300 cursor-default">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités / IA ────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFF4EE] text-[#cc5500] px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-[#FFDCC4]">
              🤖 IA INTÉGRÉE
            </div>
            <h2 className="text-5xl font-black">L'IA au service de vos projets</h2>
            <p className="mt-5 text-gray-500 text-lg max-w-2xl mx-auto">
              ENGIPILOT analyse vos données en temps réel pour prédire les risques,
              optimiser les ressources et améliorer les performances de vos chantiers.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🔮", title: "Prédiction des retards",
                desc: "L'IA détecte les dérives de planning 3 semaines à l'avance et propose des actions correctives.",
                badge: "IA",
                color: "#6366f1",
              },
              {
                icon: "📊", title: "Tableaux de bord EVM",
                desc: "Indicateurs SPI, CPI et valeur acquise calculés automatiquement pour chaque projet.",
                badge: "Analytics",
                color: "#1e512d",
              },
              {
                icon: "⚠️", title: "Détection d'anomalies",
                desc: "Alertes proactives sur les risques qualité, sécurité et budgétaires en temps réel.",
                badge: "Alertes",
                color: "#f59e0b",
              },
              {
                icon: "💰", title: "Optimisation des coûts",
                desc: "Réductions moyennes de 34 % sur les surcoûts grâce à l'analyse prédictive des dépenses.",
                badge: "Finance",
                color: "#ff751f",
              },
              {
                icon: "🤝", title: "Assistant intelligent",
                desc: "Un copilote IA répond à vos questions, génère des rapports et optimise votre planning.",
                badge: "Copilote",
                color: "#ec4899",
              },
              {
                icon: "📋", title: "Rapports automatisés",
                desc: "Rapports journaliers, hebdomadaires et mensuels générés automatiquement et envoyés par email.",
                badge: "Auto",
                color: "#14b8a6",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: f.color + "15" }}>
                    {f.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{ color: f.color, borderColor: f.color + "40", background: f.color + "10" }}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-[#1e512d] transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 bg-[#1e512d] hover:bg-[#174024] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Découvrir toutes les fonctionnalités
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Modules ─────────────────────────────────────────── */}
      <section id="modules" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black">
              Une plateforme complète pour tous vos besoins
            </h2>
            <p className="mt-5 text-gray-500 text-lg">
              Des modules intégrés pour gérer chaque aspect de vos projets de construction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {modules.map((module, i) => (
              <button
                key={module.title}
                onClick={() => router.push("/login")}
                className="bg-[#F7F9FC] border border-transparent rounded-2xl p-6 hover:bg-white hover:border-[#1e512d]/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
              >
                <div className="text-4xl mb-4">{module.icon}</div>
                <h3 className="text-base font-bold mb-2 group-hover:text-[#1e512d] transition-colors">{module.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{module.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ──────────────────────────────────────────── */}
      <section id="tarifs" className="py-24 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-gray-200 shadow-sm">
              💳 TARIFS TRANSPARENTS
            </div>
            <h2 className="text-5xl font-black">Des plans adaptés à chaque organisation</h2>
            <p className="mt-5 text-gray-500 text-lg">
              Commencez gratuitement · Passez à Pro quand vous êtes prêt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Starter", price: "Gratuit", sub: "pour toujours",
                features: ["3 chantiers actifs", "Dashboard & KPIs de base", "Rapports journaliers", "1 utilisateur", "Support communautaire"],
                cta: "Créer un compte", highlight: false,
              },
              {
                name: "Pro", price: "1 490 MAD", sub: "/ mois",
                features: ["20 chantiers actifs", "KPIs EVM complets", "Module IA prédictif", "25 utilisateurs", "Rapports avancés", "Support prioritaire 24/7"],
                cta: "Démarrer l'essai 14 jours", highlight: true,
              },
              {
                name: "Enterprise", price: "Sur devis", sub: "",
                features: ["Chantiers illimités", "IA personnalisée", "API & intégrations", "Utilisateurs illimités", "SLA 99.9 %", "Account manager dédié"],
                cta: "Nous contacter", highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border flex flex-col gap-6 overflow-hidden transition-transform hover:-translate-y-1 ${
                  plan.highlight
                    ? "shadow-2xl scale-[1.02]"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e512d] to-[#2d7a42]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff751f] text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      LE PLUS POPULAIRE
                    </div>
                  </>
                )}
                <div className="relative p-8 flex flex-col gap-6 flex-1">
                  <div>
                    <h3 className={`text-2xl font-black ${plan.highlight ? "text-white" : ""}`}>{plan.name}</h3>
                    <div className="mt-3 flex items-end gap-1">
                      <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-[#1e512d]"}`}>
                        {plan.price}
                      </span>
                      {plan.sub && (
                        <span className={`text-sm mb-1 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>{plan.sub}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlight ? "text-white/80" : "text-gray-600"}`}>
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-[#7dd3a8]" : "text-[#1e512d]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => router.push("/login")}
                    className={`w-full py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.02] text-sm ${
                      plan.highlight
                        ? "bg-white text-[#1e512d] hover:bg-[#f0fdf4] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                        : "text-white bg-gradient-to-r from-[#1e512d] to-[#2d7a42] hover:from-[#174024] hover:to-[#245f35] shadow-md"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-sm text-gray-400">
            Tous les prix sont HT · Essai gratuit sans carte bancaire · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* ── Ressources ──────────────────────────────────────── */}
      <section id="ressources" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black">Ressources</h2>
            <p className="mt-5 text-gray-500 text-lg">Tout ce dont vous avez besoin pour démarrer et réussir</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: "📖", title: "Documentation",
                desc: "Guides complets, tutoriels pas à pas et référence API exhaustive.",
                cta: "Consulter la doc", color: "#1e512d",
              },
              {
                icon: "🎬", title: "Vidéos tutoriels",
                desc: "Apprenez ENGIPILOT en moins de 15 minutes avec nos vidéos guidées.",
                cta: "Regarder", color: "#6366f1",
              },
              {
                icon: "📊", title: "Modèles Excel",
                desc: "Templates d'import chantiers prêts à l'emploi, formats CSV et XLSX.",
                cta: "Télécharger", color: "#ff751f",
              },
              {
                icon: "🎧", title: "Support expert",
                desc: "Notre équipe technique répond en moins de 2 h, 7 j/7.",
                cta: "Contacter le support", color: "#ec4899",
              },
            ].map((r) => (
              <div
                key={r.title}
                className="bg-[#F7F9FC] border border-transparent rounded-3xl p-8 hover:bg-white hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: r.color + "15" }}>
                  {r.icon}
                </div>
                <h3 className="text-lg font-bold group-hover:text-[#1e512d] transition-colors">{r.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{r.desc}</p>
                <button
                  onClick={() => scroll("ressources")}
                  className="text-sm font-bold hover:underline text-left flex items-center gap-1 transition-colors"
                  style={{ color: r.color }}
                >
                  {r.cta}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── À propos ─────────────────────────────────────────── */}
      <section id="a-propos" className="py-24 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-gray-200 shadow-sm">
              🏢 NOTRE HISTOIRE
            </div>
            <h2 className="text-5xl font-black leading-tight mb-6">À propos<br />d'ENGIPILOT</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-5">
              ENGIPILOT est né d'un constat simple : les professionnels du BTP méritent
              des outils à la hauteur de leurs défis. Notre plateforme combine la
              puissance de l'IA avec une expérience utilisateur pensée pour le terrain.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              Développée par des ingénieurs passionnés de construction et de technologie,
              ENGIPILOT accompagne aujourd'hui plus de 2 400 chantiers dans 15 pays.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 bg-[#1e512d] hover:bg-[#174024] text-white px-6 py-3.5 rounded-2xl font-bold transition-all hover:-translate-y-0.5 shadow-lg"
              >
                Rejoindre ENGIPILOT
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => scroll("a-propos")}
                className="flex items-center gap-2 border border-gray-200 bg-white px-6 py-3.5 rounded-2xl font-semibold transition-all hover:-translate-y-0.5 hover:border-gray-300 shadow-sm"
              >
                Nous contacter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {[
              { value: "2 400+", label: "Projets supervisés",   icon: "🏗️" },
              { value: "15",     label: "Pays couverts",         icon: "🌍" },
              { value: "−34 %",  label: "Réduction des surcoûts",icon: "📉" },
              { value: "99.9 %", label: "Disponibilité SLA",     icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">{s.icon}</div>
                <div className="text-4xl font-black text-[#1e512d]">{s.value}</div>
                <div className="text-gray-500 text-sm mt-2 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-[#0f2e18] to-[#1e512d] rounded-[40px] p-16 overflow-hidden text-center">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#ff751f]/10 rounded-full" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-white/20">
                🚀 DÉMARREZ EN MOINS DE 5 MINUTES
              </div>
              <h2 className="text-5xl font-black text-white leading-tight">
                Prêt à transformer la gestion<br />de vos projets BTP ?
              </h2>
              <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto">
                Rejoignez les entreprises qui font confiance à ENGIPILOT pour
                piloter leurs projets avec succès.
              </p>
              <div className="mt-10 flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 bg-white text-[#1e512d] px-8 py-4 rounded-2xl font-black hover:bg-[#f0fdf4] transition-all hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(255,255,255,0.25)]"
                >
                  Commencer gratuitement
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll("a-propos")}
                  className="flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all hover:-translate-y-0.5"
                >
                  Planifier une démo
                </button>
              </div>
              <p className="mt-6 text-white/40 text-sm">Sans engagement · Sans carte bancaire · 14 jours gratuits</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-[#0a1f0f] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 pb-12 border-b border-white/10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <button onClick={() => scroll("hero")} className="flex items-center gap-2 mb-5 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e512d] to-[#2d7a42] flex items-center justify-center">
                  <span className="text-white text-xs font-black">EP</span>
                </div>
                <span className="text-xl font-black tracking-tight">ENGIPILOT</span>
              </button>
              <p className="text-white/50 leading-relaxed text-sm max-w-xs">
                La plateforme tout-en-un pour piloter vos projets BTP avec intelligence et performance.
              </p>
              <div className="mt-6 flex gap-3">
                {["in", "tw", "yt"].map((s) => (
                  <button key={s} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-xs font-bold text-white/60 hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Produit", links: [
                { label: "Fonctionnalités", scroll: "features" },
                { label: "Modules",         scroll: "modules"  },
                { label: "Tarifs",          scroll: "tarifs"   },
                { label: "Nouveautés",      scroll: "hero"     },
              ]},
              { title: "Ressources", links: [
                { label: "Documentation", scroll: "ressources" },
                { label: "Vidéos",        scroll: "ressources" },
                { label: "Blog",          scroll: "ressources" },
                { label: "Support",       scroll: "ressources" },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold mb-5 text-sm text-white">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => scroll(link.scroll)}
                        className="text-white/50 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-5 text-sm text-white">Newsletter</h4>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">Les dernières mises à jour et ressources BTP, chaque semaine.</p>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-4 py-3 text-sm bg-white/5 text-white placeholder-white/30 outline-none focus:bg-white/10 transition-colors"
                />
                <button type="button" className="bg-[#ff751f] hover:bg-[#e8611a] px-4 transition-colors text-white font-bold text-sm">
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col lg:flex-row justify-between gap-5 text-sm text-white/40">
            <p>© 2026 ENGIPILOT. Tous droits réservés.</p>
            <div className="flex gap-8">
              {["Confidentialité", "Conditions d'utilisation", "Mentions légales"].map((l) => (
                <button key={l} onClick={() => scroll("a-propos")} className="hover:text-white transition-colors">{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
