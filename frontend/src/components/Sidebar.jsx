import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// svg icons (minimal inline)
const icons = {
  dashboard: (
    <svg xmlns="http:// www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none" stroke="currentcolor" strokewidth="1.75" strokelinecap="round" strokelinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  analyze: (
    <svg xmlns="http:// www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none" stroke="currentcolor" strokewidth="1.75" strokelinecap="round" strokelinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  ),
  history: (
    <svg xmlns="http:// www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none" stroke="currentcolor" strokewidth="1.75" strokelinecap="round" strokelinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  resumes: (
    <svg xmlns="http:// www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none" stroke="currentcolor" strokewidth="1.75" strokelinecap="round" strokelinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  logout: (
    <svg xmlns="http:// www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none" stroke="currentcolor" strokewidth="1.75" strokelinecap="round" strokelinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Nexora</h1>
        <span>AI Resume Analyzer</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          {icons.dashboard} Dashboard
        </NavLink>
        <NavLink to="/analyze" className={({ isActive }) => isActive ? 'active' : ''}>
          {icons.analyze} Analyze Resume
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
          {icons.history} Analysis History
        </NavLink>
        <NavLink to="/resumes" className={({ isActive }) => isActive ? 'active' : ''}>
          {icons.resumes} My Resumes
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.name || 'User'}</strong>
          {user?.email}
        </div>
        <button className="btn btn-secondary btn-sm btn-full" onClick={handleLogout} id="logout-btn">
          {icons.logout} Sign Out
        </button>
      </div>
    </aside>
  );
}
