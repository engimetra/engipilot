"""Inférence LSTM pour prédiction de retard de chantier.

Usage :
    predictor = LSTMPredictor()
    predictor.load()
    retard = predictor.predict(sequence)   # sequence : list[dict] de snapshots KPI
"""

import json, logging
from pathlib import Path
from typing import Optional
import numpy as np

log = logging.getLogger("LSTM-Predictor")
MODEL_PATH = Path("./models")

# Importation optionnelle : si PyTorch n'est pas installé, on dégrade gracieusement.
try:
    import torch
    import torch.nn as nn

    class _LSTMRetard(nn.Module):
        def __init__(self, input_dim, hidden_dim, num_layers, dropout):
            super().__init__()
            self.lstm = nn.LSTM(
                input_size=input_dim, hidden_size=hidden_dim, num_layers=num_layers,
                batch_first=True, bidirectional=True,
                dropout=dropout if num_layers > 1 else 0.0,
            )
            self.head = nn.Sequential(
                nn.LayerNorm(hidden_dim * 2), nn.Dropout(dropout),
                nn.Linear(hidden_dim * 2, 32), nn.ReLU(),
                nn.Linear(32, 1), nn.ReLU(),
            )

        def forward(self, x):
            out, _ = self.lstm(x)
            return self.head(out[:, -1, :])

    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    log.warning("PyTorch non disponible — prédictions LSTM désactivées.")

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False


# ── Feature extraction ────────────────────────────────────────────────────────

FEATURE_KEYS = ["spi", "cpi", "avancement_physique", "avancement_theorique",
                 "delta_av", "ratio_effectif", "nb_nc_ouvertes", "nb_incidents_hse", "t"]


def snapshot_to_vector(snap: dict) -> list[float]:
    """Convertit un snapshot KPI en vecteur de features."""
    t = snap.get("jours_ecoules", 1) / max(snap.get("duree_prevue_jours", 1), 1)
    return [
        snap.get("spi", 1.0),
        snap.get("cpi", 1.0),
        snap.get("avancement_physique", 50.0),
        snap.get("avancement_theorique", 50.0),
        snap.get("avancement_physique", 50.0) - snap.get("avancement_theorique", 50.0),
        snap.get("effectif_actuel", 1) / max(snap.get("effectif_prevu", 1), 1),
        snap.get("nb_nc_ouvertes", 0),
        snap.get("nb_incidents_hse", 0),
        t,
    ]


# ── Prédicteur ────────────────────────────────────────────────────────────────

class LSTMPredictor:
    """Encapsule le modèle LSTM chargé depuis le disque."""

    SEQ_LEN = 10

    def __init__(self):
        self._model  = None
        self._scaler = None
        self._y_mean: Optional[float] = None
        self._y_std:  Optional[float] = None
        self._ready  = False

    def load(self) -> bool:
        if not TORCH_AVAILABLE or not JOBLIB_AVAILABLE:
            return False
        pt_path     = MODEL_PATH / "lstm_retard_v1.pt"
        scaler_path = MODEL_PATH / "lstm_scaler.joblib"
        meta_path   = MODEL_PATH / "lstm_target_meta.json"
        if not (pt_path.exists() and scaler_path.exists() and meta_path.exists()):
            log.info("Modèle LSTM non trouvé — utilisation des modèles classiques.")
            return False
        try:
            ckpt = torch.load(pt_path, map_location="cpu", weights_only=True)
            cfg  = ckpt["config"]
            self._model = _LSTMRetard(
                input_dim=cfg["input_dim"], hidden_dim=cfg["hidden_dim"],
                num_layers=cfg["num_layers"], dropout=cfg["dropout"],
            )
            self._model.load_state_dict(ckpt["model_state_dict"])
            self._model.eval()
            self._scaler = joblib.load(scaler_path)
            with open(meta_path) as f:
                meta = json.load(f)
            self._y_mean = meta["y_mean"]
            self._y_std  = meta["y_std"]
            self._ready  = True
            log.info("Modèle LSTM chargé.")
            return True
        except Exception as e:
            log.warning(f"Erreur chargement LSTM : {e}")
            return False

    @property
    def ready(self) -> bool:
        return self._ready

    def predict(self, snapshots: list[dict]) -> Optional[float]:
        """
        Prédit le retard (jours) à partir d'une liste de snapshots KPI.

        Args:
            snapshots: liste de dicts KPI (ordre chronologique, min 1 snapshot).
                       Si < SEQ_LEN, on pad avec des copies du premier snapshot.

        Returns:
            Retard prédit en jours (float) ou None si le modèle n'est pas disponible.
        """
        if not self._ready or not snapshots:
            return None
        try:
            # Padding / troncature à SEQ_LEN
            seq = snapshots[-self.SEQ_LEN:]
            while len(seq) < self.SEQ_LEN:
                seq = [snapshots[0]] + seq

            X = np.array([snapshot_to_vector(s) for s in seq], dtype=np.float32)  # (SEQ, F)
            X_norm = self._scaler.transform(X[np.newaxis, :, :])                   # (1, SEQ, F)

            with torch.no_grad():
                pred_norm = self._model(torch.from_numpy(X_norm)).item()

            retard = float(np.expm1(pred_norm * self._y_std + self._y_mean))
            return max(0.0, round(retard, 1))
        except Exception as e:
            log.warning(f"Erreur inférence LSTM : {e}")
            return None


# Singleton partagé
_predictor: Optional[LSTMPredictor] = None


def get_predictor() -> LSTMPredictor:
    global _predictor
    if _predictor is None:
        _predictor = LSTMPredictor()
        _predictor.load()
    return _predictor
