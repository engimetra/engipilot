"""ENGIPILOT — LSTM pour prédiction de retards sur séries temporelles.

Architecture : LSTM bidirectionnel → couche dense → prédiction retard (jours).
Entrée : séquence de T=10 snapshots KPI par chantier.
Sortie : retard prédit en jours à l'instant t+1.

Usage : python src/training/train_lstm.py
"""

import os, logging, json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import joblib
import mlflow
import mlflow.pytorch

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("LSTM-Train")

MODEL_PATH = os.getenv("MODEL_PATH", "./models")
os.makedirs(MODEL_PATH, exist_ok=True)

# Initialisation du suivi MLflow
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5001"))
mlflow.set_experiment("engipilot-lstm-predictions")

# ── Hyperparamètres ─────────────────────────────────────────────────────────
SEQ_LEN    = 10       # fenêtre temporelle (snapshots hebdomadaires)
INPUT_DIM  = 9        # features par snapshot
HIDDEN_DIM = 64
NUM_LAYERS = 2
DROPOUT    = 0.2
EPOCHS     = 60
BATCH_SIZE = 128
LR         = 1e-3
SEED       = 42

torch.manual_seed(SEED)
np.random.seed(SEED)


# ── Génération de données synthétiques temporelles ──────────────────────────
def generate_sequences(n_chantiers: int = 500, seq_len: int = SEQ_LEN):
    """Simule des trajectoires KPI hebdomadaires de chantiers BTP."""
    X_list, y_list = [], []
    for _ in range(n_chantiers):
        # Paramètres du chantier (fixes sur toute la durée)
        duree = np.random.randint(60, 365)
        bruit_spi = np.random.normal(0, 0.03)
        bruit_cpi = np.random.normal(0, 0.025)

        # Trajectoire temporelle
        steps = seq_len + 1
        t_vals = np.linspace(0.05, 0.95, steps)

        spi_base   = np.clip(np.random.normal(0.95, 0.12) + bruit_spi, 0.4, 1.3)
        cpi_base   = np.clip(np.random.normal(0.93, 0.10) + bruit_cpi, 0.5, 1.2)
        nc_base    = np.random.poisson(2)
        hse_base   = np.random.poisson(0.3)

        seq = []
        for i, t in enumerate(t_vals[:seq_len]):
            spi = np.clip(spi_base + np.random.normal(0, 0.02) - 0.003 * i, 0.3, 1.3)
            cpi = np.clip(cpi_base + np.random.normal(0, 0.015), 0.4, 1.2)
            av_ph = t * 100 * spi + np.random.normal(0, 1)
            av_th = t * 100
            ratio_eff = np.clip(np.random.normal(0.90, 0.08), 0.5, 1.1)
            nc    = max(0, nc_base + np.random.poisson(0.5))
            hse   = max(0, hse_base + np.random.poisson(0.1))
            seq.append([spi, cpi, av_ph, av_th, av_ph - av_th, ratio_eff, nc, hse, t])

        # Cible : retard en jours au snapshot suivant
        spi_next = np.clip(spi_base + np.random.normal(0, 0.02) - 0.003 * seq_len, 0.3, 1.3)
        t_next   = t_vals[seq_len]
        retard   = max(0.0, duree * (1 - t_next) * (1 / max(spi_next, 0.01) - 1)
                       + nc_base * 2.5 + hse_base * 4 + np.random.normal(0, 2))

        X_list.append(seq)
        y_list.append(retard)

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.float32)


# ── Dataset PyTorch ──────────────────────────────────────────────────────────
class ChantierDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.from_numpy(X)
        self.y = torch.from_numpy(y).unsqueeze(1)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


# ── Architecture LSTM ────────────────────────────────────────────────────────
class LSTMRetard(nn.Module):
    """LSTM bidirectionnel pour prédiction de retard de chantier."""

    def __init__(self, input_dim=INPUT_DIM, hidden_dim=HIDDEN_DIM,
                 num_layers=NUM_LAYERS, dropout=DROPOUT):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_dim * 2),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim * 2, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.ReLU(),   # retard ≥ 0
        )

    def forward(self, x):
        # x : (batch, seq_len, input_dim)
        out, _ = self.lstm(x)
        last = out[:, -1, :]   # dernier pas de temps
        return self.head(last)


# ── Normalisation ────────────────────────────────────────────────────────────
class SequenceScaler:
    """Normalisation min-max par feature sur les séquences."""

    def __init__(self):
        self.min_ = None
        self.max_ = None

    def fit(self, X: np.ndarray):
        self.min_ = X.reshape(-1, X.shape[-1]).min(axis=0)
        self.max_ = X.reshape(-1, X.shape[-1]).max(axis=0)
        self.range_ = np.where(self.max_ - self.min_ > 0, self.max_ - self.min_, 1.0)
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        return (X - self.min_) / self.range_

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)


# ── Entraînement ─────────────────────────────────────────────────────────────
def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Device : {device}")

    log.info("Génération des données…")
    X, y = generate_sequences(n_chantiers=2000)

    # Scaler
    scaler = SequenceScaler()
    X_norm = scaler.fit_transform(X)
    joblib.dump(scaler, f"{MODEL_PATH}/lstm_scaler.joblib")

    # Target scaler (log1p pour stabiliser la variance)
    y_log   = np.log1p(y)
    y_mean  = y_log.mean()
    y_std   = y_log.std() + 1e-8
    y_norm  = (y_log - y_mean) / y_std
    scaler_meta = {"y_mean": float(y_mean), "y_std": float(y_std)}
    with open(f"{MODEL_PATH}/lstm_target_meta.json", "w") as f:
        json.dump(scaler_meta, f)

    # Split
    n = len(X_norm)
    idx = np.random.permutation(n)
    split = int(0.8 * n)
    tr_idx, te_idx = idx[:split], idx[split:]

    train_ds = ChantierDataset(X_norm[tr_idx], y_norm[tr_idx].astype(np.float32))
    test_ds  = ChantierDataset(X_norm[te_idx], y_norm[te_idx].astype(np.float32))
    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    test_dl  = DataLoader(test_ds,  batch_size=BATCH_SIZE)

    model     = LSTMRetard().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    criterion = nn.HuberLoss(delta=1.0)

    best_val_loss = float("inf")
    best_state    = None

    # ── Suivi MLflow ────────────────────────────────────────────────────────
    with mlflow.start_run():
        # Journalisation des hyperparamètres
        mlflow.log_params({
            "epochs":          EPOCHS,
            "batch_size":      BATCH_SIZE,
            "sequence_length": SEQ_LEN,
            "learning_rate":   LR,
            "hidden_dim":      HIDDEN_DIM,
            "num_layers":      NUM_LAYERS,
            "dropout":         DROPOUT,
            "input_dim":       INPUT_DIM,
        })

        log.info(f"Entraînement LSTM ({EPOCHS} époques)…")
        for epoch in range(1, EPOCHS + 1):
            model.train()
            train_loss = 0.0
            for xb, yb in train_dl:
                xb, yb = xb.to(device), yb.to(device)
                optimizer.zero_grad()
                pred = model(xb)
                loss = criterion(pred, yb)
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
                train_loss += loss.item() * len(xb)
            scheduler.step()

            model.eval()
            val_loss = 0.0
            with torch.no_grad():
                for xb, yb in test_dl:
                    xb, yb = xb.to(device), yb.to(device)
                    val_loss += criterion(model(xb), yb).item() * len(xb)

            train_loss /= len(train_ds)
            val_loss   /= len(test_ds)

            # Journalisation des métriques par époque
            mlflow.log_metric("train_loss", train_loss, step=epoch)
            mlflow.log_metric("val_loss",   val_loss,   step=epoch)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_state    = {k: v.cpu().clone() for k, v in model.state_dict().items()}

            if epoch % 10 == 0 or epoch == 1:
                log.info(f"  Époque {epoch:3d}/{EPOCHS} | train={train_loss:.4f} | val={val_loss:.4f}")

        # Sauvegarde du meilleur modèle
        model.load_state_dict(best_state)
        torch.save({
            "model_state_dict": model.state_dict(),
            "config": {
                "input_dim":  INPUT_DIM,
                "hidden_dim": HIDDEN_DIM,
                "num_layers": NUM_LAYERS,
                "dropout":    DROPOUT,
            },
        }, f"{MODEL_PATH}/lstm_retard_v1.pt")

        # Journalisation du modèle PyTorch dans MLflow
        mlflow.pytorch.log_model(model, "lstm-model")
        mlflow.log_metric("best_val_loss", best_val_loss)

        # Évaluation finale (MAE en jours réels)
        model.eval()
        preds, targets = [], []
        with torch.no_grad():
            for xb, yb in test_dl:
                p = model(xb.to(device)).cpu().numpy().flatten()
                preds.extend(p)
                targets.extend(yb.numpy().flatten())

        preds   = np.expm1(np.array(preds)   * y_std + y_mean)
        targets = np.expm1(np.array(targets) * y_std + y_mean)
        mae  = np.abs(preds - targets).mean()
        rmse = np.sqrt(((preds - targets) ** 2).mean())

        # Journalisation des métriques finales
        mlflow.log_metric("mae_jours",  float(mae))
        mlflow.log_metric("rmse_jours", float(rmse))

        log.info(f"Évaluation finale → MAE={mae:.1f} jours | RMSE={rmse:.1f} jours")
        log.info("Modèle LSTM sauvegardé dans models/lstm_retard_v1.pt et dans MLflow")


if __name__ == "__main__":
    train()
