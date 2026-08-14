import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

function scoreClass(s) {
  if (s >= 70) return 'score-high';
  if (s >= 45) return 'score-mid';
  return 'score-low';
}

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-text">Loading dashboard…</span>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {user?.name || 'User'}. Here's a summary of your activity.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* stats row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalAnalyses ?? '—'}</div>
          <div className="stat-label">Total Analyses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.averageScore ? `${stats.averageScore}%` : '—'}</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.bestScore ? `${stats.bestScore}%` : '—'}</div>
          <div className="stat-label">Best Score</div>
        </div>
      </div>

      {/* quick actions */}
      <div className="card mb-2">
        <div className="card-title">Quick Actions</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          <button id="dash-analyze-btn" className="btn btn-primary" onClick={() => navigate('/analyze')}>
            + Analyze New Resume
          </button>
          <Link to="/history" className="btn btn-secondary">View All Results</Link>
          <Link to="/resumes" className="btn btn-secondary">Manage Resumes</Link>
        </div>
      </div>

      {/* recent analyses */}
      <div className="card">
        <div className="card-title">Recent Analyses</div>
        {(!stats?.recentAnalyses || stats.recentAnalyses.length === 0) ? (
          <div className="empty-state">
            <h3>No analyses yet</h3>
            <p>Upload your resume and a job description to get an AI-powered score.</p>
            <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
              Analyze Resume
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Overall Score</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAnalyses.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.job_title || 'Unnamed Role'}</strong></td>
                    <td>
                      <span className={`score-badge ${scoreClass(a.overall_score)}`}>
                        {a.overall_score}%
                      </span>
                    </td>
                    <td className="text-sm text-muted">{fmt(a.created_at)}</td>
                    <td>
                      <Link to={`/analysis/${a.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
