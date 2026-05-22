"""Tests unitaires — Module prédictions ENGIPILOT IA."""
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.routers.predictions import KPIInput, _calcul_retard_evm, _calcul_depassement_evm, _recommandations

client = TestClient(app)

def make_kpi(**kwargs) -> KPIInput:
    """Crée un KPIInput avec des valeurs par défaut."""
    defaults = dict(
        projet_id="test-001", spi=0.95, cpi=0.92,
        avancement_physique=60, avancement_theorique=63,
        budget_consomme_pct=65, effectif_actuel=42, effectif_prevu=50,
        nb_nc_ouvertes=1, nb_incidents_hse=0,
        duree_prevue_jours=365, jours_ecoules=180
    )
    defaults.update(kwargs)
    return KPIInput(**defaults)


class TestRetardEVM:
    def test_pas_retard_spi_normal(self):
        kpi = make_kpi(spi=1.0, duree_prevue_jours=365, jours_ecoules=180)
        retard = _calcul_retard_evm(kpi)
        assert retard == pytest.approx(0.0, abs=1.0)

    def test_retard_spi_critique(self):
        kpi = make_kpi(spi=0.72, duree_prevue_jours=365, jours_ecoules=180)
        retard = _calcul_retard_evm(kpi)
        assert retard > 30, "SPI=0.72 doit prédire > 30j de retard"

    def test_retard_positif_uniquement(self):
        kpi = make_kpi(spi=1.2)
        retard = _calcul_retard_evm(kpi)
        assert retard >= 0, "Retard ne peut pas être négatif"


class TestDepassementEVM:
    def test_pas_depassement_cpi_normal(self):
        kpi = make_kpi(cpi=1.0)
        depass = _calcul_depassement_evm(kpi)
        assert depass == pytest.approx(0.0, abs=0.5)

    def test_depassement_cpi_critique(self):
        kpi = make_kpi(cpi=0.74)
        depass = _calcul_depassement_evm(kpi)
        assert depass > 20, "CPI=0.74 doit prédire > 20% dépassement"

    def test_depassement_positif_uniquement(self):
        kpi = make_kpi(cpi=1.5)
        depass = _calcul_depassement_evm(kpi)
        assert depass >= 0


class TestRecommandations:
    def test_rec_spi_faible(self):
        kpi = make_kpi(spi=0.70)
        recs = _recommandations(kpi, 45, 5)
        assert any("équipes" in r.lower() or "lots" in r.lower() for r in recs)

    def test_rec_effectif_insuffisant(self):
        kpi = make_kpi(effectif_actuel=30, effectif_prevu=50)
        recs = _recommandations(kpi, 10, 2)
        assert any("effectif" in r.lower() or "intérimaires" in r.lower() for r in recs)

    def test_rec_nc_critiques(self):
        kpi = make_kpi(nb_nc_ouvertes=5)
        recs = _recommandations(kpi, 5, 0)
        assert any("NC" in r or "nc" in r.lower() for r in recs)

    def test_rec_performance_ok(self):
        kpi = make_kpi(spi=1.0, cpi=1.0, effectif_actuel=48, effectif_prevu=50, nb_nc_ouvertes=0)
        recs = _recommandations(kpi, 0, 0)
        assert any("ok" in r.lower() or "maintenir" in r.lower() for r in recs)


class TestAPIEndpoints:
    def test_health_ok(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_prediction_endpoint_200(self):
        r = client.post("/api/v1/predictions/retard-budget", json={
            "projet_id": "p-test", "spi": 0.87, "cpi": 0.91,
            "avancement_physique": 63, "avancement_theorique": 67,
            "budget_consomme_pct": 71, "effectif_actuel": 42, "effectif_prevu": 50,
            "nb_nc_ouvertes": 4, "nb_incidents_hse": 0,
            "duree_prevue_jours": 275, "jours_ecoules": 180
        })
        assert r.status_code == 200
        data = r.json()
        assert "retard_predit_jours" in data
        assert "confiance_retard" in data
        assert "recommandations" in data
        assert isinstance(data["recommandations"], list)

    def test_anomalie_endpoint_200(self):
        r = client.post("/api/v1/anomalies/detecter", json={
            "projet_id": "p-test",
            "historique_spi": [0.98, 0.95, 0.91, 0.85, 0.78],
            "historique_cpi": [0.96, 0.94, 0.91, 0.89, 0.87],
            "historique_avancement": [10, 25, 40, 52, 60],
            "consommation_materiaux": {"beton": 1.35, "acier": 1.02}
        })
        assert r.status_code == 200
        anomalies = r.json()
        assert isinstance(anomalies, list)
        assert len(anomalies) >= 1  # Dégradation SPI et surconsommation béton

    def test_chat_endpoint_200(self):
        r = client.post("/api/v1/chat", json={"message": "analyse les retards chantier"})
        assert r.status_code == 200
        data = r.json()
        assert "response" in data
        assert "spi" in data["response"].lower() or "retard" in data["response"].lower()

    def test_prediction_valeurs_plausibles(self):
        r = client.post("/api/v1/predictions/retard-budget", json={
            "projet_id": "usine-bsk", "spi": 0.72, "cpi": 0.84,
            "avancement_physique": 45, "avancement_theorique": 63,
            "budget_consomme_pct": 44, "effectif_actuel": 38, "effectif_prevu": 65,
            "nb_nc_ouvertes": 4, "nb_incidents_hse": 2,
            "duree_prevue_jours": 410, "jours_ecoules": 220
        })
        data = r.json()
        assert data["retard_predit_jours"] > 20, "SPI=0.72 doit prédire > 20j"
        assert data["depassement_predit_pct"] > 10, "CPI=0.84 doit prédire > 10% dépassement"
        assert data["confiance_retard"] >= 0.8
        assert "critique" in data["interpretation_retard"].lower()
