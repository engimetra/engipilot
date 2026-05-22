"use client"

const STEPS = [
  { n:1, titre:"Créer votre organisation", desc:"Profil BTP Demo Corp configuré. 8 utilisateurs.", done:true },
  { n:2, titre:"Importer vos chantiers", desc:"12 chantiers importés depuis votre fichier Excel.", done:true },
  { n:3, titre:"Configurer les rôles", desc:"4 rôles définis : Admin, Chef Projet, Chef Chantier, Consultant.", done:true },
  { n:4, titre:"Premier rapport soumis", desc:"RJ-001 soumis par A. Khalil le 01/03/2024.", done:true },
  { n:5, titre:"Activer les alertes IA", desc:"Configurez les seuils SPI/CPI pour recevoir des alertes automatiques.", done:false, action:true },
  { n:6, titre:"Connecter vos intégrations", desc:"Google Drive, Outlook, API ERP pour synchronisation auto.", done:false },
  { n:7, titre:"Formation équipe terrain", desc:"Envoyer les guides d'utilisation mobile à vos chefs de chantier.", done:false },
]

export default function OnboardingPage() {
  const done = STEPS.filter(s => s.done).length
  const pct = Math.round(done / STEPS.length * 100)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Onboarding — Démarrage</h1>
          <p className="text-sm text-muted-fg mt-0.5">{done} / {STEPS.length} étapes complétées</p></div>
        <span className="text-2xl font-black text-blue-400">{pct}%</span>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <div className="flex justify-between text-xs text-muted-fg mb-2">
          <span>Progression</span><span>{done}/{STEPS.length} étapes</span>
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{width:`${pct}%`}} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-5">Étapes de configuration</h3>
          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${s.done ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : s.action ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "bg-muted text-muted-fg border border-muted"}`}>
                    {s.done ? "✓" : s.n}
                  </div>
                  {i < STEPS.length-1 && <div className={`w-px flex-1 mt-1 ${s.done ? "bg-green-500/30" : "bg-muted"}`} style={{minHeight:16}} />}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`text-sm font-semibold ${s.done ? "text-foreground" : s.action ? "text-foreground" : "text-muted-fg"}`}>{s.titre}</p>
                  <p className="text-xs text-muted-fg mt-0.5">{s.desc}</p>
                  {s.action && !s.done && (
                    <button className="mt-2 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">Configurer maintenant →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-3">Ressources de démarrage</h3>
            {[
              {icon:"📖", nom:"Guide complet ENGIPILOT", tag:"PDF"},
              {icon:"🎬", nom:"Tutoriel vidéo — 12 min", tag:"Vidéo"},
              {icon:"📊", nom:"Modèle import chantiers", tag:"Excel"},
              {icon:"📱", nom:"Guide app mobile terrain", tag:"PDF"},
              {icon:"🎧", nom:"Contacter le support", tag:"Support"},
            ].map(r => (
              <button key={r.nom} className="w-full flex items-center gap-3 p-2.5 bg-muted rounded-lg mb-1.5 hover:bg-muted/60 transition-colors text-left">
                <span className="text-lg">{r.icon}</span>
                <span className="flex-1 text-sm">{r.nom}</span>
                <span className="text-xs bg-card border px-1.5 py-0.5 rounded">{r.tag}</span>
              </button>
            ))}
          </div>

          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-3">Votre gestionnaire de compte</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center font-bold">NA</div>
              <div><p className="font-bold text-sm">Nadia Amrani</p>
                <p className="text-xs text-muted-fg">Customer Success · ENGIPILOT</p></div>
            </div>
            <button className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-700 transition-colors">📅 Planifier un appel onboarding</button>
          </div>
        </div>
      </div>
    </div>
  )
}
