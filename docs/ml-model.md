# Machine Learning Architecture & Feature Engineering

## Dataset Overview
- **Source**: `ml-model/datasets/resume_data_for_ranking.csv`
- **Total Samples**: 9,544 candidate resume & job description pairs.
- **Target Variable**: `matched_score` scaled to [0 - 100] percentage score scale.

## Feature Extraction Pipeline
1. **TF-IDF Vectorization**: 1,000 max features, unigram & bigram vocabulary across combined resume and job description text corpus.
2. **TF-IDF Cosine Similarity**: Sparse dot-product matrix multiplication calculating semantic textual alignment.
3. **Skill Overlap Ratio**: Overlap fraction between candidate skills and job-required skills.
4. **Length Ratios**: Relative text length metrics for resume and job description.

## Model Training & Selection
Candidate models evaluated on 80/20 train-test split (7,635 train samples / 1,909 test samples):
- **Ridge Regression**: MAE: 11.68 | RMSE: 14.77 | R²: 0.2112
- **Random Forest Regressor**: MAE: 9.88 | RMSE: 12.95 | R²: 0.3940
- **Gradient Boosting Regressor (WINNER)**: MAE: 9.82 | RMSE: 12.69 | R²: 0.4174

## Serialization
Serialized using `joblib` into binary artifact: `resume_score_model.joblib` loaded automatically by the FastAPI ML microservice on startup.
