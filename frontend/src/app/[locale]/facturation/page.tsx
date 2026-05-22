"use client"
import { useState } from "react"
import { CheckCircle, Download, X, ExternalLink } from "lucide-react"

const PLANS = [
  { nom:"Starter", prix:"0", periode:"Gratuit", actif:false, features:[
    {ok:true,t:"3 chantiers max"},{ok:true,t:"Dashboard basique"},{ok:true,t:"Rapports journaliers"},
    {ok:false,t:"KPIs EVM avancés"},{ok:false,t:"Module IA"},{ok:false,t:"Export PDF"},
  ]},
  { nom:"Pro", prix:"1 490 MAD", periode:"/ mois · annuel", actif:true, features:[
    {ok:true,t:"20 chantiers"},{ok:true,t:"KPIs EVM complets"},{ok:true,t:"Module IA prédictions"},
    {ok:true,t:"Export PDF illimité"},{ok:true,t:"Kanban + Gantt"},{ok:true,t:"Support prioritaire"},
  ]},
  { nom:"Enterprise", prix:"Sur devis", periode:"Multi-organisations", actif:false, features:[
    {ok:true,t:"Chantiers illimités"},{ok:true,t:"Multi-tenant SaaS"},{ok:true,t:"IA personnalisée"},
    {ok:true,t:"API accès complet"},{ok:true,t:"SSO + SAML"},{ok:true,t:"SLA 99.9%"},
  ]},
]

const FACTURES = [
  { ref:"#2025-05", date:"01/05/2025", montant:"1 490 MAD", statut:"Payée" },
  { ref:"#2025-04", date:"01/04/2025", montant:"1 490 MAD", statut:"Payée" },
  { ref:"#2025-03", date:"01/03/2025", montant:"1 490 MAD", statut:"Payée" },
  { ref:"#2025-02", date:"01/02/2025", montant:"1 490 MAD", statut:"Payée" },
]

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

function ModalContact({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Contacter l'équipe commerciale</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-fg block mb-1.5">Votre nom</label>
            <input defaultValue="Ahmed Khalil" className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-fg block mb-1.5">Email</label>
            <input type="email" defaultValue="ahmed.khalil@engipilot.ma" className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-fg block mb-1.5">Message</label>
            <textarea rows={3} defaultValue="Je suis intéressé par le plan Enterprise pour mon organisation." className="input resize-none" />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl justify-end">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={onClose} className="btn-primary"><CheckCircle className="w-4 h-4" /> Envoyer</button>
        </div>
      </div>
    </div>
  )
}

export default function FacturationPage() {
  const [toast, setToast] = useState("")
  const [showContact, setShowContact] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3500)
  }

  function downloadFacture(ref: string) {
    const content = `
      <html><head><title>Facture ENGIPILOT ${ref}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1d27}
      h1{font-size:22px;border-bottom:2px solid #635BFF;padding-bottom:10px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .total{font-size:18px;font-weight:bold;color:#635BFF}
      .footer{margin-top:40px;font-size:11px;color:#888}</style></head>
      <body>
        <h1>📄 Facture ENGIPILOT</h1>
        <p style="color:#888">Référence : ${ref}</p>
        <div class="row"><span>Abonnement Pro — mensuel</span><span>1 490,00 MAD</span></div>
        <div class="row"><span>TVA 20%</span><span>298,00 MAD</span></div>
        <div class="row total"><span>Total TTC</span><span>1 788,00 MAD</span></div>
        <div class="footer">ENGIPILOT SaaS · ICE: 002345678000083 · engipilot.ma<br/>
        Cette facture a été générée automatiquement.</div>
      </body></html>
    `
    const win = window.open("", "_blank", "width=700,height=500")
    if (!win) return
    win.document.write(content)
    win.document.close()
    setTimeout(() => win.print(), 400)
    showToast(`Facture ${ref} prête`)
  }

  return (
    <div className="space-y-6 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      {showContact && <ModalContact onClose={() => { setShowContact(false); showToast("Message envoyé à l'équipe commerciale") }} />}

      <div>
        <h1 className="page-title">Facturation & Plans SaaS</h1>
        <p className="text-sm text-muted-fg mt-0.5">Gérez votre abonnement ENGIPILOT</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-3 gap-5">
        {PLANS.map(p => (
          <div key={p.nom} className={`bg-white border rounded-2xl p-5 relative flex flex-col shadow-card transition-all
            ${p.actif ? "border-primary border-2" : "border-border hover:border-primary/40"}`}>
            {p.actif && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Plan actuel ✓
              </div>
            )}
            <div className="mb-4">
              <h3 className="font-black text-lg text-foreground">{p.nom}</h3>
              <div className="mt-2">
                <span className="text-2xl font-black text-foreground">{p.prix}</span>
                <span className="text-sm text-muted-fg ml-1">{p.periode}</span>
              </div>
            </div>
            <div className="h-px bg-border mb-4" />
            <div className="space-y-2 flex-1 mb-5">
              {p.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={f.ok ? "text-success" : "text-muted-fg/40"}>{f.ok ? "✓" : "✗"}</span>
                  <span className={f.ok ? "text-foreground" : "text-muted-fg"}>{f.t}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (p.actif) return
                if (p.nom === "Enterprise") setShowContact(true)
                else showToast("Redirection vers le paiement sécurisé…")
              }}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all
                ${p.actif
                  ? "bg-primary/10 text-primary cursor-default"
                  : p.nom === "Enterprise"
                    ? "bg-success text-white hover:bg-success/90"
                    : "bg-primary text-white hover:bg-primary-hover"}`}
            >
              {p.actif ? "✓ Plan actuel" : p.nom === "Enterprise" ? "Nous contacter" : "Passer au Pro →"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Usage */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-bold text-sm mb-4 text-foreground">Usage ce mois</h3>
          {[
            { l:"Chantiers actifs", v:12, max:20, unit:"/ 20" },
            { l:"Utilisateurs", v:8, max:25, unit:"/ 25" },
            { l:"Stockage", v:4.2, max:50, unit:"/ 50 GB" },
            { l:"Requêtes IA", v:847, max:5000, unit:"/ 5 000" },
          ].map(item => (
            <div key={item.l} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-fg">{item.l}</span>
                <span className="font-bold text-foreground">{item.v} {item.unit}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{width:`${Math.min((item.v/item.max)*100, 100)}%`}} />
              </div>
            </div>
          ))}
        </div>

        {/* Historique factures */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-bold text-sm mb-4 text-foreground">Historique facturation</h3>
          <div className="space-y-2">
            {FACTURES.map(f => (
              <div key={f.ref} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">Facture {f.ref}</p>
                  <p className="text-xs text-muted-fg">{f.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{f.montant}</span>
                  <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">{f.statut}</span>
                  <button
                    onClick={() => downloadFacture(f.ref)}
                    className="p-1.5 rounded-lg border border-border hover:border-primary hover:text-primary text-muted-fg transition-colors"
                    title="Télécharger la facture"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
