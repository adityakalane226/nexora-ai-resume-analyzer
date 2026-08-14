# ML Model Evaluation Report
# Nexora AI Resume Analyzer


# How the Model is Evaluated

The model is a **regression model** — it predicts a continuous number (match score 0–100). So it is evaluated using regression metrics, not accuracy like a classification model.

**MAE — Mean Absolute Error**
The average gap between the predicted score and the real score across all test samples. Lower is better.
Think of it as: "On average, how many points off is the model?"

**RMSE — Root Mean Squared Error**
Similar to MAE but punishes bigger mistakes harder. If a prediction is off by 30 points, RMSE treats that much worse than three 10-point errors.
Think of it as: "How bad are the worst predictions?"

**R² — R-squared (Explained Variance)**
Tells you how much of the variation in real scores the model can explain. A score of 1.0 means perfect prediction. A score of 0.0 means the model is no better than always guessing the average.
Think of it as: "How well does the model actually understand the relationship?"

**5-Fold Cross-Validation R²**
The dataset is split into 5 parts and the model is trained and tested 5 times on different splits. This checks if the model is consistent or just got lucky on one particular test set.
Think of it as: "Is the model reliable across different data?"


# Results at a Glance

All three candidate models were compared on the same 1,909 held-out test samples.

**Ridge Regression** came last — MAE of 11.68 points, R² of only 0.21. A simple linear model that couldn't capture the complexity in the data.

**Random Forest** performed much better — MAE of 9.88 points, R² of 0.39. A solid step up but slightly less consistent across cross-validation folds.

**Gradient Boosting Regressor (GBR)** won — MAE of 9.82 points, R² of 0.42, and the most stable cross-validation results (R² 0.366 ± 0.007). This is the model saved and used in the app.

What the GBR results mean in plain terms:

- The model is off by about **10 points on average**
- **60%** of all predictions land within ±10 points of the real score
- **79%** of predictions land within ±15 points of the real score
- The model bias is nearly **zero** (−0.009 pts) — it doesn't consistently over or under-predict
- Worst underprediction seen: **53 points** below actual (rare edge case)
- Worst overprediction seen: **35 points** above actual (rare edge case)

The model is accurate enough for a **guidance tool** that helps candidates understand where they stand — but not precise enough to be used as a hard pass/fail cutoff, which is exactly how Nexora uses it.

# Results (from the actual run on 9,544 samples)

|  | Ridge Regression | Random Forest | GBR (winner) |
|--|----------------- |-------------- |--------------|
| **MAE**             | 11.68 pts     | 9.88 pts     | 
| **RMSE**            | 14.77 pts     | 12.95 pts    |
| **R² Test**         | 0.21          | 0.39         | 
| **R² CV**           | 0.195         | 0.336        | 



# The Dataset


The model was trained on **9,544 resume–job pairs** from a CSV file of about 17 MB.
Each pair has a real match score (0–100) assigned to it, which the model learns to predict.

The average score in the dataset is **66 out of 100**, with most scores sitting between 61 and 80.
Very few low-score pairs exist (under 40), which means the model has seen fewer examples of poor matches — so it may be less confident predicting very low scores.


# What Goes Into the Model

Before training, each resume and job description is converted into a set of 4 numbers:

- **Cosine Similarity** — how closely the words in the resume match the words in the job description
- **Skill Ratio** — what fraction of the skills the job asks for are actually on the resume
- **Resume Length** — how long the resume text is (normalized)
- **Job Length** — how long the job description text is (normalized)

These 4 numbers go into the model, and it predicts a match score between 0 and 100.

The data was split **80% for training (7,635 samples)** and **20% for testing (1,909 samples)**.


# Three Models Were Compared

Three different algorithms were trained and compared to find the best one.

**Ridge Regression** performed the worst. It's a simple linear model and couldn't capture the complexity in the data. It explained only about **21% of the variance** in scores — not useful enough.

**Random Forest** did much better, explaining about **39% of the variance**. It also made predictions that were off by about **9.9 points on average**.

**Gradient Boosting Regressor (GBR)** came out on top. It explained **42% of the variance** with an average prediction error of **9.8 points**. It was also the most consistent model across all 5 cross-validation folds. This is the model that got saved and is used in the app.

# How Accurate Is the Winning Model?

The GBR model was tested on 1,909 samples it had never seen before.

- On average, its predictions are off by about **10 score points**
- **32%** of predictions were within 5 points of the real score
- **60%** of predictions were within 10 points of the real score
- **79%** of predictions were within 15 points of the real score

The model has almost **zero bias** — meaning it doesn't consistently score too high or too low. Its errors are roughly balanced in both directions.

The worst case seen was an underprediction of **53 points** — rare, but it shows the model can be significantly off for unusual resumes. The worst overprediction was **35 points**.


# What Does the Model Rely On Most?

When GBR makes a prediction, here is roughly how much each feature matters:

- **Job description length** drives about **45%** of the decision
- **Skill ratio** drives about **22%**
- **Resume length** drives about **17%**
- **Cosine similarity** drives about **16%**

The fact that job description length is the biggest factor is a known issue. Longer job descriptions happened to correlate with higher match scores in the training data — but that's a dataset pattern, not a real quality signal. Future improvements should remove length as a feature.


# What Happens at Runtime

When someone submits a resume and job description in the app:

1. The NLP engine computes the 4 features from the uploaded text
2. Those 4 numbers are passed to the GBR model
3. The model outputs a score, which gets clamped between 15 and 100
4. If the model fails to load for any reason, a weighted formula takes over automatically — so scoring always works

All the other scores (skills, experience, education, ATS) are computed separately by the NLP engine regardless of whether the model is used or not.


# Known Limitations

The model explains only about 42% of what determines a good match score. The rest comes from patterns too complex for just 4 features to capture. Here are the main things to be aware of:

- The dataset is heavily skewed toward medium-to-high scores, so the model is weaker at predicting poor matches
- Job description length is being used as a proxy signal, which is not ideal
- Skill matching is done by token overlap, so "SQL Server" and "MSSQL" would count as different skills
- With only 4 input features, the model's capacity is inherently limited

These are acceptable trade-offs for the current version. The NLP scoring engine compensates for most of these by computing detailed sub-scores independently.


