"""DAG Airflow — Pipeline Kaggle BTP → SMOTE → LSTM → MLflow"""
import logging
from datetime import datetime
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator

log = logging.getLogger("engipilot.kaggle_pipeline")
DATA_DIR  = "/opt/airflow/data/kaggle"
MODEL_DIR = "/opt/airflow/models"

default_args = {"owner": "engipilot", "retries": 1}

dag = DAG(
    dag_id="engipilot_kaggle_pipeline",
    description="Pipeline mensuel : Kaggle BTP → SMOTE → LSTM → MLflow",
    schedule="@monthly",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["engipilot", "ml", "kaggle", "btp", "smote"],
    default_args=default_args,
)

telecharger_dataset = BashOperator(
    task_id="telecharger_dataset_kaggle",
    bash_command="""
        set -e
        TOKEN="{{ var.value.get('KAGGLE_API_TOKEN', '') }}"
        if [ -z "$TOKEN" ] || [ "$TOKEN" = "VOTRE_TOKEN" ] || [ "$TOKEN" = "METTEZ_VOTRE_VRAI_TOKEN_ICI" ]; then
            echo "Token Kaggle non configuré — skip"
            exit 0
        fi
        mkdir -p /opt/airflow/data/kaggle
        pip install "kaggle>=1.8.0" -q
        export KAGGLE_API_TOKEN=$TOKEN
        kaggle datasets download programmer3/construction-project-management-dataset -p /opt/airflow/data/kaggle --unzip --force
        echo "Dataset téléchargé"
        ls -la /opt/airflow/data/kaggle/
    """,
    dag=dag,
)

def verifier_donnees_fn(**context):
    from pathlib import Path
    csv_files = list(Path(DATA_DIR).glob("**/*.csv")) if Path(DATA_DIR).exists() else []
    if csv_files:
        log.info(f"Kaggle : {len(csv_files)} fichiers CSV trouvés")
        return "preparer_smote"
    log.info("Pas de données Kaggle — fallback synthétique")
    return "entrainer_synthetique"

verifier_donnees = BranchPythonOperator(
    task_id="verifier_donnees",
    python_callable=verifier_donnees_fn,
    dag=dag,
)

preparer_smote = BashOperator(
    task_id="preparer_smote",
        bash_command="pip install imbalanced-learn scikit-learn pandas numpy mlflow -q && python3 /opt/airflow/dags/smote_prepare.py",
    dag=dag,
)

entrainer_kaggle = BashOperator(
    task_id="entrainer_kaggle",
        bash_command="pip install torch mlflow pandas scikit-learn numpy -q && python3 /opt/airflow/dags/lstm_train_smote.py",
    dag=dag,
)

entrainer_synthetique = BashOperator(
    task_id="entrainer_synthetique",
    bash_command="""
        pip install torch mlflow numpy -q
        python3 -c "
import mlflow, numpy as np, torch, torch.nn as nn
mlflow.set_tracking_uri('http://engipilot-mlflow:5000')
mlflow.set_experiment('engipilot-lstm-kaggle')
np.random.seed(42); torch.manual_seed(42)
SEQ_LEN, INPUT_DIM, HIDDEN, EPOCHS, N = 10, 9, 64, 20, 1000
X = np.random.randn(N, SEQ_LEN, INPUT_DIM).astype(np.float32)
y = np.random.exponential(15, N).astype(np.float32)
X_tr, X_te, y_tr, y_te = X[:800], X[800:], y[:800], y[800:]
class LSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(INPUT_DIM, HIDDEN, 2, batch_first=True, bidirectional=True, dropout=0.2)
        self.head = nn.Sequential(nn.Linear(HIDDEN*2, 32), nn.ReLU(), nn.Linear(32, 1), nn.ReLU())
    def forward(self, x):
        o, _ = self.lstm(x)
        return self.head(o[:,-1,:])
model = LSTM()
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
loss_fn = nn.HuberLoss()
with mlflow.start_run(run_name='kaggle-synthetique'):
    mlflow.log_params({'epochs': EPOCHS, 'n_sequences': N, 'source': 'synthetique', 'smote': False})
    best_val = float('inf')
    for ep in range(1, EPOCHS+1):
        model.train(); opt.zero_grad()
        loss = loss_fn(model(torch.from_numpy(X_tr)), torch.from_numpy(y_tr).unsqueeze(1))
        loss.backward(); opt.step()
        model.eval()
        with torch.no_grad():
            val = loss_fn(model(torch.from_numpy(X_te)), torch.from_numpy(y_te).unsqueeze(1)).item()
        mlflow.log_metric('train_loss', loss.item(), step=ep)
        mlflow.log_metric('val_loss', val, step=ep)
        if val < best_val: best_val = val
    with torch.no_grad():
        preds = model(torch.from_numpy(X_te)).numpy().flatten()
    mae = float(np.abs(preds - y_te).mean())
    mlflow.log_metric('mae_jours', mae)
    mlflow.log_metric('best_val_loss', best_val)
    print(f'MAE={mae:.1f}j | best_val={best_val:.4f}')
"
    """,
    dag=dag,
)

rejoindre = EmptyOperator(
    task_id="rejoindre",
    trigger_rule="none_failed_min_one_success",
    dag=dag,
)

def comparer_modeles_fn(**context):
    import mlflow
    mlflow.set_tracking_uri("http://engipilot-mlflow:5000")
    client = mlflow.tracking.MlflowClient()
    for exp_name in ["engipilot-lstm-kaggle", "engipilot-lstm-predictions"]:
        exp = client.get_experiment_by_name(exp_name)
        if not exp: continue
        runs = client.search_runs([exp.experiment_id], order_by=["metrics.best_auc DESC"], max_results=1)
        if runs:
            r = runs[0]
            auc = r.data.metrics.get('best_auc', '?')
            f1  = r.data.metrics.get('f1_score', '?')
            log.info(f"{exp_name} → AUC={auc} | F1={f1} | run={r.info.run_id}")

comparer_modeles = PythonOperator(
    task_id="comparer_modeles",
    python_callable=comparer_modeles_fn,
    dag=dag,
)

notifier = BashOperator(
    task_id="notifier",
    bash_command='echo "Pipeline SMOTE+LSTM terminé — $(date) — MLflow: http://209.38.231.154:5001"',
    dag=dag,
)

telecharger_dataset >> verifier_donnees
verifier_donnees >> [preparer_smote, entrainer_synthetique]
preparer_smote >> entrainer_kaggle
[entrainer_kaggle, entrainer_synthetique] >> rejoindre
rejoindre >> comparer_modeles >> notifier
