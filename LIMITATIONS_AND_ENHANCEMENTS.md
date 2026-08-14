# Known Limitations & Future Enhancements
### Nexora AI Resume Analyzer


# Known Limitations

# 1. ML Model Accuracy

The Gradient Boosting model explains only about **42% of the variance** in match scores.
This means more than half of what makes a resume a good fit cannot be captured by the
4 features currently used. The model is good enough for guidance but should not be treated
as a definitive score.

The model was trained on a dataset skewed toward mid-to-high scores (61–80 band holds 48%
of all samples). Because of this, the model has seen fewer examples of poor matches and
tends to be less reliable when predicting very low scores.

# 2. Job Description Length as a Feature

The most influential feature in the model is the length of the job description text,
accounting for 45% of the model's decision weight. This is not a meaningful signal —
it is a pattern from the training data where longer job descriptions happened to correlate
with higher match scores. This makes the model partially unreliable across different
job postings.

# 3. Skill Matching is Keyword-Based Only

Skills are matched by looking for exact words or phrases from a fixed list of about 60 skills.
This means semantically equivalent terms are treated as different skills.
For example, "MSSQL" and "SQL Server" are the same technology but would not be matched.
Similarly, "Node" and "Node.js" could be missed depending on how the resume is written.

# 4. Skill Taxonomy is Limited

The built-in skill list covers common technologies but is not exhaustive. Domain-specific skills
in fields like healthcare, finance, law, or niche engineering roles are largely absent.
A resume for a biomedical engineer or a legal analyst would have most of its relevant skills
go undetected.

# 5. Experience Extraction from Resume Text

Years of experience are detected using a simple regex pattern that looks for phrases like
"3 years" or "5+ years" in the resume text. This can fail in several cases — if the
candidate writes "three years", uses a different format, or if the experience section is
structured as dates (e.g., "2021–2024") rather than year counts.

# 6. No Support for Resume Formatting Quality

The system cannot evaluate how well a resume is visually formatted. It cannot detect
whether the resume uses columns, tables, graphics, or non-standard fonts — all of which
can hurt ATS compatibility in real job applications.

# 7. PDF Parsing Limitations

Text extraction from PDFs works well for standard text-based PDFs. Resumes built entirely
in design tools like Canva, or saved as image-based PDFs, will have little or no text
extracted — resulting in very low and meaningless scores.

# 8. No Multi-Language Support

The entire pipeline — skill matching, keyword extraction, section detection, and scoring —
is built for English-only resumes and job descriptions. Non-English content will produce
incorrect or empty results.

# 9. Single Resume per Analysis

Each analysis is done for one resume against one job description at a time. There is no
way to compare multiple resumes against the same job, or one resume against multiple jobs,
in a single session.

# 10. No User History or Progress Tracking

The app stores past analyses, but there is no feature to track improvement over time,
compare two versions of a resume, or see how a score changed after making edits.



# Future Enhancements

# 1. Expand the Feature Set for the ML Model

Replace the current 4-feature input with a richer set — including section count,
action verb count, metric density, ATS keyword match ratio, and education score.
Removing length as a feature and adding meaningful signals would significantly
improve model accuracy.

# 2. Use Sentence Embeddings for Semantic Matching

Replace TF-IDF cosine similarity with sentence-level embeddings (such as sentence-transformers
or a lightweight BERT model). This would allow the system to understand that
"developed REST APIs" and "built backend services" are semantically similar,
even if the exact words differ.

# 3. Semantic Skill Matching

Build or integrate a skill ontology so that related technologies are grouped together.
"SQL Server", "MSSQL", and "T-SQL" would all count toward the same skill cluster.
This would make skill gap analysis significantly more accurate.

# 4. Expand the Skill Taxonomy

Add skills from more domains — including healthcare, finance, legal, mechanical engineering,
civil engineering, graphic design, and data analytics. This would make the tool useful
beyond just software development roles.

# 5. Resume Version Comparison

Let users upload two versions of their resume and compare the scores side by side.
This would help candidates see exactly which changes improved or hurt their match score.

# 6. Progress Tracking Over Time

Store a history of scores per user and show a progress chart. Candidates could see
how their resume has improved across multiple attempts for the same or similar roles.

# 7. Resume against Multiple Job Descriptions

Allow a candidate to paste multiple job descriptions and rank which one their resume
is best suited for. This would help candidates target the right roles before applying.

# 8. Improve PDF Parsing for Image-Based Resumes

Integrate OCR (optical character recognition) as a fallback for PDFs that contain
scanned images or non-selectable text. This would make the tool work for a wider
range of resume formats.

# 9. Formatting and ATS Layout Feedback

Add detection for common ATS-unfriendly formatting issues such as tables, text boxes,
headers and footers, and non-standard fonts. Give candidates specific advice on
how to restructure their layout for better ATS compatibility.

# 10. Retrain Model Periodically with New Data

Set up a pipeline to collect anonymized analysis data over time and use it to retrain
the model with more recent and diverse examples. This would improve accuracy as the
tool gets used more.

# 11. Multi-Language Support

Add support for resumes and job descriptions in other languages, starting with
widely used languages like Hindi, Spanish, French, and Arabic.

# 12. Resume Score Explanation (Explainability)

Show candidates exactly which parts of their resume contributed positively or negatively
to each sub-score. For example, highlighting which sentences boosted their ATS score
or which missing section lowered their overall match.

# 13. Role based System

Can add the role based account system for recruiter and admin, recruiter to post job description
 and job posting and admin to track the analysis, user and dashboard.