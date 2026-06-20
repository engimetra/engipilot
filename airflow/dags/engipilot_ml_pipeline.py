"""DAG Airflow — Pipeline ML LSTM pour prédictions de retards de chantiers ENGIPILOT.

Ordonnancement hebdomadaire :
  1. Collecte des données depuis la base de données
  2. Entraînement du modèle LSTM avec suivi MLflow
  3. Évaluation : vérifie que la val_loss < 0.1 dans MLflow
  4. Notification de succès
"""

import logging
from datetime import datetime

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

log = logging.getLogger("engipilot.ml_pipeline")

# ── Paramètres du DAG ──────────────────────────────────────────────────────────

default_args = {
    "owner": "engipilot",
    "retries": 1,
}

dag = DAG(
    dag_id="engipilot_ml_pipeline",
    description="Pipeline d'entraînement hebdomadaire du modèle LSTM ENGIPILOT",
    schedule="@weekly",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["engipilot", "ml", "lstm"],
    default_args=default_args,
)


# ── Tâche 3 : Évaluation via MLflow ───────────────────────────────────────────

def evaluer_modele_fn(**context) -> None:
    """Vérifie que le dernier run MLflow a une val_loss inférieure au seuil."""
    import os
    import mlflow

    seuil_val_loss = 0.1
    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://engipilot-mlflow:5000")
    mlflow.set_tracking_uri(tracking_uri)

    client = mlflow.tracking.MlflowClient()
    experiment = client.get_experiment_by_name("engipilot-lstm-predictions")

    if experiment is None:
        raise ValueError("Expérience MLflow 'engipilot-lstm-predictions' introuvable — l'entraînement a-t-il été lancé ?")

    # Récupère le dernier run (trié par date de début décroissante)
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["start_time DESC"],
        max_results=1,
    )

    if not runs:
        raise ValueError("Aucun run MLflow trouvé pour l'expérience 'engipilot-lstm-predictions'.")

    dernier_run = runs[0]
    run_id = dernier_run.info.run_id
    statut = dernier_run.info.status
    val_loss = dernier_run.data.metrics.get("val_loss")

    log.info(f"Dernier run MLflow — run_id={run_id} | statut={statut} | val_loss={val_loss}")

    if val_loss is None:
        raise ValueError(f"La métrique 'val_loss' est absente du run {run_id}.")

    if val_loss >= seuil_val_loss:
        raise ValueError(
            f"val_loss={val_loss:.4f} ≥ seuil={seuil_val_loss} — modèle insuffisant, pipeline interrompu."
        )

    log.info(f"Modèle validé : val_loss={val_loss:.4f} < seuil={seuil_val_loss}. Run ID : {run_id}")


# ── Définition des tâches ──────────────────────────────────────────────────────

collecter_donnees = BashOperator(
    task_id="collecter_donnees",
    bash_command="cd /opt/engipilot && python3 ia/src/training/collect_from_db.py",
    dag=dag,
)

entrainer_modele = BashOperator(
    task_id="entrainer_modele",
    bash_command="cd /opt/engipilot && python3 ia/src/training/train_lstm.py",
    dag=dag,
)

evaluer_modele = PythonOperator(
    task_id="evaluer_modele",
    python_callable=evaluer_modele_fn,
    dag=dag,
)

notifier_succes = BashOperator(
    task_id="notifier_succes",
    bash_command="echo \"Modèle LSTM entraîné avec succès — $(date)\"",
    dag=dag,
)

# ── Ordre d'exécution ─────────────────────────────────────────────────────────

collecter_donnees >> entrainer_modele >> evaluer_modele >> notifier_succes
