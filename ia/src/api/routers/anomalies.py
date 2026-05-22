from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from pathlib import Path
import numpy as np
import joblib

router = APIRouter()
MODEL_PATH = Path("./models")


class SerieKPI(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    projet_id:              str
    historique_spi:         list[float] = []
    historique_cpi:         list[float] = []
    historique_avancement:  list[float] = []
    consommation_materiaux: dict[str, float] = {}


class Anomalie(BaseModel):
    type:        str
    description: str
    severite:    str
    confiance:   float


@router.post("/detecter", response_model=list[Anomalie])
def detecter(serie: SerieKPI) -> list[Anomalie]:
    anomalies: list[Anomalie] = []

    # Règle 1 : Dégradation SPI sur 3 semaines
    if len(serie.historique_spi) >= 3:
        tendance = serie.historique_spi[-1] - serie.historique_spi[-3]
        if tendance < -0.15:
            anomalies.append(Anomalie(
                type="DEGRADATION_SPI",
                description=f"SPI en chute de {tendance:+.3f} sur 3 semaines (actuel: {serie.historique_spi[-1]:.3f})",
                severite="CRITIQUE" if tendance < -0.25 else "MAJEURE",
                confiance=0.87,
            ))

    # Règle 2 : CPI dégradé
    if len(serie.historique_cpi) >= 2:
        if serie.historique_cpi[-1] < 0.80:
            anomalies.append(Anomalie(
                type="CPI_CRITIQUE",
                description=f"CPI = {serie.historique_cpi[-1]:.3f} — dépassement budget sévère",
                severite="CRITIQUE",
                confiance=0.91,
            ))

    # Règle 3 : Avancement stagnant
    if len(serie.historique_avancement) >= 4:
        variation = max(serie.historique_avancement[-4:]) - min(serie.historique_avancement[-4:])
        if variation < 2.0:
            anomalies.append(Anomalie(
                type="AVANCEMENT_STAGNANT",
                description=f"Avancement quasi-nul sur 4 périodes (variation: {variation:.1f}%)",
                severite="MAJEURE",
                confiance=0.83,
            ))

    # Règle 4 : Surconsommation matériaux
    for mat, ratio in serie.consommation_materiaux.items():
        if ratio > 1.25:
            anomalies.append(Anomalie(
                type="SURCONSOMMATION_MATERIAUX",
                description=f"{mat}: consommation {(ratio-1)*100:.0f}% au-dessus de la norme",
                severite="MAJEURE" if ratio > 1.50 else "MINEURE",
                confiance=0.84,
            ))

    # Modèle ML si disponible
    if (MODEL_PATH / "detecteur_anomalies_v1.joblib").exists() and len(serie.historique_spi) >= 2:
        try:
            m = joblib.load(MODEL_PATH / "detecteur_anomalies_v1.joblib")
            spi = serie.historique_spi[-1] if serie.historique_spi else 1.0
            cpi = serie.historique_cpi[-1] if serie.historique_cpi else 1.0
            av  = serie.historique_avancement[-1] if serie.historique_avancement else 50.0
            pred = m.predict([[spi, cpi, av, 0]])
            if pred[0] == -1:  # IsolationForest retourne -1 pour anomalie
                if not any(a.type == "ANOMALIE_ML" for a in anomalies):
                    anomalies.append(Anomalie(
                        type="ANOMALIE_ML",
                        description="Pattern inhabituel détecté par le modèle d'isolation",
                        severite="ATTENTION",
                        confiance=0.75,
                    ))
        except Exception:
            pass

    return anomalies
