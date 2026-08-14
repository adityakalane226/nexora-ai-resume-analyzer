import os
import re
import joblib
import numpy as np
from typing import Dict, List, Optional
from app.services.pipeline import UserResumeScorerPipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── expanded skill taxonomy ────────────────────────────────────────────────────
COMMON_SKILLS = [
    # languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r", "matlab",
    # web / frontend
    "react", "vue", "angular", "next.js", "html", "css", "tailwind", "bootstrap",
    "webpack", "vite", "sass",
    # backend / apis
    "node.js", "express", "fastapi", "django", "flask", "spring boot",
    "graphql", "rest api", "grpc",
    # data / ml / ai
    "machine learning", "deep learning", "nlp", "computer vision",
    "scikit-learn", "tensorflow", "pytorch", "keras", "xgboost",
    "pandas", "numpy", "matplotlib", "seaborn", "data analysis",
    "feature engineering", "model deployment", "mlops",
    # databases
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "sqlite",
    # cloud / devops
    "aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "jenkins",
    "github actions", "terraform", "ansible", "linux",
    # tools
    "git", "jira", "agile", "scrum", "figma", "postman",
]

# ── section detection keywords ─────────────────────────────────────────────────
SECTION_HEADERS = {
    "summary":        ["summary", "objective", "profile", "about", "overview"],
    "experience":     ["experience", "work history", "employment", "professional background",
                       "work experience", "career"],
    "education":      ["education", "academic", "degree", "qualification", "university", "college"],
    "skills":         ["skills", "technical skills", "competencies", "technologies", "tools"],
    "projects":       ["projects", "portfolio", "personal projects", "open source"],
    "certifications": ["certification", "certified", "certificate", "credential", "license"],
    "achievements":   ["achievement", "award", "honor", "publication", "recognition"],
    "contact":        ["email", "phone", "linkedin", "github", "address", "contact"],
}

# ── action verb library ─────────────────────────────────────────────────────────
STRONG_VERBS = [
    "led", "built", "designed", "developed", "architected", "launched", "deployed",
    "optimized", "improved", "increased", "reduced", "managed", "delivered",
    "implemented", "created", "established", "automated", "streamlined",
    "collaborated", "mentored", "negotiated", "spearheaded", "drove",
]

# ── metric pattern ─────────────────────────────────────────────────────────────
METRIC_PATTERN = re.compile(
    r'(\d+\s*%|\d+x|\$\s*\d+|\d+\s*(?:million|billion|k|m|b|users|requests|'
    r'records|transactions|customers|employees|projects|teams|days|hours|weeks))',
    re.IGNORECASE
)


class MLAnalyzerService:
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        if self.model_path and os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print(f"[ML Service] Successfully loaded trained model from {self.model_path}")
            except Exception as e:
                print(f"[ML Service] Warning: Failed to load model: {e}. Using NLP fallback.")
                self.model = None

    # ── text utilities ──────────────────────────────────────────────────────────

    def clean_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s#+.\-/]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def extract_skills(self, text: str) -> List[str]:
        cleaned = self.clean_text(text)
        found = []
        for skill in COMMON_SKILLS:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, cleaned):
                found.append(skill.title())
        return list(set(found))

    def extract_jd_keywords_and_phrases(self, job_text: str, top_n: int = 15) -> List[str]:
        """extracts top significant keywords and n-grams directly from the job description text."""
        cleaned = self.clean_text(job_text)
        if not cleaned or len(cleaned.split()) < 5:
            return []
        try:
            vectorizer = TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 2),
                max_features=100
            )
            tfidf = vectorizer.fit_transform([cleaned])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf.toarray()[0]
            sorted_indices = np.argsort(scores)[::-1]
            top_phrases = [feature_names[i] for i in sorted_indices[:top_n] if scores[i] > 0]
            return top_phrases
        except Exception:
            # fallback simple split if tf-idf fails
            words = [w for w in cleaned.split() if len(w) > 3]
            return list(set(words[:top_n]))

    def extract_jd_experience_required(self, job_text: str) -> int:
        """parses minimum experience years required by the job description.
        handles entry-level, fresh graduate, trainee, and 0-1 year language correctly."""
        lowered = job_text.lower()

        # detect fresh graduate / entry-level / trainee language → 0 years required
        entry_level_phrases = [
            "fresh graduate", "recent graduate", "entry level", "entry-level",
            "no experience required", "0 years", "fresher", "trainee", "intern",
            "newly graduated", "0-1 year", "0 to 1", "up to 1 year",
            "graduates", "graduate who", "fresh graduates", "recent graduates"
        ]
        if any(phrase in lowered for phrase in entry_level_phrases):
            return 0

        # match both singular "year" and plural "years" (years? makes s optional)
        matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?|yr)\b', lowered)
        valid_nums = [int(x) for x in matches if 0 < int(x) <= 30]

        if valid_nums:
            return min(valid_nums)  # use minimum requirement, not maximum

        return 1  # conservative default — 1 year if nothing detected

    def extract_jd_education_required(self, job_text: str) -> str:
        """determines target education degree level requested by the job description."""
        lowered = job_text.lower()
        if any(k in lowered for k in ["phd", "doctorate"]):
            return "PHD"
        if any(k in lowered for k in ["master", "m.tech", "ms", "mba", "m.sc"]):
            return "MASTER"
        if any(k in lowered for k in ["bachelor", "b.tech", "bs", "b.e", "b.sc", "degree"]):
            return "BACHELOR"
        return "ANY"

    def detect_sections(self, text: str) -> Dict[str, bool]:
        lowered = text.lower()
        found = {}
        for section, keywords in SECTION_HEADERS.items():
            found[section] = any(kw in lowered for kw in keywords)
        return found

    def count_metrics(self, text: str) -> int:
        return len(METRIC_PATTERN.findall(text))

    def count_action_verbs(self, text: str) -> int:
        lowered = text.lower()
        return sum(1 for v in STRONG_VERBS if re.search(r'\b' + v + r'\b', lowered))

    def extract_years_experience(self, text: str) -> int:
        matches = re.findall(r'(\d+)\+?\s*(?:years|yrs|yr)', text.lower())
        total = sum(int(x) for x in matches if int(x) <= 40)
        return total if total > 0 else 0

    def extract_contact_info(self, text: str) -> Dict[str, bool]:
        lowered = text.lower()
        return {
            "email":    bool(re.search(r'\b[\w.+-]+@[\w-]+\.\w+', text)),
            "phone":    bool(re.search(r'(\+?\d[\d\s\-().]{7,}\d)', text)),
            "linkedin": "linkedin" in lowered,
            "github":   "github" in lowered,
        }

    def word_count(self, text: str) -> int:
        return len(text.split())

    # ── core job description-based analysis ─────────────────────────────────────

    def analyze(self, resume_text: str, job_description: str,
                explicit_skills: Optional[List[str]] = None) -> Dict:

        cleaned_resume = self.clean_text(resume_text)
        cleaned_job    = self.clean_text(job_description)

        # ── 1. job description specific requirements extraction ─────────────
        req_exp_jd     = self.extract_jd_experience_required(job_description)
        req_edu_jd     = self.extract_jd_education_required(job_description)
        jd_key_phrases = self.extract_jd_keywords_and_phrases(job_description)

        # ── 2. tf-idf cosine similarity (text & vocabulary match) ────────────
        vectorizer  = TfidfVectorizer(stop_words='english', max_features=5000)
        tfidf_mat   = vectorizer.fit_transform([cleaned_resume, cleaned_job])
        cos_sim     = float(cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:2])[0][0])

        # ── 3. job description key phrase coverage ─────────────────────────────
        jd_phrase_matches = [
            phrase for phrase in jd_key_phrases
            if phrase in cleaned_resume
        ]
        jd_keyword_match_ratio = len(jd_phrase_matches) / max(len(jd_key_phrases), 1)

        # ── 4. skill gap analysis against jd skills ────────────────────────────
        resume_skills = set(self.extract_skills(resume_text))
        job_skills    = set(self.extract_skills(job_description))
        if explicit_skills:
            job_skills.update([s.title() for s in explicit_skills])

        matched_skills = sorted(resume_skills & job_skills)
        missing_skills = sorted(job_skills - resume_skills)
        extra_skills   = sorted(resume_skills - job_skills)

        skill_ratio  = len(matched_skills) / max(len(job_skills), 1)
        skills_score = int(min(100, max(10, skill_ratio * 100)))

        # ── 5. candidate experience vs. jd required experience ───────────────
        cand_exp  = self.extract_years_experience(resume_text)
        if req_exp_jd == 0:
            # entry-level / fresh graduate role — 0 exp is perfectly acceptable
            exp_score = 90 if cand_exp == 0 else 95
        elif cand_exp >= req_exp_jd:
            exp_score = 95
        elif cand_exp > 0:
            exp_score = int(min(90, max(35, (cand_exp / req_exp_jd) * 90)))
        else:
            exp_score = 45  # baseline if experience duration unspecified in resume

        # ── 6. candidate education vs. jd required education ──────────────────
        edu_keywords = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e",
                        "degree", "bs", "ms", "mba", "b.sc", "m.sc", "graduate", "postgraduate"]
        res_lowered = resume_text.lower()
        cand_has_phd     = any(k in res_lowered for k in ["phd", "doctorate"])
        cand_has_master  = cand_has_phd or any(k in res_lowered for k in ["master", "m.tech", "ms", "mba", "m.sc"])
        cand_has_bachelor= cand_has_master or any(k in res_lowered for k in ["bachelor", "b.tech", "bs", "b.e", "b.sc", "degree"])

        if req_edu_jd == "PHD":
            education_score = 100 if cand_has_phd else (75 if cand_has_master else 50)
        elif req_edu_jd == "MASTER":
            education_score = 100 if cand_has_master else (70 if cand_has_bachelor else 50)
        elif req_edu_jd == "BACHELOR":
            education_score = 95 if cand_has_bachelor else 60
        else:
            education_score = 90 if cand_has_bachelor else 70

        # ── 7. ats score (driven by jd keyword match & tf-idf cosine similarity)
        word_count  = self.word_count(resume_text)
        word_score  = 95 if 200 <= word_count <= 1200 else (70 if word_count < 200 else 60)
        ats_score   = int((cos_sim * 40) + (jd_keyword_match_ratio * 40) + (word_score * 0.20))
        ats_score   = int(min(100, max(20, ats_score)))

        # ── 8. overall match score based on job description alignment ──────────
        if self.model:
            try:
                features = np.array([[cos_sim, skill_ratio,
                                      word_count / 1000,
                                      1 if cand_has_bachelor else 0]])
                pred = self.model.predict(features)[0]
                overall_score = int(min(100, max(0, pred)))
            except Exception:
                overall_score = self._weighted_score(
                    cos_sim, skills_score, exp_score, education_score, ats_score, jd_keyword_match_ratio)
        else:
            overall_score = self._weighted_score(
                cos_sim, skills_score, exp_score, education_score, ats_score, jd_keyword_match_ratio)

        overall_score = int(min(100, max(15, overall_score)))

        # ── 9. content signals & jd alignment details ──────────────────────────
        sections     = self.detect_sections(resume_text)
        metric_count = self.count_metrics(resume_text)
        action_count = self.count_action_verbs(resume_text)
        contact_info = self.extract_contact_info(resume_text)

        detailed_analysis = {
            "word_count":             word_count,
            "metric_count":           metric_count,
            "action_verb_count":      action_count,
            "years_experience":       cand_exp,
            "jd_required_experience": req_exp_jd,
            "jd_required_education":  req_edu_jd,
            "similarity_score":       round(cos_sim * 100, 1),
            "jd_keyword_match_pct":   round(jd_keyword_match_ratio * 100, 1),
            "skill_coverage":         f"{len(matched_skills)}/{max(len(job_skills), 1)}",
            "matched_jd_keywords":    jd_phrase_matches[:8],
            "missing_jd_keywords":    [p for p in jd_key_phrases if p not in jd_phrase_matches][:8],
            "sections_found":         [k for k, v in sections.items() if v],
            "sections_missing":       [k for k, v in sections.items() if not v
                                       and k in ("summary", "experience", "education", "skills")],
            "contact_info":           contact_info,
            "extra_skills":           extra_skills[:10],
        }

        # ── 10. recommendations engine (job description driven) ────────────────
        recommendations = self._generate_recommendations(
            cos_sim               = cos_sim,
            jd_keyword_match_ratio= jd_keyword_match_ratio,
            jd_key_phrases        = jd_key_phrases,
            jd_phrase_matches     = jd_phrase_matches,
            req_exp_jd            = req_exp_jd,
            cand_exp              = cand_exp,
            req_edu_jd            = req_edu_jd,
            cand_has_bachelor     = cand_has_bachelor,
            cand_has_master       = cand_has_master,
            skill_ratio           = skill_ratio,
            skills_score          = skills_score,
            ats_score             = ats_score,
            exp_score             = exp_score,
            education_score       = education_score,
            word_count            = word_count,
            metric_count          = metric_count,
            action_count          = action_count,
            missing_skills        = missing_skills,
            matched_skills        = matched_skills,
            extra_skills          = extra_skills,
            contact_info          = contact_info,
            sections              = sections,
        )

        return {
            "overall_score":     overall_score,
            "ats_score":         ats_score,
            "skills_score":      skills_score,
            "experience_score":  exp_score,
            "education_score":   education_score,
            "matched_skills":    matched_skills,
            "missing_skills":    missing_skills,
            "recommendations":   [r["text"] for r in recommendations],
            "recommendations_detailed": recommendations,
            "detailed_analysis": detailed_analysis,
        }

    # ── weighted overall match calculation ──────────────────────────────────────
    def _weighted_score(self, cos_sim, skills_score, exp_score,
                        education_score, ats_score, jd_keyword_ratio) -> int:
        return int(
            (skills_score          * 0.35) +
            (cos_sim * 100         * 0.25) +
            (jd_keyword_ratio * 100* 0.15) +
            (exp_score             * 0.15) +
            (education_score       * 0.10)
        )

    # ── recommendation engine driven by job description ────────────────────────
    def _generate_recommendations(self, **kw) -> List[Dict]:
        recs = []

        def add(text: str, priority: str, category: str):
            recs.append({"text": text, "priority": priority, "category": category})

        missing      = kw["missing_skills"]
        contact      = kw["contact_info"]
        req_exp_jd   = kw["req_exp_jd"]
        cand_exp     = kw["cand_exp"]
        req_edu_jd   = kw["req_edu_jd"]
        jd_phrases   = kw["jd_key_phrases"]
        jd_matched   = kw["jd_phrase_matches"]

        # ── 1. skill gap (direct from jd) ──────────────────────────────────────
        if missing:
            top = ", ".join(missing[:4])
            add(
                f"Missing Key Technical Skills: The Job Description specifically requires {top}. "
                f"Incorporate these tools directly into your Skills section and project bullet points.",
                "HIGH", "Job Skill Gap"
            )
        if len(missing) > 4:
            rest = ", ".join(missing[4:8])
            add(
                f"Secondary Skill Gaps: Consider adding exposure to {rest} as requested in the JD.",
                "MEDIUM", "Job Skill Gap"
            )

        # ── 2. jd keyword & term alignment ─────────────────────────────────────
        missing_jd_phrases = [p for p in jd_phrases if p not in jd_matched]
        if missing_jd_phrases:
            top_missing_phrases = ", ".join(missing_jd_phrases[:4])
            add(
                f"Job Description Keywords Missing: Your resume lacks prominent terms from the job posting, such as: '{top_missing_phrases}'. "
                f"Mirroring exact phrases from the job description boosts ATS visibility.",
                "HIGH", "JD Keyword Alignment"
            )

        if kw["cos_sim"] < 0.25:
            add(
                f"Low Job Description Similarity ({round(kw['cos_sim']*100, 1)}% match): "
                f"Rewrite your summary and recent experience bullet points using language from the job description.",
                "HIGH", "JD Keyword Alignment"
            )

        # ── 3. experience match vs. jd requirement ──────────────────────────────
        if req_exp_jd == 0:
            # entry-level / fresh graduate role — never show experience gap
            # instead, encourage highlighting projects and internships
            if cand_exp == 0:
                add(
                    "This is an entry-level/trainee role open to fresh graduates. "
                    "Strengthen your profile by clearly listing academic projects, internships, "
                    "and hands-on coursework relevant to the job description.",
                    "MEDIUM", "Experience Alignment"
                )
        elif cand_exp < req_exp_jd:
            add(
                f"Experience Duration Alignment: The job posting asks for ~{req_exp_jd} year(s) of experience, "
                f"but only ~{cand_exp} year(s) was detected on your resume. Clearly highlight relevant project or internship experience to bridge this gap.",
                "HIGH", "Experience Alignment"
            )

        # ── 4. education match vs. jd requirement ───────────────────────────────
        if req_edu_jd == "MASTER" and not kw["cand_has_master"]:
            add(
                "Education Gap: The job description prefers or requires a Master's degree. "
                "Highlight advanced coursework or specialized certifications to offset this preference.",
                "MEDIUM", "Education Alignment"
            )

        # ── 5. ats formatting & length ──────────────────────────────────────────
        wc = kw["word_count"]
        if wc < 200:
            add(
                f"Resume Length Issue: Your resume has only {wc} words. A target role resume should be 400–900 words "
                f"to sufficiently address all requirements outlined in the job description.",
                "HIGH", "ATS & Formatting"
            )
        elif wc > 1400:
            add(
                f"Resume Length Warning: At {wc} words, your resume may be too verbose. Trim non-relevant details to focus sharply on the job description requirements.",
                "MEDIUM", "ATS & Formatting"
            )

        # ── 6. metrics & impact ─────────────────────────────────────────────────
        if kw["metric_count"] == 0:
            add(
                "Quantified Results Missing: Add metrics (% improvements, dollar amounts, team size, users served) to your experience. "
                "Recruiters evaluate candidate suitability based on measurable achievements.",
                "HIGH", "Impact & Metrics"
            )
        elif kw["metric_count"] < 3:
            add(
                f"Low Metric Density: Only {kw['metric_count']} quantified metric(s) found. Add more measurable outcomes to strengthen your candidacy for this role.",
                "MEDIUM", "Impact & Metrics"
            )

        # ── 7. profile summary ─────────────────────────────────────────────────
        if not kw["sections"].get("summary", False):
            add(
                "Add a Tailored Professional Summary: Include a 3-line summary at the top of your resume "
                "customized specifically to the target job title and core responsibilities.",
                "HIGH", "Profile Summary"
            )

        # ── 8. contact info ─────────────────────────────────────────────────────
        missing_contact = []
        if not contact.get("email"): missing_contact.append("email")
        if not contact.get("linkedin"): missing_contact.append("LinkedIn link")
        if missing_contact:
            add(
                f"Missing Contact Links: Add your {', '.join(missing_contact)} to the top header.",
                "MEDIUM", "Contact Info"
            )

        # sort: high → medium → low
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        recs.sort(key=lambda r: priority_order.get(r["priority"], 3))
        return recs[:12]
