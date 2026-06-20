"""ENGIPILOT — Collecte des données réelles depuis PostgreSQL pour entraînement ML/DL.

Ce script remplace les données synthétiques par les vraies données de production.
Il génère les fichiers numpy utilisés par train_lstm.py et train_autoencoder.py.

Usage :
    python src/training/collect_from_db.py              # collecter + entraîner
    python src/training/collect_from_db.py --dry-run    # vérifier sans entraîner
"""

import os, sys, json, logging, argparse
from datetime import date
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("DB-Collect")

DB_URL = os.getenv("DATABASE_URL", "postgresql://engipilot:engipilot@postgres:5432/engipilot")
DATA_PATH = os.getenv("DATA_PATH", "./data")
MODEL_PATH = os.getenv("MODEL_PATH", "./models")
SEQ_LEN = 10   # fenêtre temporelle (snapshots hebdomadaires)

os.makedirs(DATA_PATH, exist_ok=True)
os.makedirs(MODEL_PATH, exist_ok=True)


# ── Connexion PostgreSQL ──────────────────────────────────────────────────────

def get_connection():
    try:
        import psycopg2
        return psycopg2.connect(DB_URL)
    except ImportError:
        log.error("psycopg2 non installé. Lancez: pip install psycopg2-binary")
        sys.exit(1)


# ── Requêtes SQL ──────────────────────────────────────────────────────────────

SQL_KPI_SEQUENCES = """
WITH snapshots AS (
    SELECT
        k.projet_id,
        k.date_mesure,
        k.spi,
        k.cpi,
        k.avancement_physique,
        k.avancement_theorique,
        COALESCE(k.avancement_physique - k.avancement_theorique, 0) AS delta_avancement,
        -- Ratio effectif depuis rapports_journaliers (fenêtre ±3 jours)
        COALESCE(
            (SELECT r.effectif_total::float / NULLIF(p.effectif_prevu, 0)
             FROM rapports_journaliers r
             WHERE r.projet_id = k.projet_id
               AND r.date_rapport BETWEEN k.date_mesure - 3 AND k.date_mesure + 3
             ORDER BY ABS(r.date_rapport - k.date_mesure)
             LIMIT 1), 1.0
        ) AS ratio_effectif,
        -- NC ouvertes à cette date
        (SELECT COUNT(*)::int FROM non_conformites nc
         WHERE nc.projet_id = k.projet_id
           AND nc.date_constat <= k.date_mesure
           AND (nc.date_resolution IS NULL OR nc.date_resolution > k.date_mesure)
           AND nc.statut IN ('OUVERTE', 'EN_COURS')
        ) AS nb_nc_ouvertes,
        -- Incidents HSE dans les 30 jours précédents
        (SELECT COUNT(*)::int FROM incidents_hse h
         WHERE h.projet_id = k.projet_id
           AND h.date_incident BETWEEN k.date_mesure - 30 AND k.date_mesure
        ) AS nb_incidents_hse,
        -- Progression temporelle (0→1)
        CASE
            WHEN p.date_fin_prevue > p.date_debut
            THEN EXTRACT(EPOCH FROM (k.date_mesure - p.date_debut))
               / EXTRACT(EPOCH FROM (p.date_fin_prevue - p.date_debut))
            ELSE 0.5
        END AS t,
        -- Durée prévue en jours
        (p.date_fin_prevue - p.date_debut)::int AS duree_prevue_jours,
        -- Jours écoulés
        (k.date_mesure - p.date_debut)::int AS jours_ecoules
    FROM kpis_historiques k
    JOIN projets p ON p.id = k.projet_id
    WHERE k.spi IS NOT NULL
      AND k.cpi IS NOT NULL
      AND p.statut IN ('EN_COURS', 'TERMINE')
      AND p.date_debut IS NOT NULL
      AND p.date_fin_prevue IS NOT NULL
),
ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY projet_id ORDER BY date_mesure) AS rn,
        COUNT(*) OVER (PARTITION BY projet_id) AS total_snapshots
    FROM snapshots
)
SELECT
    projet_id,
    date_mesure,
    spi, cpi, avancement_physique, avancement_theorique,
    delta_avancement, ratio_effectif, nb_nc_ouvertes, nb_incidents_hse, t,
    duree_prevue_jours, jours_ecoules,
    rn, total_snapshots
FROM ranked
WHERE total_snapshots >= :min_snapshots
ORDER BY projet_id, date_mesure
"""

SQL_RETARD_REEL = """
SELECT
    id AS projet_id,
    CASE
        WHEN date_fin_reelle IS NOT NULL AND date_fin_prevue IS NOT NULL
        THEN GREATEST(0, (date_fin_reelle - date_fin_prevue)::int)
        ELSE NULL
    END AS retard_reel_jours
FROM projets
WHERE statut = 'TERMINE'
  AND date_fin_reelle IS NOT NULL
  AND date_fin_prevue IS NOT NULL
"""


# ── Extraction et construction des séquences ─────────────────────────────────

def collect_sequences(conn, min_snapshots: int = SEQ_LEN + 1):
    """
    Construit les séquences temporelles LSTM depuis kpis_historiques.
    Retourne X (n_seq, SEQ_LEN, 9) et y (n_seq,) retard en jours.
    """
    import psycopg2.extras

    log.info("Collecte des snapshots KPI depuis PostgreSQL...")
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(SQL_KPI_SEQUENCES.replace(":min_snapshots", str(min_snapshots)))
        rows = cur.fetchall()

    if not rows:
        log.warning("Aucune donnée trouvée dans kpis_historiques. Base vide ?")
        return None, None

    # Regrouper par projet
    from collections import defaultdict
    projets: dict = defaultdict(list)
    for r in rows:
        projets[str(r["projet_id"])].append(dict(r))

    log.info(f"  {len(projets)} projets trouvés, {len(rows)} snapshots au total")

    # Récupérer les retards réels (projets terminés)
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(SQL_RETARD_REEL)
        retards_reels = {str(r["projet_id"]): float(r["retard_reel_jours"]) for r in cur.fetchall()}
    log.info(f"  {len(retards_reels)} projets terminés avec retard réel connu")

    X_list, y_list = [], []

    for projet_id, snaps in projets.items():
        snaps_sorted = sorted(snaps, key=lambda s: s["date_mesure"])
        n = len(snaps_sorted)

        # Construire toutes les fenêtres glissantes de taille SEQ_LEN
        for end in range(SEQ_LEN, n):
            window = snaps_sorted[end - SEQ_LEN: end]
            next_snap = snaps_sorted[end]

            features = [[
                s["spi"], s["cpi"],
                s["avancement_physique"], s["avancement_theorique"],
                s["delta_avancement"], s["ratio_effectif"],
                s["nb_nc_ouvertes"], s["nb_incidents_hse"],
                float(s["t"]),
            ] for s in window]

            # Cible : retard réel si projet terminé, sinon estimation EVM
            if projet_id in retards_reels:
                retard = retards_reels[projet_id]
            else:
                spi_next = max(float(next_snap["spi"]), 0.01)
                duree = max(int(next_snap["duree_prevue_jours"]), 1)
                t_next = float(next_snap["t"])
                retard = max(0.0, duree * (1 - t_next) * (1 / spi_next - 1)
                             + int(next_snap["nb_nc_ouvertes"]) * 2.5
                             + int(next_snap["nb_incidents_hse"]) * 4)

            X_list.append(features)
            y_list.append(retard)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    log.info(f"  {len(X)} séquences construites (X={X.shape}, y={y.shape})")
    log.info(f"  Retard moyen: {y.mean():.1f}j | max: {y.max():.1f}j | >0: {(y>0).mean()*100:.0f}%")
    return X, y


def collect_anomaly_data(conn):
    """
    Collecte les vecteurs KPI pour l'Autoencoder.
    Les projets sains (en cours, SPI>0.85) sont le signal "normal".
    """
    import psycopg2.extras

    SQL = """
    SELECT
        k.spi, k.cpi, k.avancement_physique,
        (SELECT COUNT(*)::float FROM non_conformites nc
         WHERE nc.projet_id = k.projet_id AND nc.statut IN ('OUVERTE','EN_COURS')
           AND nc.date_constat <= k.date_mesure) AS nb_nc,
        (SELECT COUNT(*)::float FROM incidents_hse h
         WHERE h.projet_id = k.projet_id
           AND h.date_incident BETWEEN k.date_mesure - 30 AND k.date_mesure) AS nb_hse
    FROM kpis_historiques k
    JOIN projets p ON p.id = k.projet_id
    WHERE k.spi BETWEEN 0.75 AND 1.25
      AND k.cpi BETWEEN 0.78 AND 1.15
      AND k.avancement_physique BETWEEN 5 AND 95
      AND p.statut IN ('EN_COURS', 'TERMINE')
    """
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(SQL)
        rows = cur.fetchall()

    if not rows:
        return None

    X = np.array([[r["spi"], r["cpi"], r["avancement_physique"],
                   r["nb_nc"] or 0, r["nb_hse"] or 0]
                  for r in rows], dtype=np.float32)
    log.info(f"  {len(X)} vecteurs KPI normaux collectés pour l'Autoencoder")
    return X


# ── Sauvegarde et lancement entraînement ─────────────────────────────────────

def save_and_train(X_seq, y_seq, X_ae, dry_run: bool = False):
    np.save(f"{DATA_PATH}/X_sequences.npy", X_seq)
    np.save(f"{DATA_PATH}/y_retards.npy", y_seq)
    log.info(f"Données LSTM sauvegardées → {DATA_PATH}/X_sequences.npy")

    if X_ae is not None:
        np.save(f"{DATA_PATH}/X_anomaly_normal.npy", X_ae)
        log.info(f"Données Autoencoder sauvegardées → {DATA_PATH}/X_anomaly_normal.npy")

    stats = {
        "n_sequences": int(len(X_seq)),
        "n_projets_ae": int(len(X_ae)) if X_ae is not None else 0,
        "retard_moyen_jours": float(y_seq.mean()),
        "retard_max_jours": float(y_seq.max()),
        "collected_at": date.today().isoformat(),
    }
    with open(f"{DATA_PATH}/collection_stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    if dry_run:
        log.info("DRY RUN — entraînement non lancé. Données prêtes dans ./data/")
        return

    if len(X_seq) < 50:
        log.warning(f"Seulement {len(X_seq)} séquences — données insuffisantes pour un bon entraînement (min recommandé: 200)")
        log.warning("Entraînement annulé. Collectez plus de données ou utilisez les données synthétiques.")
        return

    log.info("Lancement entraînement LSTM avec données réelles...")
    import subprocess
    subprocess.run([sys.executable, "src/training/train_lstm.py"], check=True,
                   env={**os.environ, "DATA_PATH": DATA_PATH, "MODEL_PATH": MODEL_PATH})

    if X_ae is not None and len(X_ae) >= 100:
        log.info("Lancement entraînement Autoencoder avec données réelles...")
        subprocess.run([sys.executable, "src/training/train_autoencoder.py"], check=True,
                       env={**os.environ, "DATA_PATH": DATA_PATH, "MODEL_PATH": MODEL_PATH})


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Collecte données DB → entraînement ML")
    parser.add_argument("--dry-run", action="store_true", help="Collecter sans entraîner")
    parser.add_argument("--min-snapshots", type=int, default=SEQ_LEN + 1,
                        help=f"Minimum de snapshots par projet (défaut: {SEQ_LEN + 1})")
    args = parser.parse_args()

    log.info(f"Connexion à PostgreSQL: {DB_URL.split('@')[-1]}")
    conn = get_connection()

    try:
        X_seq, y_seq = collect_sequences(conn, min_snapshots=args.min_snapshots)
        if X_seq is None:
            log.error("Pas de données disponibles. Vérifiez que kpis_historiques est alimenté.")
            sys.exit(1)

        X_ae = collect_anomaly_data(conn)
        save_and_train(X_seq, y_seq, X_ae, dry_run=args.dry_run)

    finally:
        conn.close()

    log.info("Collecte terminée.")


if __name__ == "__main__":
    main()
