# Model Evaluation Report

## Dataset & Split Details
- **Dataset**: `resume_data_for_ranking.csv` (9,544 rows)
- **Train Set**: 7,635 rows (80%)
- **Test Set**: 1,909 rows (20%)
- **Random Seed**: 42

## Empirical Evaluation Metrics

| Model Candidate | MAE (Score Points) | RMSE (Score Points) | R² Score |
|---|---|---|---|
| Ridge Regression | 11.68 | 14.77 | 0.2112 |
| Random Forest Regressor | 9.88 | 12.95 | 0.3940 |
| **Gradient Boosting Regressor (Final)** | **9.82** | **12.69** | **0.4174** |

## Verification Test
For a test input feature vector `[Cosine Sim = 0.75, Skill Ratio = 0.80, Resume Length Metric = 0.5, Job Length Metric = 0.4]`, the trained pipeline predicts an overall match score of **76.54 / 100**.
