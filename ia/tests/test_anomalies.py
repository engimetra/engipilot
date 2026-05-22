"""Tests unitaires — Module détection anomalies."""
import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_detection_degradation_spi():
    r = client.post("/api/v1/anomalies/detecter", json={
        "projet_id": "p1",
        "historique_spi": [0.95, 0.90, 0.80],
        "historique_cpi": [0.95, 0.93, 0.91],
        "historique_avancement": [20, 40, 55],
        "consommation_materiaux": {}
    })
    assert r.status_code == 200
    anomalies = r.json()
    types = [a["type"] for a in anomalies]
    assert "DEGRADATION_SPI" in types

def test_detection_surconsommation():
    r = client.post("/api/v1/anomalies/detecter", json={
        "projet_id": "p1",
        "historique_spi": [0.95, 0.94, 0.93],
        "historique_cpi": [0.96, 0.95, 0.94],
        "historique_avancement": [20, 40, 60],
        "consommation_materiaux": {"beton": 1.5, "acier": 0.9}
    })
    assert r.status_code == 200
    anomalies = r.json()
    types = [a["type"] for a in anomalies]
    assert "SURCONSOMMATION_MATERIAUX" in types

def test_pas_anomalie_performance_normale():
    r = client.post("/api/v1/anomalies/detecter", json={
        "projet_id": "p1",
        "historique_spi": [0.98, 0.97, 0.99],
        "historique_cpi": [1.0, 1.01, 0.99],
        "historique_avancement": [30, 55, 72],
        "consommation_materiaux": {"beton": 1.02}
    })
    assert r.status_code == 200
    anomalies = r.json()
    assert len(anomalies) == 0, "Aucune anomalie pour une performance normale"
