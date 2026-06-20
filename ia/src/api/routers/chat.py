"""Chat Copilot BTP — réponses contextualisées depuis la base de données."""

import os, logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

log = logging.getLogger("Chat")
router = APIRouter()

DB_URL = os.getenv("DATABASE_URL", "")


class ChatRequest(BaseModel):
    message: str
    projet_id: Optional[str] = None
    contexte: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    suggestions: list[str]
    type: str


# ── Requêtes DB ────────────────────────────────────────────────────────────────

def _get_db():
    try:
        import psycopg2
        url = DB_URL.replace("postgresql+asyncpg://", "postgresql://")
        return psycopg2.connect(url) if url else None
    except Exception:
        return None


def _retards_context(projet_id: Optional[str] = None) -> dict:
    conn = _get_db()
    if not conn:
        return {}
    try:
        cur = conn.cursor()
        where = f"AND p.id = '{projet_id}'" if projet_id else ""
        cur.execute(f"""
            SELECT p.nom, p.avancement_physique, p.avancement_theorique,
                   k.spi, k.cpi,
                   (SELECT COUNT(*) FROM non_conformites nc
                    WHERE nc.projet_id=p.id AND nc.statut IN ('OUVERTE','EN_COURS')) AS nb_nc,
                   p.date_fin_prevue,
                   GREATEST(0, EXTRACT(DAY FROM (p.date_fin_prevue - CURRENT_DATE))) AS jours_restants
            FROM projets p
            LEFT JOIN LATERAL (
                SELECT spi, cpi FROM kpis_historiques
                WHERE projet_id=p.id ORDER BY date_mesure DESC LIMIT 1
            ) k ON true
            WHERE p.statut='EN_COURS' {where}
            ORDER BY k.spi ASC NULLS LAST
            LIMIT 5
        """)
        rows = cur.fetchall()
        conn.close()
        return {"projets": rows}
    except Exception as e:
        log.warning(f"DB chat error: {e}")
        conn.close()
        return {}


def _budget_context(projet_id: Optional[str] = None) -> dict:
    conn = _get_db()
    if not conn:
        return {}
    try:
        cur = conn.cursor()
        where = f"WHERE p.id = '{projet_id}'" if projet_id else "WHERE p.statut='EN_COURS'"
        cur.execute(f"""
            SELECT p.nom,
                   p.budget_previsionnel,
                   p.cout_reel,
                   ROUND((p.cout_reel / NULLIF(p.budget_previsionnel,0) * 100)::numeric, 1) AS consomme_pct,
                   k.cpi
            FROM projets p
            LEFT JOIN LATERAL (
                SELECT cpi FROM kpis_historiques
                WHERE projet_id=p.id ORDER BY date_mesure DESC LIMIT 1
            ) k ON true
            {where}
            ORDER BY consomme_pct DESC NULLS LAST
            LIMIT 5
        """)
        rows = cur.fetchall()
        conn.close()
        return {"projets": rows}
    except Exception as e:
        log.warning(f"DB budget error: {e}")
        conn.close()
        return {}


def _hse_context(projet_id: Optional[str] = None) -> dict:
    conn = _get_db()
    if not conn:
        return {}
    try:
        cur = conn.cursor()
        where = f"AND projet_id='{projet_id}'" if projet_id else ""
        cur.execute(f"""
            SELECT type, COUNT(*) as n,
                   SUM(nombre_jours_arret) as jours_arret
            FROM incidents_hse
            WHERE date_incident >= CURRENT_DATE - 90 {where}
            GROUP BY type
            ORDER BY n DESC
        """)
        rows = cur.fetchall()
        conn.close()
        return {"incidents": rows}
    except Exception as e:
        log.warning(f"DB hse error: {e}")
        conn.close()
        return {}


def _global_context() -> dict:
    conn = _get_db()
    if not conn:
        return {}
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE statut='EN_COURS') AS actifs,
                COUNT(*) FILTER (WHERE statut='TERMINE')  AS termines,
                ROUND(AVG(avancement_physique)::numeric, 1) AS av_moyen
            FROM projets
        """)
        row = cur.fetchone()
        conn.close()
        return {"actifs": row[0], "termines": row[1], "av_moyen": row[2]}
    except Exception as e:
        log.warning(f"DB global error: {e}")
        conn.close()
        return {}


# ── Génération de réponse ─────────────────────────────────────────────────────

def _build_retard_response(projet_id: Optional[str]) -> tuple[str, list[str]]:
    ctx = _retards_context(projet_id)
    projets = ctx.get("projets", [])

    if not projets:
        return (
            "📊 **Analyse des retards**\n\nAucun chantier actif trouvé dans la base de données.\n"
            "Créez un projet et saisissez les KPIs hebdomadaires pour activer l'analyse prédictive.",
            ["Créer un chantier", "Dashboard", "Documentation"],
        )

    lines = ["📊 **Analyse des retards — données en temps réel**\n"]
    critiques = []
    for nom, av_ph, av_th, spi, cpi, nb_nc, date_fin, jours_restants in projets:
        spi_val = float(spi) if spi else 1.0
        av_ph_val = float(av_ph) if av_ph else 0
        av_th_val = float(av_th) if av_th else 0
        delta = round(av_ph_val - av_th_val, 1)
        icon = "🔴" if spi_val < 0.85 else "🟡" if spi_val < 0.95 else "🟢"
        lines.append(f"{icon} **{nom}** — SPI={spi_val:.2f} | Avancement: {av_ph_val:.0f}% (théorique: {av_th_val:.0f}%) | NC ouvertes: {nb_nc}")
        if spi_val < 0.85:
            critiques.append(nom)

    if critiques:
        lines.append(f"\n⚠️ **{len(critiques)} chantier(s) en retard critique :** {', '.join(critiques)}")
        lines.append("\n✅ **Actions recommandées :**")
        lines.append("1. Renforcer les effectifs sur les lots en retard")
        lines.append("2. Clôturer les non-conformités bloquantes")
        lines.append("3. Organiser une réunion de rattrapage urgente")
    else:
        lines.append("\n✅ Tous les chantiers sont dans les délais.")

    return "\n".join(lines), ["Voir le Planning", "Module Kanban", "Rapport EVM"]


def _build_budget_response(projet_id: Optional[str]) -> tuple[str, list[str]]:
    ctx = _budget_context(projet_id)
    projets = ctx.get("projets", [])

    if not projets:
        return (
            "💰 **Analyse budgétaire**\n\nAucun projet avec données financières trouvé.",
            ["Créer un projet", "Dashboard"],
        )

    lines = ["💰 **Analyse budgétaire — données en temps réel**\n"]
    for nom, budget, cout_reel, pct, cpi in projets:
        pct_val = float(pct) if pct else 0
        cpi_val = float(cpi) if cpi else 1.0
        budget_val = float(budget) if budget else 0
        cout_val = float(cout_reel) if cout_reel else 0
        icon = "🔴" if pct_val > 100 or cpi_val < 0.85 else "🟡" if pct_val > 85 else "🟢"
        lines.append(f"{icon} **{nom}** — Budget: {budget_val:,.0f} MAD | Consommé: {cout_val:,.0f} MAD ({pct_val:.0f}%) | CPI={cpi_val:.2f}")

    return "\n".join(lines), ["Voir Analytics", "Rapport EVM", "Module Facturation"]


def _build_hse_response(projet_id: Optional[str]) -> tuple[str, list[str]]:
    ctx = _hse_context(projet_id)
    incidents = ctx.get("incidents", [])

    if not incidents:
        return (
            "🦺 **Bilan HSE — 90 derniers jours**\n\n✅ Aucun incident HSE enregistré. Excellent bilan de sécurité !",
            ["Déclarer un incident", "Module HSE", "Rapport sécurité"],
        )

    lines = ["🦺 **Bilan HSE — 90 derniers jours**\n"]
    total = sum(int(r[1]) for r in incidents)
    jours = sum(int(r[2] or 0) for r in incidents)
    lines.append(f"📊 **Total :** {total} incident(s) | {jours} jours d'arrêt\n")
    for type_inc, n, jours_arret in incidents:
        lines.append(f"• {type_inc}: {n} cas ({jours_arret or 0} jours d'arrêt)")

    return "\n".join(lines), ["Module HSE", "Déclarer un incident", "Rapport sécurité"]


def _build_global_response() -> tuple[str, list[str]]:
    ctx = _global_context()
    if not ctx:
        return (
            "📈 **État global Engipilot**\n\nBase de données non disponible. Vérifiez la connexion.",
            ["Dashboard", "Paramètres"],
        )

    lines = [
        "📈 **État global de vos chantiers**\n",
        f"• Chantiers actifs : **{ctx.get('actifs', 0)}**",
        f"• Chantiers terminés : **{ctx.get('termines', 0)}**",
        f"• Avancement moyen : **{ctx.get('av_moyen', 0)}%**",
    ]
    return "\n".join(lines), ["Dashboard KPI", "Voir tous les chantiers", "Analytics"]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    msg = request.message.lower()
    pid = request.projet_id

    if any(w in msg for w in ["retard", "spi", "planning", "délai", "rattrapage", "delay"]):
        resp, sugg = _build_retard_response(pid)
        return ChatResponse(response=resp, suggestions=sugg, type="retard")

    if any(w in msg for w in ["budget", "cpi", "coût", "dépassement", "eac", "financ", "cost"]):
        resp, sugg = _build_budget_response(pid)
        return ChatResponse(response=resp, suggestions=sugg, type="budget")

    if any(w in msg for w in ["hse", "sécurité", "incident", "accident", "tf", "tg", "safety"]):
        resp, sugg = _build_hse_response(pid)
        return ChatResponse(response=resp, suggestions=sugg, type="hse")

    if any(w in msg for w in ["avancement", "état", "global", "synthèse", "bilan", "résumé"]):
        resp, sugg = _build_global_response()
        return ChatResponse(response=resp, suggestions=sugg, type="avancement")

    return ChatResponse(
        response=(
            "Bonjour ! Je suis votre assistant ENGIPILOT connecté à vos données en temps réel.\n\n"
            "📊 **Retards** — SPI, chemin critique, plan de rattrapage\n"
            "💰 **Budget** — CPI, EAC, dépassements\n"
            "🦺 **HSE** — incidents, TF, TG, formations\n"
            "📈 **Avancement** — état global de vos chantiers\n\n"
            "Que souhaitez-vous analyser ?"
        ),
        suggestions=["Analyser les retards", "Bilan budgétaire", "Rapport HSE", "État d'avancement"],
        type="general",
    )
