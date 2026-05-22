"""ENGIPILOT — Entraînement des modèles ML. Usage: python src/training/train_all.py"""
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import joblib, os, logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ENGIPILOT-Train")
MODEL_PATH = os.getenv("MODEL_PATH", "./models")
os.makedirs(MODEL_PATH, exist_ok=True)

def dataset(n=2000):
    np.random.seed(42)
    spi   = np.random.normal(0.95, 0.15, n).clip(0.3, 1.3)
    cpi   = np.random.normal(0.93, 0.12, n).clip(0.4, 1.2)
    av_ph = np.random.uniform(10, 90, n)
    av_th = np.random.uniform(10, 90, n)
    ratio = np.random.normal(0.90, 0.12, n).clip(0.5, 1.1)
    nc    = np.random.poisson(2, n)
    hse   = np.random.poisson(0.3, n)
    t     = np.random.uniform(0.1, 0.95, n)
    X = np.column_stack([spi, cpi, av_ph, av_th, av_ph-av_th, ratio, nc, hse, t])
    y_r = np.maximum(0, 60*(1/spi-1)*(1-t) + nc*3 + hse*5 + np.random.normal(0,2,n))
    y_c = np.maximum(0, (1/cpi-1)*100 + np.random.normal(0,2,n))
    return X, y_r, y_c

if __name__ == "__main__":
    log.info("ENGIPILOT — Entraînement modèles ML")
    X, y_r, y_c = dataset()
    Xtr,Xte,yr_tr,yr_te = train_test_split(X, y_r, test_size=0.2, random_state=42)
    m_r = GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)
    m_r.fit(Xtr, yr_tr)
    log.info(f"Retards R²={r2_score(yr_te, m_r.predict(Xte)):.3f}")
    joblib.dump(m_r, f"{MODEL_PATH}/predicteur_retards_v1.joblib")
    Xtr2,Xte2,yc_tr,yc_te = train_test_split(X, y_c, test_size=0.2, random_state=42)
    m_c = RandomForestRegressor(n_estimators=150, random_state=42)
    m_c.fit(Xtr2, yc_tr)
    log.info(f"Coûts R²={r2_score(yc_te, m_c.predict(Xte2)):.3f}")
    joblib.dump(m_c, f"{MODEL_PATH}/predicteur_couts_v1.joblib")
    m_a = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    m_a.fit(X[:, :5])
    joblib.dump(m_a, f"{MODEL_PATH}/detecteur_anomalies_v1.joblib")
    log.info("3 modeles entraînes et sauvegardés !")
