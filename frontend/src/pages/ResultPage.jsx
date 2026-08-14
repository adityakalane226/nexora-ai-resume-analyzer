import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnalysisById } from '../services/api';

function scoreClass(s) {
  if (s >= 70) return 'high';
  if (s >= 45) return 'mid';
  return 'low';
}

function ScoreBar({ label, value }) {
  const cls = scoreClass(value);
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function priorityBadgeClass(priority) {
  const p = (priority || '').toUpperCase();
  if (p === 'HIGH') return 'badge-high';
  if (p === 'MEDIUM') return 'badge-medium';
  return 'badge-low';
}

function fmt(dt) {
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  useEffect(() => {
    getAnalysisById(id)
      .then(r => setAnalysis(r.data.data.analysis))
      .catch(err => setError(err.response?.data?.message || 'Could not load this analysis.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-text">Loading Job Description analysis report…</span>
    </div>
  );

  if (error) return (
    <>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
    </>
  );

  const overall = analysis.overall_score;
  const cls = scoreClass(overall);
  const detailed = analysis.detailed_analysis || {};
  const recs = analysis.recommendations || [];

  const filteredRecs = recs.filter(r => {
    if (filterPriority === 'ALL') return true;
    return (r.priority || 'MEDIUM').toUpperCase() === filterPriority;
  });

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>Job Description Match Analysis Report</h2>
          <p>{analysis.job_title || 'Target Role'} · {analysis.resume_file_name} · {fmt(analysis.created_at)}</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <Link to="/analyze" className="btn btn-primary btn-sm">New Analysis</Link>
        </div>
      </div>

      {/* overall score circle & banner */}
      <div className="card mb-2" style={{ textAlign: 'center' }}>
        <div className={`score-circle ${cls}`}>
          <span className="score-num">{overall}</span>
          <span className="score-max">out of 100</span>
        </div>
        <div className="section-title" style={{ textAlign: 'center', border: 'none', marginBottom: '0.2rem' }}>
          {overall >= 75 ? 'Strong Match — High Alignment with Job Posting' :
           overall >= 50 ? 'Moderate Match — Specific Tailoring Required' :
           'Low Match — Significant Job Alignment Needed'}
        </div>
        <p className="text-muted text-sm">
          {overall >= 75 ? 'Your resume directly satisfies the key skills, keywords, and experience metrics specified in this job description.' :
           overall >= 50 ? 'Your resume meets foundational requirements, but key skills and terms from the job posting are missing.' :
           'Your resume has significant gaps when evaluated against the target job posting. Follow the prioritized recommendations below.'}
        </p>
      </div>

      {/* job description alignment signals */}
      {detailed && (detailed.jd_required_experience !== undefined || detailed.similarity_score !== undefined) && (
        <div className="card mb-2">
          <div className="section-title">Job Description Alignment Signals</div>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="metric-num">{detailed.similarity_score ? `${detailed.similarity_score}%` : '—'}</div>
              <div className="metric-lbl">JD Similarity Score</div>
            </div>
            <div className="metric-box">
              <div className="metric-num">{detailed.jd_keyword_match_pct ? `${detailed.jd_keyword_match_pct}%` : '—'}</div>
              <div className="metric-lbl">JD Keyword Match</div>
            </div>
            <div className="metric-box">
              <div className="metric-num">{detailed.years_experience ?? 0} / {detailed.jd_required_experience ?? 2} yrs</div>
              <div className="metric-lbl">Exp vs. JD Required</div>
            </div>
            <div className="metric-box">
              <div className="metric-num">{detailed.word_count || '—'}</div>
              <div className="metric-lbl">Word Count</div>
            </div>
          </div>
        </div>
      )}

      {/* component breakdown + skill gap */}
      <div className="two-col mb-2">
        {/* component scores */}
        <div className="card">
          <div className="section-title">Match Component Scores</div>
          <ScoreBar label="Job Skill Alignment" value={analysis.skills_score} />
          <ScoreBar label="ATS & Keyword Density" value={analysis.ats_score} />
          <ScoreBar label="Experience Level Match" value={analysis.experience_score} />
          <ScoreBar label="Education Requirement Match" value={analysis.education_score} />
        </div>

        {/* skill gap analysis */}
        <div className="card">
          <div className="section-title">Matched Job Skills ({analysis.matched_skills?.length || 0})</div>
          {analysis.matched_skills?.length > 0
            ? <div className="skill-list mb-2">
                {analysis.matched_skills.map(s => <span key={s} className="skill-tag skill-matched">✓ {s}</span>)}
              </div>
            : <p className="text-muted text-sm mb-2">No matching job skills detected.</p>}

          <div className="section-title">Missing Required Job Skills ({analysis.missing_skills?.length || 0})</div>
          {analysis.missing_skills?.length > 0
            ? <div className="skill-list">
                {analysis.missing_skills.map(s => <span key={s} className="skill-tag skill-missing">✗ {s}</span>)}
              </div>
            : <p className="text-muted text-sm">No missing skills detected for this job posting!</p>}
        </div>
      </div>

      {/* recommendations section */}
      {recs.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-1">
            <div className="section-title" style={{ margin: 0, border: 'none' }}>
              Job-Driven Action Items ({recs.length})
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-sm text-muted">Filter:</span>
              <button
                className={`btn btn-sm ${filterPriority === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterPriority('ALL')}
              >
                All ({recs.length})
              </button>
              <button
                className={`btn btn-sm ${filterPriority === 'HIGH' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setFilterPriority('HIGH')}
              >
                High
              </button>
              <button
                className={`btn btn-sm ${filterPriority === 'MEDIUM' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterPriority('MEDIUM')}
              >
                Medium
              </button>
            </div>
          </div>

          <div className="divider" style={{ margin: '0.75rem 0' }} />

          <ul className="rec-list">
            {filteredRecs.map((r, i) => {
              const recText = typeof r === 'string' ? r : r.text;
              const priority = typeof r === 'string' ? 'MEDIUM' : (r.priority || 'MEDIUM');
              const category = typeof r === 'string' ? 'General' : (r.category || 'Job Alignment');

              return (
                <li key={i} className="rec-item">
                  <div className="rec-content">
                    <div className="rec-header">
                      <span className={`badge-priority ${priorityBadgeClass(priority)}`}>
                        {priority} Priority
                      </span>
                      {category && <span className="rec-category">{category}</span>}
                    </div>
                    <div>{recText}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
