import logging
from fastapi import APIRouter
from pathlib import Path

log = logging.getLogger("ENGIPILOT-Health")
router = APIRouter()

_ORDER = [
    "predicteur_retards_v1.joblib",
    "predicteur_couts_v1.joblib",
    "detecteur_anomalies_v1.joblib",
]

@router.get("")
@router.get("/")
def health():
    models_dir = Path("./models")
    found = {m.name for m in models_dir.glob("*.joblib")} if models_dir.exists() else set()
    models = [n for n in _ORDER if n in found] + sorted(found - set(_ORDER))
    return {
        "status": "ok",
        "service": "ENGIPILOT IA",
        "version": "1.0.0",
        "modeles_charges": len(models),
        "modeles": models,
    }
