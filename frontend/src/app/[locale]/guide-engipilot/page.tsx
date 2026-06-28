"use client"
import { useRouter } from "@/i18n/navigation"
import { useLocale } from "next-intl"

export default function GuideEngipilot() {
  const router = useRouter()
  const locale = useLocale()

  return (
    <>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="print:hidden flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/${locale}/onboarding`)}
          className="text-sm text-muted-fg hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          ← Retour à l'onboarding
        </button>
        <button
          onClick={() => window.print()}
          className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          🖨️ Télécharger PDF
        </button>
      </div>

      {/* GUIDE */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-border shadow-sm p-10 print:shadow-none print:border-none print:p-8 print:max-w-none">

        {/* Couverture */}
        <div className="text-center mb-12 pb-10 border-b border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 print:w-12 print:h-12">
            <span className="text-white text-2xl font-black print:text-xl">E</span>
          </div>
          <h1 className="text-4xl font-black text-foreground mb-2 print:text-3xl">ENGIPILOT</h1>
          <p className="text-xl text-primary font-semibold mb-4">Guide Complet de Démarrage</p>
          <p className="text-sm text-muted-fg">Plateforme de gestion intelligente de projets BTP · Version 1.0</p>
          <div className="mt-6 flex justify-center gap-6 text-xs text-muted-fg">
            <span>📅 {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}</span>
            <span>📖 Guide utilisateur</span>
            <span>🏗️ Secteur BTP</span>
          </div>
        </div>

        {/* Sommaire */}
        <div className="mb-10 bg-muted/40 rounded-xl p-6">
          <h2 className="text-lg font-black mb-4">📋 Sommaire</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ["1", "Introduction à ENGIPILOT"],
              ["2", "Tableau de bord"],
              ["3", "Gestion des chantiers"],
              ["4", "Indicateurs EVM (SPI / CPI)"],
              ["5", "Rapports d'avancement"],
              ["6", "IA Copilot"],
              ["7", "Gestion des équipes"],
              ["8", "HSE & Qualité"],
              ["9", "Planning & Kanban"],
              ["10", "Paramètres & Intégrations"],
            ].map(([n, title]) => (
              <div key={n} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                <span className="text-foreground">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <Section n="1" title="Introduction à ENGIPILOT" icon="🏗️">
          <p>ENGIPILOT est une plateforme SaaS de gestion de projets BTP intégrant l'intelligence artificielle pour aider les conducteurs de travaux, chefs de projet et directions à piloter leurs chantiers en temps réel.</p>
          <Highlight color="blue">
            <strong>Mission :</strong> Réduire les retards, maîtriser les coûts et améliorer la sécurité sur les chantiers grâce à des données en temps réel et des prédictions IA.
          </Highlight>
          <SubSection title="Fonctionnalités principales">
            <ul className="space-y-1.5 text-sm">
              {[
                "Tableau de bord KPIs en temps réel (SPI, CPI, EAC)",
                "Suivi multi-chantiers avec alertes automatiques",
                "IA Copilot — analyse, génération de PV et rapports",
                "Gestion des équipes, rôles et permissions",
                "Suivi HSE, qualité et non-conformités",
                "Planning Gantt et vue Kanban",
                "Intégrations : Google Drive, ERP, API tierces",
              ].map(f => <li key={f} className="flex gap-2"><span className="text-primary">✓</span>{f}</li>)}
            </ul>
          </SubSection>
          <SubSection title="Accès à la plateforme">
            <p className="text-sm">URL : <strong>https://engipilot.ma</strong></p>
            <p className="text-sm mt-1">Navigateurs supportés : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
            <p className="text-sm mt-1">Application mobile disponible sur iOS et Android.</p>
          </SubSection>
        </Section>

        {/* Section 2 */}
        <Section n="2" title="Tableau de bord" icon="📊">
          <p>Le tableau de bord centralise tous vos indicateurs clés. Il se met à jour automatiquement toutes les 15 minutes.</p>
          <SubSection title="Widgets disponibles">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["KPIs EVM", "SPI, CPI, EAC, BAC, BCWP affichés par chantier"],
                ["Alertes actives", "Retards critiques, dépassements budgétaires, HSE"],
                ["Avancement global", "Progression physique vs planifiée"],
                ["Météo chantier", "Conditions météo impactant les délais"],
                ["Derniers rapports", "Accès rapide aux RJ et rapports mensuels"],
                ["Activité équipes", "Présences, absentéisme, sous-traitants"],
              ].map(([t, d]) => (
                <div key={t} className="bg-muted/30 rounded-lg p-3">
                  <p className="font-bold text-sm">{t}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{d}</p>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Personnalisation">
            <p className="text-sm">Cliquez sur <strong>⚙️ Personnaliser</strong> en haut à droite du tableau de bord pour réorganiser les widgets selon vos préférences. Les préférences sont sauvegardées par utilisateur.</p>
          </SubSection>
        </Section>

        {/* Section 3 */}
        <Section n="3" title="Gestion des chantiers" icon="🏢">
          <p>ENGIPILOT supporte la gestion simultanée de plusieurs chantiers avec suivi individuel et consolidé.</p>
          <SubSection title="Créer un chantier">
            <ol className="space-y-1.5 text-sm list-decimal list-inside">
              <li>Allez dans <strong>Chantiers</strong> → <strong>+ Nouveau chantier</strong></li>
              <li>Renseignez : nom, client, localisation, dates prévisionnelles</li>
              <li>Définissez le BAC (Budget at Completion)</li>
              <li>Assignez le chef de projet et l'équipe</li>
              <li>Importez le planning initial (Excel ou .mpp)</li>
            </ol>
          </SubSection>
          <SubSection title="Statuts des chantiers">
            <div className="space-y-2 text-sm">
              {[
                ["🟢 En cours", "Chantier actif avec rapports réguliers"],
                ["🟡 En attente", "En attente de démarrage ou suspendu temporairement"],
                ["🔴 Critique", "SPI < 0.80 ou CPI < 0.85 — nécessite intervention"],
                ["✅ Terminé", "Réceptionné et clôturé"],
              ].map(([s, d]) => (
                <div key={s} className="flex gap-3">
                  <span className="font-semibold w-32 flex-shrink-0">{s}</span>
                  <span className="text-muted-fg">{d}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Import Excel">
            <p className="text-sm">ENGIPILOT accepte l'import de chantiers via fichier Excel (.xlsx). Le modèle est disponible dans <strong>Ressources de démarrage</strong> sur la page Onboarding.</p>
            <Highlight color="yellow">Colonnes requises : Nom, Client, Localisation, Date début, Date fin prévue, BAC (MAD), Chef projet</Highlight>
          </SubSection>
        </Section>

        {/* Section 4 */}
        <Section n="4" title="Indicateurs EVM (SPI / CPI)" icon="📈">
          <p>ENGIPILOT utilise la méthode <strong>Earned Value Management (EVM)</strong> pour mesurer la performance des chantiers.</p>
          <SubSection title="Définitions des indicateurs">
            <div className="space-y-3 text-sm">
              {[
                ["SPI", "Schedule Performance Index", "BCWP / BCWS", "Mesure l'avancement réel vs planifié"],
                ["CPI", "Cost Performance Index", "BCWP / ACWP", "Mesure l'efficacité budgétaire"],
                ["EAC", "Estimate at Completion", "BAC / CPI", "Budget total projeté à la fin"],
                ["VAC", "Variance at Completion", "BAC - EAC", "Écart budgétaire prévu"],
                ["SV", "Schedule Variance", "BCWP - BCWS", "Écart de planning en valeur"],
                ["CV", "Cost Variance", "BCWP - ACWP", "Écart budgétaire courant"],
              ].map(([abbr, name, formula, desc]) => (
                <div key={abbr} className="grid grid-cols-4 gap-2 bg-muted/30 rounded-lg p-2.5">
                  <span className="font-black text-primary">{abbr}</span>
                  <span className="font-semibold text-xs">{name}</span>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{formula}</span>
                  <span className="text-xs text-muted-fg">{desc}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Seuils d'alerte">
            <div className="space-y-2 text-sm">
              {[
                ["✅ Vert", "SPI ≥ 1.0 et CPI ≥ 1.0", "Performance excellente"],
                ["🟡 Jaune", "SPI 0.90–1.0 ou CPI 0.90–1.0", "Surveillance recommandée"],
                ["🟠 Orange", "SPI 0.80–0.90 ou CPI 0.85–0.90", "Action corrective requise"],
                ["🔴 Rouge", "SPI < 0.80 ou CPI < 0.85", "Intervention urgente"],
              ].map(([status, range, action]) => (
                <div key={status} className="flex gap-3">
                  <span className="w-20 flex-shrink-0 font-semibold">{status}</span>
                  <span className="w-48 flex-shrink-0 font-mono text-xs bg-muted px-2 py-0.5 rounded">{range}</span>
                  <span className="text-muted-fg">{action}</span>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* Section 5 */}
        <Section n="5" title="Rapports d'avancement" icon="📄">
          <p>ENGIPILOT génère automatiquement des rapports journaliers (RJ), hebdomadaires et mensuels à partir des données saisies.</p>
          <SubSection title="Types de rapports">
            <ul className="space-y-1.5 text-sm">
              {[
                "Rapport Journalier (RJ) — avancement physique, effectifs, météo, incidents",
                "Rapport Hebdomadaire — synthèse EVM, planning, RH, budget",
                "Rapport Mensuel — analyse complète + recommandations direction",
                "Rapport HSE — incidents, taux de fréquence, non-conformités",
                "Rapport financier — BAC, EAC, facturation, reste à dépenser",
              ].map(r => <li key={r} className="flex gap-2"><span className="text-primary">→</span>{r}</li>)}
            </ul>
          </SubSection>
          <SubSection title="Soumettre un rapport journalier">
            <ol className="space-y-1.5 text-sm list-decimal list-inside">
              <li>Allez dans <strong>Rapports</strong> → <strong>+ Nouveau RJ</strong></li>
              <li>Sélectionnez le chantier et la date</li>
              <li>Renseignez l'avancement physique (%) et les effectifs</li>
              <li>Notez les points bloquants et décisions</li>
              <li>Cliquez <strong>Soumettre</strong> — le rapport est envoyé automatiquement</li>
            </ol>
          </SubSection>
          <Highlight color="green">
            L'IA Copilot peut générer automatiquement un résumé de rapport à partir de vos données — utilisez le mode <strong>Résumé Rapport</strong> dans le Chat IA.
          </Highlight>
        </Section>

        {/* Section 6 */}
        <Section n="6" title="IA Copilot" icon="🤖">
          <p>ENGIPILOT Copilot est votre assistant IA spécialisé BTP, disponible 24h/24 pour analyser vos chantiers et générer des documents.</p>
          <SubSection title="Modes disponibles">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["💬 Chat libre", "Posez toute question sur vos chantiers, KPIs, planning ou équipes"],
                ["📝 Générer PV", "Génération automatique de Procès-Verbaux de réunion"],
                ["📊 Résumé Rapport", "Synthèse et analyse de vos rapports d'avancement"],
                ["⚠️ Détection Risques", "Scan automatique et prédiction des risques chantier"],
              ].map(([mode, desc]) => (
                <div key={mode} className="bg-muted/30 rounded-lg p-3">
                  <p className="font-bold text-sm">{mode}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Exemples de questions">
            <ul className="space-y-1.5 text-sm">
              {[
                '"Analyse le SPI du chantier actif et donne-moi un plan de rattrapage"',
                '"Génère un PV de réunion hebdo pour le chantier actif"',
                '"Quels sont les risques budget sur mes chantiers ce mois-ci ?"',
                '"Résume le rapport d\'avancement d\'avril 2025"',
              ].map(q => <li key={q} className="flex gap-2 italic text-muted-fg"><span className="text-primary not-italic">→</span>{q}</li>)}
            </ul>
          </SubSection>
          <Highlight color="yellow">
            <strong>Anti-hallucination :</strong> Le Copilot indique toujours un niveau de confiance (0–100%) et signale clairement si une information est une estimation ou un fait confirmé.
          </Highlight>
        </Section>

        {/* Section 7 */}
        <Section n="7" title="Gestion des équipes" icon="👥">
          <p>ENGIPILOT permet de gérer les utilisateurs, rôles et permissions de manière granulaire.</p>
          <SubSection title="Rôles disponibles">
            <div className="space-y-2 text-sm">
              {[
                ["Admin", "Accès total — gestion organisation, utilisateurs, paramètres"],
                ["Chef Projet", "Accès multi-chantiers — rapports, KPIs, équipes, budget"],
                ["Chef Chantier", "Accès chantier assigné — RJ, planning, HSE, équipe terrain"],
                ["Consultant", "Accès lecture seule — tableaux de bord et rapports"],
              ].map(([role, desc]) => (
                <div key={role} className="flex gap-3">
                  <span className="font-bold w-28 flex-shrink-0 text-primary">{role}</span>
                  <span className="text-muted-fg">{desc}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Inviter un utilisateur">
            <ol className="space-y-1.5 text-sm list-decimal list-inside">
              <li>Allez dans <strong>Équipes</strong> → <strong>+ Inviter</strong></li>
              <li>Saisissez l'email et sélectionnez le rôle</li>
              <li>Assignez les chantiers accessibles</li>
              <li>L'utilisateur reçoit un email d'invitation avec lien d'activation</li>
            </ol>
          </SubSection>
        </Section>

        {/* Section 8 */}
        <Section n="8" title="HSE & Qualité" icon="🦺">
          <p>Le module HSE (Hygiène, Sécurité, Environnement) permet de suivre les incidents, non-conformités et audits qualité.</p>
          <SubSection title="Déclaration d'incident">
            <ol className="space-y-1.5 text-sm list-decimal list-inside">
              <li>Allez dans <strong>HSE</strong> → <strong>+ Nouvel incident</strong></li>
              <li>Catégorie : accident, presqu'accident, situation dangereuse</li>
              <li>Gravité : mineur, sérieux, grave, mortel</li>
              <li>Description, témoins, actions immédiates</li>
              <li>Le chef projet est notifié automatiquement</li>
            </ol>
          </SubSection>
          <SubSection title="Indicateurs HSE">
            <ul className="space-y-1.5 text-sm">
              {[
                "TF (Taux de Fréquence) = (nb accidents × 10⁶) / heures travaillées",
                "TG (Taux de Gravité) = (nb jours perdus × 10³) / heures travaillées",
                "Objectif ENGIPILOT : TF < 5 · TG < 0.5",
              ].map(i => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{i}</li>)}
            </ul>
          </SubSection>
        </Section>

        {/* Section 9 */}
        <Section n="9" title="Planning & Kanban" icon="📅">
          <p>ENGIPILOT propose deux vues de planification : Gantt pour la vision temporelle et Kanban pour le suivi des tâches.</p>
          <SubSection title="Vue Planning (Gantt)">
            <ul className="space-y-1.5 text-sm">
              {[
                "Visualisation des tâches sur une timeline",
                "Identification automatique du chemin critique",
                "Alertes retard colorées (vert / orange / rouge)",
                "Export PDF ou Excel",
              ].map(i => <li key={i} className="flex gap-2"><span className="text-primary">→</span>{i}</li>)}
            </ul>
          </SubSection>
          <SubSection title="Vue Kanban">
            <p className="text-sm">Colonnes par défaut : <strong>À faire</strong> · <strong>En cours</strong> · <strong>En attente</strong> · <strong>Terminé</strong></p>
            <p className="text-sm mt-1">Chaque carte affiche : responsable, priorité, date limite, chantier associé.</p>
          </SubSection>
        </Section>

        {/* Section 10 */}
        <Section n="10" title="Paramètres & Intégrations" icon="⚙️">
          <p>Accédez aux paramètres depuis le menu latéral → <strong>Paramètres</strong>.</p>
          <SubSection title="Intégrations disponibles">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Google Drive", "Synchronisation automatique des documents chantier"],
                ["Microsoft Outlook", "Calendrier réunions et rappels automatiques"],
                ["API ERP", "Connexion à votre système de gestion (SAP, Oracle, etc.)"],
                ["Amazon SES", "Envoi d'emails transactionnels et alertes"],
              ].map(([name, desc]) => (
                <div key={name} className="bg-muted/30 rounded-lg p-3">
                  <p className="font-bold text-sm">{name}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="Alertes IA">
            <p className="text-sm">Configurez les seuils SPI/CPI dans <strong>Paramètres → Alertes IA</strong> pour recevoir des notifications automatiques quand un chantier dépasse vos seuils.</p>
          </SubSection>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-fg">
          <p className="font-bold text-sm text-foreground mb-1">ENGIPILOT — Guide Complet v1.0</p>
          <p>Pour toute question : <strong>support@engipilot.ma</strong></p>
          <p className="mt-1">© {new Date().getFullYear()} ENGIPILOT · Tous droits réservés</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>
    </>
  )
}

function Section({ n, title, icon, children }: { n: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {n}
        </div>
        <h2 className="text-xl font-black text-foreground">{icon} {title}</h2>
      </div>
      <div className="pl-12 space-y-4 text-sm text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-primary rounded-full inline-block" />
        {title}
      </h3>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function Highlight({ color, children }: { color: "blue" | "yellow" | "green"; children: React.ReactNode }) {
  const colors = {
    blue:   "bg-blue-50 border-blue-200 text-blue-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    green:  "bg-green-50 border-green-200 text-green-900",
  }
  return (
    <div className={`mt-3 p-3 rounded-lg border text-sm ${colors[color]}`}>
      {children}
    </div>
  )
}
