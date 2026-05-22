from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator, ConfigDict
from pathlib import Path
import numpy as np
import joblib

router = APIRouter()
MODEL_PATH = Path("./models")


class KPIInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    projet_id:            str
    spi:                  float = Field(ge=0.0, le=2.0)
    cpi:                  float = Field(ge=0.0, le=2.0)
    avancement_physique:  float = Field(ge=0, le=100)
    avancement_theorique: float = Field(ge=0, le=100)
    budget_consomme_pct:  float = Field(ge=0, le=150)
    effectif_actuel:      int   = Field(ge=0)
    effectif_prevu:       int   = Field(ge=1)
    nb_nc_ouvertes:       int   = Field(ge=0)
    nb_incidents_hse:     int   = Field(ge=0)
    duree_prevue_jours:   int   = Field(ge=1)
    jours_ecoules:        int   = Field(ge=0)

    @model_validator(mode="after")
    def coherence_jours(self) -> "KPIInput":
        if self.jours_ecoules > self.duree_prevue_jours:
            raise ValueError("jours_ecoules > duree_prevue_jours")
        return self


class PredictionResult(BaseModel):
    projet_id: str
    retard_predit_jours: float
    confiance_retard: float
    interpretation_retard: str
    depassement_predit_pct: float
    confiance_depassement: float
    interpretation_depassement: str
    recommandations: list[str]
    niveau_alerte: str


def _evm_retard(k: KPIInput) -> float:
    retard = (k.duree_prevue_jours - k.jours_ecoules) * (1 / max(k.spi, 0.01) - 1)
    return max(0.0, round(retard + k.nb_nc_ouvertes * 2.5, 1))


def _interpreter_retard(j: float) -> str:
    if j <= 0: return "Pas de retard prévu"
    if j <= 7: return "Retard mineur — récupérable"
    if j <= 21: return "Retard modéré — plan de rattrapage requis"
    if j <= 45: return "Retard sévère — ressources additionnelles"
    return "Retard critique — révision contractuelle"


def _interpreter_depassement(p: float) -> str:
    if p <= 0: return "Sous budget"
    if p <= 5: return "Léger dépassement — sous contrôle"
    if p <= 15: return "Dépassement modéré — révision budget"
    if p <= 30: return "Dépassement significatif — audit requis"
    return "Dépassement critique"


def _recommandations(k: KPIInput, retard: float) -> list[str]:
    r = []
    if k.spi < 0.80: r.extend(["Augmenter l'effectif dans les lots en retard", "Activer heures supplémentaires"])
    if k.cpi < 0.85: r.append("Renégocier les prix matériaux fournisseurs")
    if k.nb_nc_ouvertes > 3: r.append(f"Clôturer les {k.nb_nc_ouvertes} NC ouvertes en priorité")
    if k.effectif_actuel < k.effectif_prevu * 0.85: r.append("Recruter pour atteindre l'effectif prévu")
    if not r: r = ["Maintenir le rythme actuel", "Point hebdomadaire de suivi"]
    return r[:4]


@router.post("/retard-budget", response_model=PredictionResult)
def predire(kpis: KPIInput) -> PredictionResult:
    features = np.array([[
        kpis.spi, kpis.cpi, kpis.avancement_physique, kpis.avancement_theorique,
        kpis.avancement_physique - kpis.avancement_theorique,
        kpis.budget_consomme_pct, kpis.nb_nc_ouvertes, kpis.nb_incidents_hse,
        kpis.jours_ecoules / max(kpis.duree_prevue_jours, 1),
        kpis.effectif_actuel / max(kpis.effectif_prevu, 1),
    ]])

    retard, conf_r = _evm_retard(kpis), 0.82
    if (MODEL_PATH / "predicteur_retards_v1.joblib").exists():
        try:
            retard = float(max(0, joblib.load(MODEL_PATH / "predicteur_retards_v1.joblib").predict(features)[0]))
            conf_r = 0.88
        except Exception: pass

    depassement, conf_d = max(0.0, round((1/max(kpis.cpi,0.01)-1)*100, 1)), 0.80
    if (MODEL_PATH / "predicteur_couts_v1.joblib").exists():
        try:
            depassement = float(max(0, joblib.load(MODEL_PATH / "predicteur_couts_v1.joblib").predict(features)[0]))
            conf_d = 0.86
        except Exception: pass

    niveau = "CRITIQUE" if retard>30 or depassement>20 or kpis.spi<0.70 else \
             "ATTENTION" if retard>10 or depassement>8  or kpis.spi<0.85 else "OK"

    return PredictionResult(
        projet_id=kpis.projet_id,
        retard_predit_jours=round(retard, 1), confiance_retard=round(conf_r, 2),
        interpretation_retard=_interpreter_retard(retard),
        depassement_predit_pct=round(depassement, 1), confiance_depassement=round(conf_d, 2),
        interpretation_depassement=_interpreter_depassement(depassement),
        recommandations=_recommandations(kpis, retard),
        niveau_alerte=niveau,
    )
