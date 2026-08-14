import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyResumes, uploadResume, deleteResume } from '../services/api';

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ResumesPage() {
  const fileInputRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResumes = () => {
    getMyResumes()
      .then(r => setResumes(r.data.data?.resumes || []))
      .catch(() => setError('Could not load resumes.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchResumes, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) { setError('Only PDF or DOCX files are supported.'); return; }
    setError(''); setSuccess(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      await uploadResume(fd, (ev) => {
        if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
      });
      setSuccess('Resume uploaded successfully!');
      fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false); setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteResume(id);
      setSuccess(`"${name}" deleted.`);
      setResumes(r => r.filter(x => x.id !== id));
    } catch { setError('Could not delete resume. Please try again.'); }
  };

  if (loading) return (
    <div className="loading-wrap"><div className="spinner" /><span className="loading-text">Loading resumes…</span></div>
  );

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>My Resumes</h2>
          <p>Upload, manage, and select resumes for AI analysis.</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} id="resume-file-input" onChange={handleFile} />
          <button
            id="upload-resume-btn"
            className="btn btn-primary btn-sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? `Uploading ${uploadProgress}%…` : '+ Upload Resume'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {resumes.length === 0 ? (
        <div className="empty-state">
          <h3>No resumes uploaded yet</h3>
          <p>Upload a PDF or DOCX to get started with AI resume analysis.</p>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th>Text Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.file_name}</strong></td>
                    <td className="text-sm text-muted">{r.file_type?.toUpperCase()}</td>
                    <td className="text-sm text-muted">{fmt(r.created_at)}</td>
                    <td>
                      <span className={`score-badge ${r.extracted_text ? 'score-high' : 'score-low'}`}>
                        {r.extracted_text ? 'Extracted' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link to="/analyze" className="btn btn-secondary btn-sm" state={{ resumeId: r.id }}>
                          Analyze
                        </Link>
                        <button
                          id={`delete-resume-${r.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(r.id, r.file_name)}
                        >
                          Delete
                        </button>
                      </div>
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
