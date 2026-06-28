"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";

/* ─── Types ─────────────────────────────────────────────── */
type NavItem = {
  label: string;
  scrollTo?: string;
  dropdown?: {
    columns: {
      heading?: string;
      items: { icon: string; title: string; desc: string; scroll?: string; href?: string }[];
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
            { icon: "📅", title: "Gestion de projets",  desc: "Pilotez chaque chantier de A à Z",     href: "/chantiers" },
            { icon: "📊", title: "Planning & Gantt",    desc: "Visualisez délais et dépendances",      href: "/planning" },
            { icon: "📋", title: "Tâches & Kanban",     desc: "Collaborez avec vos équipes",           href: "/kanban" },
          ],
        },
        {
          heading: "Contrôle",
          items: [
            { icon: "📈", title: "Rapports & BI",       desc: "Tableaux de bord en temps réel",        href: "/rapports" },
            { icon: "✅", title: "Qualité",             desc: "Inspections et non-conformités",        href: "/qualite" },
            { icon: "🦺", title: "HSE",                 desc: "Sécurité et incidents",                 href: "/hse" },
          ],
        },
        {
          heading: "IA & Analyse",
          items: [
            { icon: "🔮", title: "Prédiction IA",       desc: "Anticiper retards et dérives",          href: "/analytics" },
            { icon: "💰", title: "Optimisation coûts",  desc: "Réduire les surcoûts de 34 %",          href: "/analytics" },
            { icon: "🤝", title: "Assistant intelligent", desc: "Copilote IA pour vos décisions",      href: "/chat" },
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
            { icon: "📄", title: "Documents",         desc: "GED centralisée et sécurisée",      href: "/documents" },
            { icon: "👥", title: "Équipes & RH",      desc: "Ressources et compétences",         href: "/equipes" },
            { icon: "📦", title: "Approvisionnement", desc: "Achats, stocks, fournisseurs",      href: "/approvisionnement" },
          ],
        },
        {
          heading: "Finance",
          items: [
            { icon: "💰", title: "Facturation",       desc: "Suivi financier multi-projets",     href: "/facturation" },
            { icon: "📊", title: "EVM & KPIs",        desc: "Indicateurs de valeur acquise",     href: "/analytics" },
            { icon: "📉", title: "Budget & Coûts",    desc: "Contrôle budgétaire en direct",     href: "/analytics" },
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
            { icon: "🏗️", title: "Génie civil",          desc: "Routes, ponts, ouvrages d'art",   href: "/chantiers" },
            { icon: "🏢", title: "Bâtiment",             desc: "Résidentiel et tertiaire",         href: "/chantiers" },
            { icon: "⚡", title: "Énergie & Industrie",  desc: "Centrales, usines, réseaux",       href: "/chantiers" },
          ],
        },
        {
          heading: "Par département",
          items: [
            { icon: "👷", title: "Conducteurs de travaux", desc: "Suivi terrain en temps réel",   href: "/dashboard" },
            { icon: "📐", title: "BET & Ingénierie",       desc: "Études, plans, livrables",       href: "/documents" },
            { icon: "🏦", title: "Direction générale",     desc: "Vision globale et reporting",    href: "/analytics" },
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
            { icon: "📖", title: "Documentation",    desc: "Guides complets et référence API",     scroll: "ressources" },
            { icon: "🎬", title: "Vidéos tutoriels", desc: "Apprenez ENGIPILOT en 15 minutes",    scroll: "ressources" },
            { icon: "📊", title: "Modèles Excel",    desc: "Templates import chantiers",           scroll: "ressources" },
            { icon: "🎧", title: "Support",          desc: "Réponse garantie en moins de 2 h",    scroll: "ressources" },
          ],
        },
      ],
    },
  },
  { label: "À propos",  scrollTo: "a-propos"  },
];

/* ─── Dropdown ───────────────────────────────────────────── */
function NavDropdown({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const router = useRouter();
  if (!item.dropdown) return null;
  const { columns } = item.dropdown;

  function go(scroll?: string, href?: string) {
    onClose();
    if (href) router.push(href);
    else if (scroll) setTimeout(() => document.getElementById(scroll)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ minWidth: columns.length === 1 ? 260 : columns.length === 2 ? 500 : 720 }}
    >
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 shadow-[-1px_-1px_2px_rgba(0,0,0,0.04)]" />
      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
        <div className="grid divide-x divide-gray-50" style={{ gridTemplateColumns: `repeat(${columns.length},1fr)` }}>
          {columns.map((col, ci) => (
            <div key={ci} className="p-5">
              {col.heading && (
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3 px-1">{col.heading}</p>
              )}
              <div className="space-y-0.5">
                {col.items.map((it) => (
                  <button
                    key={it.title}
                    onClick={() => go(it.scroll, it.href)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50 group transition-colors text-left"
                  >
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{it.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-[#2563EB] transition-colors">{it.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{it.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-xs text-gray-400">Essai gratuit · Sans carte bancaire</p>
          <button
            onClick={() => { onClose(); router.push("/login"); }}
            className="text-xs font-bold text-[#2563EB] hover:text-[#1E3A8A] transition-colors"
          >
            Commencer maintenant →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Donut Chart (SVG) ──────────────────────────────────── */
function DonutChart({ value, color, size = 72 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
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
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenNav(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function scroll(id: string) {
    setMobileOpen(false);
    setOpenNav(null);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const partners = [
    { name: "VINCI\nConstruction", color: "#FFD700", bg: "#FFF9E6", text: "#B8860B" },
    { name: "BOUYGUES\nConstruction", color: "#FF6600", bg: "#FFF3EC", text: "#CC4400" },
    { name: "EIFFAGE\nConstruction", color: "#E30613", bg: "#FEF0F0", text: "#B30010" },
    { name: "spie\nbatignolles",     color: "#1A5276", bg: "#EBF5FB", text: "#1A5276" },
    { name: "GROUPE\nLEGENDRE",      color: "#27AE60", bg: "#EAFAF1", text: "#1E8449" },
    { name: "NGE",                   color: "#2C3E50", bg: "#ECF0F1", text: "#2C3E50" },
  ];

  const features = [
    { icon: "🔮", title: "Prédiction des retards",    desc: "L'IA détecte les dérives 3 semaines à l'avance.",     badge: "IA",        color: "#7C3AED", href: "/analytics" },
    { icon: "📊", title: "Tableaux de bord EVM",      desc: "SPI, CPI et valeur acquise calculés automatiquement.", badge: "Analytics",  color: "#2563EB", href: "/analytics" },
    { icon: "⚠️", title: "Détection d'anomalies",     desc: "Alertes proactives qualité, sécurité, budget.",        badge: "Alertes",    color: "#D97706", href: "/hse" },
    { icon: "💰", title: "Optimisation des coûts",    desc: "−34 % sur les surcoûts grâce à l'analyse prédictive.", badge: "Finance",    color: "#059669", href: "/analytics" },
    { icon: "🤝", title: "Assistant intelligent",     desc: "Copilote IA : rapports, planning, questions terrain.",  badge: "Copilote",   color: "#DB2777", href: "/chat" },
    { icon: "📋", title: "Rapports automatisés",      desc: "Rapports PDF/Excel générés et envoyés par email.",      badge: "Auto",       color: "#0891B2", href: "/rapports" },
  ];

  const modules = [
    { title: "Gestion de projets",  icon: "📅", href: "/chantiers" },
    { title: "Planning & Gantt",    icon: "📊", href: "/planning" },
    { title: "Tâches & Kanban",     icon: "📋", href: "/kanban" },
    { title: "Documents",           icon: "📄", href: "/documents" },
    { title: "Équipes & RH",        icon: "👥", href: "/equipes" },
    { title: "HSE",                 icon: "🦺", href: "/hse" },
    { title: "Qualité",             icon: "✅", href: "/qualite" },
    { title: "Approvisionnement",   icon: "📦", href: "/approvisionnement" },
    { title: "Facturation",         icon: "💰", href: "/facturation" },
    { title: "Rapports & BI",       icon: "📈", href: "/rapports" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className={`w-full sticky top-0 z-50 transition-all duration-200 bg-white ${scrolled ? "shadow-[0_1px_20px_rgba(0,0,0,0.08)] border-b border-gray-100" : "border-b border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-5" ref={navRef}>
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button onClick={() => scroll("hero")} className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm group-hover:bg-[#1E3A8A] transition-colors">
                <span className="text-white text-xs font-black tracking-tight">EP</span>
              </div>
              <span className="text-[17px] font-black text-[#0F172A] tracking-tight group-hover:text-[#2563EB] transition-colors">
                ENGIPILOT
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
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
                      onMouseLeave={() => { if (hasDropdown && !isOpen) {} }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isOpen ? "bg-blue-50 text-[#2563EB]" : "text-[#475569] hover:text-[#0F172A] hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      {hasDropdown && (
                        <svg className={`w-3 h-3 transition-transform duration-150 ${isOpen ? "rotate-180 text-[#2563EB]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {isOpen && hasDropdown && (
                      <div onMouseEnter={() => setOpenNav(item.label)} onMouseLeave={() => setOpenNav(null)}>
                        <NavDropdown item={item} onClose={() => setOpenNav(null)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={() => router.push("/login")} className="text-sm font-medium text-[#475569] hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Se connecter
              </button>
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                Commencer gratuitement
              </button>
            </div>

            {/* Mobile burger */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-gray-700 transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-gray-700 transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-gray-100 py-3 space-y-0.5">
              {NAV.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => { if (item.scrollTo) scroll(item.scrollTo); else setMobileExpanded(mobileExpanded === item.label ? null : item.label); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#475569] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {item.label}
                    {item.dropdown && (
                      <svg className={`w-4 h-4 transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {mobileExpanded === item.label && item.dropdown && (
                    <div className="ml-3 mt-0.5 border-l-2 border-blue-100 pl-3 space-y-0.5">
                      {item.dropdown.columns.flatMap(c => c.items).map((it) => (
                        <button
                          key={it.title}
                          onClick={() => { setMobileOpen(false); if (it.href) router.push(it.href); else if (it.scroll) scroll(it.scroll); }}
                          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-[#475569] hover:text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors text-left"
                        >
                          <span>{it.icon}</span> {it.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 px-1">
                <button onClick={() => router.push("/login")} className="w-full py-2.5 text-sm font-medium text-[#475569] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Se connecter
                </button>
                <button onClick={() => router.push("/login")} className="w-full py-2.5 text-sm font-bold text-white bg-[#2563EB] rounded-xl hover:bg-[#1E3A8A] transition-colors">
                  Commencer gratuitement
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="hero" className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-7">
              <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-pulse" />
              PLATEFORME TOUT-EN-UN POUR LE BTP
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-black leading-[1.1] tracking-tight">
              Pilotez vos projets<br />
              BTP avec{" "}
              <span className="text-[#2563EB]">intelligence</span>
            </h1>

            <p className="mt-6 text-base lg:text-lg text-[#475569] leading-relaxed max-w-lg">
              ENGIPILOT centralise la gestion de vos chantiers, équipes,
              documents et performances dans une plateforme collaborative
              boostée par l&apos;IA.
            </p>

            <div className="mt-8 flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-[0_2px_16px_rgba(37,99,235,0.35)]"
              >
                Commencer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => scroll("features")}
                className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-[#2563EB]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Voir la démo
              </button>
            </div>

            {/* Feature pills */}
            <div className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "☁️", label: "Cloud sécurisé" },
                { icon: "🤖", label: "IA intégrée" },
                { icon: "⚡", label: "Temps réel" },
                { icon: "🏗️", label: "Multi-projets" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-xs font-semibold text-[#475569] text-center">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — photo + dashboard overlay */}
          <div className="relative">
            {/* Photo */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/11" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&q=80&fit=crop&crop=center"
                alt="Équipe ingénieurs BTP sur chantier"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]/40" />
            </div>

            {/* Dashboard card overlay */}
            <div className="absolute -bottom-6 -left-4 right-4 lg:-left-8 lg:right-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Dashboard header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#2563EB] flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">EP</span>
                </div>
                <span className="text-xs font-bold text-[#0F172A]">ENGIPILOT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                <span className="text-xs text-emerald-600 font-medium">Live</span>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-4 divide-x divide-gray-50 px-2 py-3 gap-0">
                {[
                  { label: "Avancement global", value: 72,  display: "72%",  color: "#2563EB", type: "donut" },
                  { label: "Budget consommé",   value: 64,  display: "64%",  color: "#059669", type: "donut" },
                  { label: "Tâches actives",    value: 128, display: "128",  color: "#7C3AED", type: "number" },
                  { label: "Alertes HSE",       value: 7,   display: "7",    color: "#DC2626", type: "number" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex flex-col items-center gap-1 px-1 py-1">
                    {kpi.type === "donut" ? (
                      <div className="relative">
                        <DonutChart value={kpi.value} color={kpi.color} size={56} />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: kpi.color }}>{kpi.display}</span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center">
                        <span className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.display}</span>
                      </div>
                    )}
                    <p className="text-[9px] text-gray-400 font-medium text-center leading-tight">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Bottom grid */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                {/* Avancement par lot */}
                <div className="px-3 py-2.5 col-span-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-2">Avancement par lot</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Gros œuvre", val: 80 },
                      { label: "Second œuvre", val: 65 },
                      { label: "VRD", val: 70 },
                      { label: "Finitions", val: 60 },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-500 w-16 truncate">{row.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${row.val}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-gray-600 w-7 text-right">{row.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activité récente */}
                <div className="px-3 py-2.5 col-span-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-2">Activité récente</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: "📦", label: "Réception béton – Zone A", time: "il y a 2h" },
                      { icon: "🚚", label: "Livraison matériaux",      time: "il y a 3h" },
                      { icon: "✅", label: "Contrôle sécurité",        time: "il y a 4h" },
                      { icon: "💬", label: "Réunion de chantier",      time: "il y a 5h" },
                    ].map((a) => (
                      <div key={a.label} className="flex items-center gap-1.5">
                        <span className="text-[10px]">{a.icon}</span>
                        <span className="text-[9px] text-gray-600 flex-1 truncate">{a.label}</span>
                        <span className="text-[8px] text-gray-400 flex-shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Localisation */}
                <div className="px-3 py-2.5 col-span-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-2">Localisation des chantiers</p>
                  <div className="w-full h-16 bg-[#EBF5FF] rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30"
                      style={{ backgroundImage: "linear-gradient(#2563EB22 1px,transparent 1px),linear-gradient(90deg,#2563EB22 1px,transparent 1px)", backgroundSize: "12px 12px" }} />
                    {[
                      { top: "20%", left: "30%" },
                      { top: "50%", left: "60%" },
                      { top: "65%", left: "25%" },
                    ].map((p, i) => (
                      <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
                        <div className="w-3 h-3 bg-[#2563EB] rounded-full border-2 border-white shadow-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for dashboard overflow */}
      <div className="h-16 bg-[#F8FAFC]" />

      {/* ── ILS NOUS FONT CONFIANCE ──────────────────────────── */}
      <section id="solutions" className="py-14 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-center text-gray-400 text-xs uppercase tracking-[0.2em] font-bold mb-10">
            Ils nous font confiance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-center border border-gray-100 rounded-xl p-4 h-16 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{ background: p.bg }}
              >
                <span
                  className="text-sm font-black text-center leading-tight whitespace-pre-line"
                  style={{ color: p.text }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS IA ───────────────────────────────── */}
      <section id="features" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-100 px-4 py-1.5 rounded-full text-xs font-bold mb-5">
              🤖 IA INTÉGRÉE
            </div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black">L&apos;IA au service de vos projets</h2>
            <p className="mt-4 text-[#475569] text-lg max-w-2xl mx-auto">
              ENGIPILOT analyse vos données en temps réel pour prédire les risques,
              optimiser les ressources et améliorer vos chantiers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <button
                key={f.title}
                onClick={() => router.push(f.href)}
                className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg hover:border-blue-100 transition-all duration-200 hover:-translate-y-0.5 group text-left"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: f.color + "12" }}>
                    {f.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: f.color, background: f.color + "12" }}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-2 group-hover:text-[#2563EB] transition-colors">{f.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{f.desc}</p>
              </button>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_2px_16px_rgba(37,99,235,0.3)]"
            >
              Découvrir toutes les fonctionnalités
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── MODULES ─────────────────────────────────────────── */}
      <section id="modules" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black">Une plateforme complète</h2>
            <p className="mt-4 text-[#475569] text-lg">Des modules intégrés pour chaque aspect de vos projets</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {modules.map((m) => (
              <button
                key={m.title}
                onClick={() => router.push(m.href)}
                className="bg-[#F8FAFC] border border-transparent rounded-2xl p-5 hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-left group"
              >
                <div className="text-3xl mb-3">{m.icon}</div>
                <p className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors leading-tight">{m.title}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ──────────────────────────────────────────── */}
      <section id="tarifs" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white text-[#475569] border border-gray-200 px-4 py-1.5 rounded-full text-xs font-bold mb-5 shadow-sm">
              💳 TARIFS TRANSPARENTS
            </div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black">Des plans pour chaque organisation</h2>
            <p className="mt-4 text-[#475569] text-lg">Commencez gratuitement · Passez à Pro quand vous êtes prêt</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Starter", price: "499 MAD", sub: "/ mois",
                features: ["3 utilisateurs", "5 projets actifs", "Chat IA intégré", "Dashboard & KPIs de base", "Rapports journaliers"],
                cta: "Démarrer l'essai gratuit", highlight: false, href: "/register?plan=starter", isEnterprise: false,
              },
              {
                name: "Pro", price: "1 490 MAD", sub: "/ mois",
                features: ["15 utilisateurs", "Projets illimités", "IA avancée & prédictive", "KPIs EVM complets", "Rapports avancés PDF/Excel", "Support prioritaire 24/7"],
                cta: "Démarrer l'essai gratuit", highlight: true, href: "/register?plan=pro", isEnterprise: false,
              },
              {
                name: "Enterprise", price: "Sur devis", sub: "",
                features: ["Utilisateurs illimités", "Projets illimités", "Accès API complet", "IA personnalisée", "SLA 99,9 % garanti", "Support dédié & account manager"],
                cta: "Nous contacter", highlight: false, href: "mailto:contact@engipilot.ma", isEnterprise: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border transition-all hover:-translate-y-1 flex flex-col ${
                  plan.highlight ? "shadow-2xl scale-[1.02]" : "bg-white border-gray-200 shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] rounded-2xl" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap z-10">
                      ⭐ RECOMMANDÉ
                    </div>
                  </>
                )}
                <div className="relative p-7 flex flex-col flex-1 justify-between gap-0">
                  <div>
                    <h3 className={`text-xl font-black ${plan.highlight ? "text-white" : "text-[#0F172A]"}`}>{plan.name}</h3>
                    <div className="mt-2 flex items-end gap-1 mb-5">
                      <span className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-[#2563EB]"}`}>{plan.price}</span>
                      {plan.sub && <span className={`text-sm mb-0.5 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>{plan.sub}</span>}
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? "text-white/80" : "text-[#475569]"}`}>
                          <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-[#2563EB]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href={plan.href}
                    className={`block w-full py-3 rounded-xl font-bold text-sm text-center transition-all shadow-md ${
                      plan.highlight
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
          <p className="text-center mt-8 text-sm text-gray-400">Tous les prix sont HT · Essai gratuit sans carte bancaire · Annulation à tout moment</p>
        </div>
      </section>

      {/* ── RESSOURCES ──────────────────────────────────────── */}
      <section id="ressources" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black">Ressources</h2>
            <p className="mt-4 text-[#475569] text-lg">Tout ce dont vous avez besoin pour démarrer et réussir</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "📖", title: "Documentation",   desc: "Guides complets, tutoriels et référence API.",              cta: "Consulter la doc", color: "#2563EB" },
              { icon: "🎬", title: "Vidéos tutoriels",desc: "Apprenez ENGIPILOT en moins de 15 minutes.",               cta: "Regarder",         color: "#7C3AED" },
              { icon: "📊", title: "Modèles Excel",   desc: "Templates d'import chantiers, formats CSV et XLSX.",       cta: "Télécharger",      color: "#D97706" },
              { icon: "🎧", title: "Support expert",  desc: "Notre équipe répond en moins de 2 h, 7 j/7.",              cta: "Contacter",        color: "#DB2777" },
            ].map((r) => (
              <div key={r.title} className="bg-[#F8FAFC] border border-transparent rounded-2xl p-7 hover:bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: r.color + "12" }}>
                  {r.icon}
                </div>
                <h3 className="text-base font-bold group-hover:text-[#2563EB] transition-colors">{r.title}</h3>
                <p className="text-[#475569] text-sm leading-relaxed flex-1">{r.desc}</p>
                <button onClick={() => scroll("ressources")} className="text-sm font-bold flex items-center gap-1 hover:underline" style={{ color: r.color }}>
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

      {/* ── À PROPOS ─────────────────────────────────────────── */}
      <section id="a-propos" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white text-[#475569] border border-gray-200 px-4 py-1.5 rounded-full text-xs font-bold mb-7 shadow-sm">
              🏢 NOTRE HISTOIRE
            </div>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-5">À propos<br />d&apos;ENGIPILOT</h2>
            <p className="text-[#475569] text-lg leading-relaxed mb-4">
              ENGIPILOT est né d&apos;un constat simple : les professionnels du BTP méritent
              des outils à la hauteur de leurs défis. Notre plateforme combine la puissance
              de l&apos;IA avec une expérience pensée pour le terrain.
            </p>
            <p className="text-[#475569] text-lg leading-relaxed mb-9">
              Développée par des ingénieurs passionnés, ENGIPILOT accompagne aujourd&apos;hui
              plus de 2 400 chantiers dans 15 pays.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => router.push("/login")} className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1E3A8A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md">
                Rejoindre ENGIPILOT
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button onClick={() => scroll("a-propos")} className="flex items-center gap-2 border border-gray-200 bg-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                Nous contacter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "2 400+", label: "Projets supervisés",     icon: "🏗️" },
              { value: "15",     label: "Pays couverts",           icon: "🌍" },
              { value: "−34 %",  label: "Réduction des surcoûts", icon: "📉" },
              { value: "99.9 %", label: "Disponibilité SLA",      icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-7 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-3xl font-black text-[#2563EB]">{s.value}</div>
                <div className="text-[#475569] text-sm mt-1.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="relative bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-3xl p-14 overflow-hidden text-center">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/10 rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-7">
                🚀 DÉMARREZ EN MOINS DE 5 MINUTES
              </div>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight">
                Prêt à transformer la gestion<br />de vos projets BTP ?
              </h2>
              <p className="mt-5 text-lg text-white/60 max-w-2xl mx-auto">
                Rejoignez les entreprises qui font confiance à ENGIPILOT pour piloter leurs projets avec succès.
              </p>
              <div className="mt-9 flex gap-4 justify-center flex-wrap">
                <button onClick={() => router.push("/login")} className="flex items-center gap-2 bg-white text-[#2563EB] px-7 py-3.5 rounded-xl font-black text-sm hover:bg-blue-50 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
                  Commencer gratuitement
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button onClick={() => scroll("a-propos")} className="flex items-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
                  Planifier une démo
                </button>
              </div>
              <p className="mt-5 text-white/40 text-sm">Sans engagement · Sans carte bancaire · 14 jours gratuits</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] text-white py-14">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-5 gap-10 pb-10 border-b border-white/10">
            <div className="lg:col-span-2">
              <button onClick={() => scroll("hero")} className="flex items-center gap-2.5 mb-5 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                  <span className="text-white text-xs font-black">EP</span>
                </div>
                <span className="text-lg font-black tracking-tight">ENGIPILOT</span>
              </button>
              <p className="text-white/50 leading-relaxed text-sm max-w-xs">
                La plateforme tout-en-un pour piloter vos projets BTP avec intelligence et performance.
              </p>
              <div className="mt-5 flex gap-2">
                {["in", "tw", "yt"].map((s) => (
                  <button key={s} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-xs font-bold text-white/60 hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: "Produit", links: [
                { label: "Fonctionnalités", scroll: "features" },
                { label: "Modules",         scroll: "modules" },
                { label: "Tarifs",          scroll: "tarifs" },
                { label: "Nouveautés",      scroll: "hero" },
              ]},
              { title: "Ressources", links: [
                { label: "Documentation", scroll: "ressources" },
                { label: "Vidéos",        scroll: "ressources" },
                { label: "Blog",          scroll: "ressources" },
                { label: "Support",       scroll: "ressources" },
              ]},
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button onClick={() => scroll(link.scroll)} className="text-white/50 hover:text-white text-sm transition-colors">
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="font-bold mb-4 text-sm">Newsletter</h4>
              <p className="text-white/50 text-xs mb-3 leading-relaxed">Les dernières mises à jour BTP, chaque semaine.</p>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <input type="email" placeholder="Votre email" className="flex-1 px-3 py-2.5 text-xs bg-white/5 text-white placeholder-white/30 outline-none focus:bg-white/10 transition-colors" />
                <button className="bg-[#2563EB] hover:bg-[#1E3A8A] px-4 transition-colors text-white font-bold text-sm">→</button>
              </div>
            </div>
          </div>
          <div className="mt-7 flex flex-col lg:flex-row justify-between gap-4 text-sm text-white/40">
            <p>© 2026 ENGIPILOT. Tous droits réservés.</p>
            <div className="flex gap-6">
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
