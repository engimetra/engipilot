"""Feature engineering pour les modèles ML ENGIPILOT."""
import pandas as pd
import numpy as np

def preparer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Prépare les features pour les modèles de prédiction."""
    df = df.copy()

    # Features EVM de base
    df["va"] = df["budget_previsionnel"] * df["avancement_physique"] / 100
    df["vp"] = df["budget_previsionnel"] * df["avancement_theorique"] / 100
    df["spi"] = df["va"] / df["vp"].clip(lower=0.01)
    df["cpi"] = df["va"] / df["cout_reel"].clip(lower=0.01)
    df["sv"]  = df["va"] - df["vp"]
    df["cv"]  = df["va"] - df["cout_reel"]

    # Features dérivées
    df["ecart_avancement"] = df["avancement_physique"] - df["avancement_theorique"]
    df["ratio_budget"]     = df["cout_reel"] / df["budget_previsionnel"].clip(lower=0.01)
    df["eac"]              = df["budget_previsionnel"] / df["cpi"].clip(lower=0.01)
    df["depassement_pct"]  = ((df["eac"] - df["budget_previsionnel"]) / df["budget_previsionnel"] * 100).clip(lower=0)

    return df[["spi","cpi","sv","cv","ecart_avancement","ratio_budget","eac","depassement_pct"]].fillna(0)

def normaliser(df: pd.DataFrame) -> pd.DataFrame:
    """Normalisation min-max pour les features."""
    return (df - df.min()) / (df.max() - df.min()).replace(0, 1)
