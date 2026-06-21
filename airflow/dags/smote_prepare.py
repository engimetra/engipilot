import pandas as pd
import numpy as np
import mlflow
from pathlib import Path
from collections import Counter
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler

mlflow.set_tracking_uri('http://engipilot-mlflow:5000')
mlflow.set_experiment('engipilot-lstm-kaggle')

df = pd.read_csv('/opt/airflow/data/kaggle/construction_dataset.csv')
print(f'Dataset original : {len(df)} lignes')

df['retard'] = (df['Risk_Level'].str.lower() == 'high').astype(int)
print(f'Distribution avant SMOTE : {Counter(df["retard"])}')
ratio = df['retard'].mean()
print(f'Ratio classe minoritaire : {ratio:.1%}')

features = ['Task_Duration_Days', 'Labor_Required', 'Equipment_Units',
            'Material_Cost_USD', 'Resource_Constraint_Score',
            'Site_Constraint_Score', 'Dependency_Count']

X = df[features].fillna(df[features].median())
y = df['retard']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

k = min(5, int(y.value_counts().min()) - 1)
smote = SMOTE(random_state=42, k_neighbors=k)
X_res, y_res = smote.fit_resample(X_scaled, y)

print(f'Distribution apres SMOTE : {Counter(y_res)}')
print(f'Taille dataset equilibre : {len(X_res)} lignes')

Path('/opt/airflow/data/processed').mkdir(parents=True, exist_ok=True)
df_res = pd.DataFrame(X_res, columns=features)
df_res['retard'] = y_res
df_res.to_csv('/opt/airflow/data/processed/dataset_smote.csv', index=False)
print('Dataset SMOTE sauvegarde')

with mlflow.start_run(run_name='smote-preparation'):
    mlflow.log_param('n_original', len(df))
    mlflow.log_param('n_apres_smote', len(X_res))
    mlflow.log_param('ratio_avant', round(ratio, 3))
    mlflow.log_param('features', str(features))
    mlflow.log_metric('classe_0_avant', int(Counter(y)[0]))
    mlflow.log_metric('classe_1_avant', int(Counter(y)[1]))
    mlflow.log_metric('classe_0_apres', int(Counter(y_res)[0]))
    mlflow.log_metric('classe_1_apres', int(Counter(y_res)[1]))
    print('Metriques SMOTE loggees dans MLflow')
