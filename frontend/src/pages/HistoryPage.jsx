import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAnalyses } from '../services/api';

function scoreClass(s) {
  if (s >= 70) return 'score-high';
  if (s >= 45) return 'score-mid';
  return 'score-low';
}

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMyAnalyses()
      .then(r => setAnalyses(r.data.data?.analyses || []))
      .catch(() => setError('Could not load analysis history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = analyses.filter(a =>
    (a.job_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.resume_file_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-text">Loading history…</span>
    </div>
  );

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>Analysis History</h2>
          <p>All resume analyses you have run — {analyses.length} total.</p>
        </div>
        <Link to="/analyze" className="btn btn-primary btn-sm">+ New Analysis</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {analyses.length === 0 ? (
        <div className="empty-state">
          <h3>No analyses yet</h3>
          <p>Run your first AI resume analysis to see results here.</p>
          <Link to="/analyze" className="btn btn-primary">Analyze a Resume</Link>
        </div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <input
              id="history-search"
              type="text"
              className="form-input"
              placeholder="Search by job title or resume…"
              style={{ maxWidth: 320 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="text-sm text-muted">{filtered.length} results</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Resume</th>
                  <th>Overall</th>
                  <th>Skills</th>
                  <th>ATS</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No results match your search.</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.job_title || 'Unnamed Role'}</strong></td>
                    <td className="text-sm text-muted">{a.resume_file_name || '—'}</td>
                    <td><span className={`score-badge ${scoreClass(a.overall_score)}`}>{a.overall_score}%</span></td>
                    <td className="text-sm">{a.skills_score}%</td>
                    <td className="text-sm">{a.ats_score}%</td>
                    <td className="text-sm text-muted">{fmt(a.created_at)}</td>
                    <td>
                      <Link to={`/analysis/${a.id}`} className="btn btn-secondary btn-sm" id={`view-analysis-${a.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
