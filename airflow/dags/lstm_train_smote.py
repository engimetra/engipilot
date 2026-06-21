import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import mlflow
import mlflow.pytorch
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

mlflow.set_tracking_uri('http://engipilot-mlflow:5000')
mlflow.set_experiment('engipilot-lstm-kaggle')

df = pd.read_csv('/opt/airflow/data/processed/dataset_smote.csv')
print(f'Dataset SMOTE : {len(df)} lignes')

features = [c for c in df.columns if c != 'retard']
X = df[features].values.astype(np.float32)
y = df['retard'].values.astype(np.float32)

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

X_tr_t = torch.from_numpy(X_tr).unsqueeze(1)
X_te_t = torch.from_numpy(X_te).unsqueeze(1)
y_tr_t = torch.from_numpy(y_tr).unsqueeze(1)
y_te_t = torch.from_numpy(y_te).unsqueeze(1)

class LSTMClassifier(nn.Module):
    def __init__(self, input_dim, hidden=64):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden, 2, batch_first=True, bidirectional=True, dropout=0.2)
        self.head = nn.Sequential(
            nn.Linear(hidden*2, 32), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(32, 1), nn.Sigmoid()
        )
    def forward(self, x):
        o, _ = self.lstm(x)
        return self.head(o[:,-1,:])

EPOCHS = 30
model = LSTMClassifier(len(features))
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
loss_fn = nn.BCELoss()

with mlflow.start_run(run_name='lstm-smote-kaggle'):
    mlflow.log_params({
        'epochs': EPOCHS, 'hidden_dim': 64, 'num_layers': 2,
        'smote': True, 'n_train': len(X_tr), 'n_test': len(X_te),
        'input_features': len(features)
    })

    best_auc = 0.0
    best_state = None
    for ep in range(1, EPOCHS+1):
        model.train()
        opt.zero_grad()
        pred = model(X_tr_t)
        loss = loss_fn(pred, y_tr_t)
        loss.backward()
        opt.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(X_te_t).numpy().flatten()
            val_loss = loss_fn(model(X_te_t), y_te_t).item()
            auc = roc_auc_score(y_te, val_pred)

        mlflow.log_metric('train_loss', loss.item(), step=ep)
        mlflow.log_metric('val_loss', val_loss, step=ep)
        mlflow.log_metric('val_auc', auc, step=ep)

        if auc > best_auc:
            best_auc = auc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

        if ep % 10 == 0:
            print(f'Epoque {ep}/{EPOCHS} | loss={loss.item():.4f} | AUC={auc:.4f}')

    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        preds_bin = (model(X_te_t).numpy().flatten() > 0.5).astype(int)

    report = classification_report(y_te, preds_bin, output_dict=True)
    precision = report['1.0']['precision']
    recall    = report['1.0']['recall']
    f1        = report['1.0']['f1-score']
    accuracy  = report['accuracy']

    mlflow.log_metric('best_auc',  best_auc)
    mlflow.log_metric('precision', precision)
    mlflow.log_metric('recall',    recall)
    mlflow.log_metric('f1_score',  f1)
    mlflow.log_metric('accuracy',  accuracy)

    Path('/opt/airflow/models').mkdir(exist_ok=True)
    torch.save(best_state, '/opt/airflow/models/lstm_smote_kaggle.pt')
    # modele sauvegarde localement dans /opt/airflow/models/

    print(f'AUC={best_auc:.4f} | F1={f1:.4f} | Precision={precision:.4f} | Recall={recall:.4f} | Accuracy={accuracy:.4f}')
