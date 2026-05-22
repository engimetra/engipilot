"""Collecte des KPIs depuis PostgreSQL pour l'entraînement et les prédictions."""
from sqlalchemy import create_engine, text
import pandas as pd
import os

DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:engipilot_dev@localhost:5432/engipilot")

def get_kpis_historiques(projet_id: str | None = None, limit: int = 1000) -> pd.DataFrame:
    engine = create_engine(DB_URL)
    query = "SELECT * FROM kpis_historiques"
    if projet_id:
        query += f" WHERE projet_id = '{projet_id}'"
    query += f" ORDER BY date_mesure DESC LIMIT {limit}"
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

def get_projets_actifs() -> pd.DataFrame:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        return pd.read_sql(text(
            "SELECT id, code_projet, nom, avancement_physique, avancement_theorique, "
            "budget_previsionnel, cout_reel FROM projets WHERE statut = 'EN_COURS'"
        ), conn)

def get_incidents_count(projet_id: str) -> dict:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT COUNT(*) as total FROM incidents_hse WHERE projet_id = :pid"
        ), {"pid": projet_id})
        total = result.fetchone()[0]
        nc_result = conn.execute(text(
            "SELECT COUNT(*) as total FROM non_conformites WHERE projet_id = :pid AND statut = 'OUVERTE'"
        ), {"pid": projet_id})
        nc_ouvertes = nc_result.fetchone()[0]
    return {"incidents": total, "nc_ouvertes": nc_ouvertes}
