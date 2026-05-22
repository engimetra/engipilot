from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    projet_id: str | None = None
    contexte: dict | None = None


class ChatResponse(BaseModel):
    response: str
    suggestions: list[str]
    type: str


REPONSES = {
    "retard": (
        "Analyse des retards en cours...\n\n"
        "📊 **Situation actuelle :** 3 chantiers présentent un SPI inférieur à 0,85. "
        "Le plus critique est Usine Bouskoura avec SPI=0,72.\n\n"
        "⚠️ **Causes identifiées :**\n"
        "• Sous-effectif dans le lot électricité (-38%)\n"
        "• 4 non-conformités ouvertes bloquantes\n"
        "• Retards livraisons câblage (3 semaines)\n\n"
        "✅ **Plan de rattrapage recommandé :**\n"
        "1. Recruter 8 électriciens supplémentaires cette semaine\n"
        "2. Contacter fournisseur câblage pour livraison accélérée\n"
        "3. Réunion d'urgence sous-traitants lundi matin",
        ["Voir le Kanban", "Rapport HSE", "Export PDF"],
    ),
    "budget": (
        "Analyse budgétaire...\n\n"
        "💰 **État budgétaire :** CPI moyen = 0,89 — dépassement modéré sur 2 chantiers.\n\n"
        "📈 **EAC révisé :**\n"
        "• Résidence Al Andalous : +3,2M MAD vs contractuel\n"
        "• Usine Bouskoura : +15,3M MAD vs contractuel\n\n"
        "✅ **Actions recommandées :**\n"
        "1. Renégocier prix béton avec fournisseur principal\n"
        "2. Audit des pertes matériaux Lot Gros Œuvre\n"
        "3. Réduire heures supplémentaires non planifiées",
        ["Voir Analytics", "Rapport EVM", "Contacter DG"],
    ),
    "hse": (
        "Bilan HSE...\n\n"
        "🦺 **Indicateurs de sécurité :**\n"
        "• TF = 8,5 (objectif < 15 ✅)\n"
        "• TG = 0,43 (objectif < 1 ✅)\n"
        "• Heures sans accident : 12 450h\n\n"
        "⚠️ **Points d'attention :**\n"
        "• 2 presque-accidents signalés cette semaine\n"
        "• Formation levage à renouveler pour 3 ouvriers\n\n"
        "✅ **Actions :**\n"
        "1. Organiser toolbox meeting sécurité lundi\n"
        "2. Planifier formation levage avant fin du mois",
        ["Module HSE", "Déclarer incident", "Rapport sécurité"],
    ),
    "avancement": (
        "État d'avancement global...\n\n"
        "📊 **Synthèse :**\n"
        "• 12 chantiers actifs, avancement moyen : 67%\n"
        "• 3 chantiers en avance (SPI > 1.0)\n"
        "• 3 chantiers en retard (SPI < 0.85)\n\n"
        "🏆 **Meilleure performance :** Résidence Al Andalous (SPI=0,94)\n"
        "⚠️ **Plus préoccupant :** Usine Bouskoura (SPI=0,72)",
        ["Dashboard KPI", "Voir Gantt", "Rapport direction"],
    ),
}

DEFAULT_RESPONSE = (
    "Bonjour ! Je suis votre assistant ENGIPILOT. Je peux vous aider à analyser :\n\n"
    "📊 **Retards** — SPI, chemin critique, plan de rattrapage\n"
    "💰 **Budget** — CPI, EAC, dépassements\n"
    "🦺 **HSE** — TF, TG, incidents, formations\n"
    "📈 **Avancement** — état général, chantiers en risque\n\n"
    "Que souhaitez-vous analyser ?",
    ["Analyser les retards", "Bilan budgétaire", "Rapport HSE", "État d'avancement"],
)


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    msg = request.message.lower()

    if any(w in msg for w in ["retard", "spi", "planning", "délai", "rattrapage"]):
        key = "retard"
    elif any(w in msg for w in ["budget", "cpi", "coût", "dépassement", "eac", "financ"]):
        key = "budget"
    elif any(w in msg for w in ["hse", "sécurité", "incident", "accident", "tf", "tg"]):
        key = "hse"
    elif any(w in msg for w in ["avancement", "état", "chantier", "global", "synthèse"]):
        key = "avancement"
    else:
        resp, sugg = DEFAULT_RESPONSE
        return ChatResponse(response=resp, suggestions=sugg, type="general")

    resp, sugg = REPONSES[key]
    return ChatResponse(response=resp, suggestions=sugg, type=key)
