import os
import re
import ast
import joblib
import pandas as pd
import numpy as np
from typing import Tuple
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))
from app.services.pipeline import UserResumeScorerPipeline
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "datasets", "resume_data_for_ranking.csv")
MODEL_EXPORT_PATH = os.path.join(BASE_DIR, "models", "resume_score_model.joblib")
SERVICE_MODEL_PATH = os.path.join(BASE_DIR, "..", "ml-service", "models", "resume_score_model.joblib")

def clean_text(text) -> str:
    """cleans and normalizes text string."""
    if not isinstance(text, str) or pd.isna(text):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s#+.-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_list_str(val) -> str:
    """parses stringified python lists or text into clean space-separated text."""
    if not isinstance(val, str) or pd.isna(val):
        return ""
    val = val.strip()
    if val.startswith('[') and val.endswith(']'):
        try:
            parsed = ast.literal_eval(val)
            if isinstance(parsed, list):
                return " ".join([str(item) for item in parsed if item])
        except Exception:
            pass
    return val

def build_resume_text(row) -> str:
    """combines candidate resume attributes into single comprehensive text."""
    objective = clean_text(row.get('career_objective'))
    skills = clean_text(parse_list_str(row.get('skills')))
    degrees = clean_text(parse_list_str(row.get('degree_names')))
    majors = clean_text(parse_list_str(row.get('major_field_of_studies')))
    positions = clean_text(row.get('positions'))
    resp = clean_text(row.get('responsibilities'))
    
    return f"{objective} {skills} {degrees} {majors} {positions} {resp}".strip()

def build_job_text(row) -> str:
    """combines job posting attributes into single comprehensive job description text."""
    title = clean_text(row.get('job_position_name'))
    skills_req = clean_text(parse_list_str(row.get('skills_required')))
    edu_req = clean_text(row.get('educationaL_requirements'))
    exp_req = clean_text(row.get('experiencere_requirement'))
    resp = clean_text(row.get('responsibilities.1'))
    
    return f"{title} {skills_req} {edu_req} {exp_req} {resp}".strip()


def train_user_model():
    print(f"=== [STEP 1] Reading Uploaded Dataset: {DATASET_PATH} ===")
    df = pd.read_csv(DATASET_PATH, low_memory=False)
    print(f"Loaded {len(df)} candidate-job pairs.")

    print("\n=== [STEP 2] Preprocessing Text & Constructing Composite Fields ===")
    df['full_resume'] = df.apply(build_resume_text, axis=1)
    df['full_job'] = df.apply(build_job_text, axis=1)
    df['target_score'] = pd.to_numeric(df['matched_score'], errors='coerce') * 100.0

    # drop rows missing valid target
    df = df.dropna(subset=['target_score']).reset_index(drop=True)
    print(f"Valid samples for training: {len(df)}")

    print("\n=== [STEP 3] TF-IDF Vectorization & Feature Engineering ===")
    # fit tf-idf vectorizer
    corpus = pd.concat([df['full_resume'], df['full_job']])
    vectorizer = TfidfVectorizer(stop_words='english', max_features=1000, ngram_range=(1, 2))
    vectorizer.fit(corpus)

    print("Transforming resume and job texts to sparse TF-IDF vectors...")
    res_tfidf = vectorizer.transform(df['full_resume'])
    job_tfidf = vectorizer.transform(df['full_job'])

    # compute row-wise cosine similarity using element-wise dot product
    print("Computing Cosine Similarities...")
    dot_products = np.asarray(res_tfidf.multiply(job_tfidf).sum(axis=1)).flatten()
    res_norms = np.sqrt(np.asarray(res_tfidf.multiply(res_tfidf).sum(axis=1)).flatten())
    job_norms = np.sqrt(np.asarray(job_tfidf.multiply(job_tfidf).sum(axis=1)).flatten())

    # avoid division by zero
    denom = res_norms * job_norms
    denom[denom == 0] = 1e-6
    cosine_sims = dot_products / denom

    # calculate skill overlap ratio feature
    print("Extracting skill overlap ratios...")
    skill_ratios = []
    for idx, row in df.iterrows():
        r_skills = set(clean_text(parse_list_str(row.get('skills'))).split())
        j_skills = set(clean_text(parse_list_str(row.get('skills_required'))).split())
        if j_skills:
            ratio = len(r_skills.intersection(j_skills)) / float(len(j_skills))
        else:
            ratio = 0.5
        skill_ratios.append(ratio)
    skill_ratios = np.array(skill_ratios)

    # text length ratios
    res_lens = df['full_resume'].str.len().values / 1000.0
    job_lens = df['full_job'].str.len().values / 1000.0

    # construct 2d feature matrix
    X = np.column_stack([cosine_sims, skill_ratios, res_lens, job_lens])
    y = df['target_score'].values

    print(f"Final Feature Matrix Shape: {X.shape}, Target Vector Shape: {y.shape}")

    print("\n=== [STEP 4] Train / Test Data Split (80% Train, 20% Test) ===")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}")

    print("\n=== [STEP 5] Training & Comparing Candidate Models ===")
    models = {
        "Ridge Regression": Ridge(alpha=1.0),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    }

    best_model = None
    best_score = -float('inf')
    best_name = ""

    results = {}
    for name, model in models.items():
        print(f"Fitting {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        results[name] = {"MAE": mae, "RMSE": rmse, "R2": r2}
        print(f" -> {name} | MAE: {mae:.2f} | RMSE: {rmse:.2f} | R²: {r2:.4f}")

        if r2 > best_score:
            best_score = r2
            best_model = model
            best_name = name

    print(f"\n* Winner Model Selected: {best_name} (R2 = {best_score:.4f})")

    print("\n=== [STEP 6] Final Evaluation on Test Set ===")
    final_preds = best_model.predict(X_test)
    final_mae = mean_absolute_error(y_test, final_preds)
    final_rmse = np.sqrt(mean_squared_error(y_test, final_preds))
    final_r2 = r2_score(y_test, final_preds)

    print(f"Final Model Metrics:")
    print(f" - MAE (Mean Absolute Error): {final_mae:.2f} score points")
    print(f" - RMSE (Root Mean Squared Error): {final_rmse:.2f} score points")
    print(f" - R2 (Variance Explained): {final_r2:.4f}")

    print("\n=== [STEP 7] Exporting & Serializing Model Artifacts ===")
    pipeline = UserResumeScorerPipeline(vectorizer, best_model)

    os.makedirs(os.path.dirname(MODEL_EXPORT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(SERVICE_MODEL_PATH), exist_ok=True)

    joblib.dump(pipeline, MODEL_EXPORT_PATH)
    joblib.dump(pipeline, SERVICE_MODEL_PATH)

    print("* Model successfully serialized to:")
    print(f"  - {MODEL_EXPORT_PATH}")
    print(f"  - {SERVICE_MODEL_PATH}")

    # verification test
    test_sample = np.array([[0.75, 0.80, 0.5, 0.4]])
    test_pred = pipeline.predict(test_sample)[0]
    print(f"\n[Verification Inference Test] Feature Sample {test_sample[0]} => Predicted Score: {test_pred:.2f}/100")

if __name__ == "__main__":
    train_user_model()
