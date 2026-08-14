import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResumes, uploadResume, getJobs, createAnalysis } from '../services/api';

const STEPS = [
  'Extracting text from resume…',
  'Computing TF-IDF similarity…',
  'Running AI scoring model…',
  'Evaluating skill match…',
  'Saving results to database…',
  'Analysis complete!'
];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // form state
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [jobMode, setJobMode] = useState('template'); // 'template' | 'manual'
  const [selectedJob, setSelectedJob] = useState('');
  const [manualJobTitle, setManualJobTitle] = useState('');
  const [manualJobDesc, setManualJobDesc] = useState('');
  const [dragging, setDragging] = useState(false);

  // analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyResumes().then(r => setResumes(r.data.data?.resumes || [])).catch(() => {});
    getJobs().then(r => setJobs(r.data.data?.jobs || [])).catch(() => {});
  }, []);

  const handleFileDrop = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) { setError('Only PDF or DOCX files are accepted.'); return; }
    setResumeFile(file);
    setError('');
  };

  const handleFileInput = (e) => handleFileDrop(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFileDrop(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const uploadAndGetResumeId = async () => {
    if (selectedResume) return parseInt(selectedResume, 10);
    if (!resumeFile) throw Object.assign(new Error('Please select or upload a resume.'), { isUser: true });
    setIsUploading(true);
    const fd = new FormData();
    fd.append('resume', resumeFile);
    const { data } = await uploadResume(fd, (ev) => {
      if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
    });
    setIsUploading(false);
    return data.data.resume.id;
  };

  const simulateSteps = () => {
    setCurrentStep(0);
    STEPS.forEach((_, i) => {
      setTimeout(() => setCurrentStep(i), i * 950);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (jobMode === 'template' && !selectedJob) { setError('Please select a job template.'); return; }
    if (jobMode === 'manual' && (!manualJobDesc || manualJobDesc.trim().length < 15)) {
      setError('Please enter a job description (minimum 15 characters).'); return;
    }

    setIsAnalyzing(true);
    simulateSteps();

    try {
      const resumeId = await uploadAndGetResumeId();
      const payload = {
        resumeId,
        ...(jobMode === 'template'
          ? { jobId: parseInt(selectedJob, 10) }
          : { jobDescription: manualJobDesc, jobTitle: manualJobTitle || 'Target Role' })
      };
      const { data } = await createAnalysis(payload);
      navigate(`/analysis/${data.data.analysisId}`);
    } catch (err) {
      setIsAnalyzing(false);
      setCurrentStep(0);
      if (err.isUser) { setError(err.message); return; }
      setError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Analyze Resume</h2>
        <p>Upload your resume and provide a job description to receive an AI-powered match score.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isAnalyzing ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="loading-wrap">
            <div className="spinner" />
            <strong style={{ fontSize: '0.9rem' }}>Running AI Analysis…</strong>
          </div>
          <ul className="process-steps">
            {STEPS.map((step, i) => (
              <li key={i} className={`process-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                <svg className="step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {i < currentStep
                    ? <><path d="M20 6L9 17l-5-5"/></>
                    : i === currentStep
                    ? <circle cx="12" cy="12" r="4"/>
                    : <circle cx="12" cy="12" r="4" strokeOpacity="0.3"/>}
                </svg>
                {step}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 620 }}>
          {/* step 1: resume selection */}
          <div className="card mb-2">
            <div className="section-title">Step 1 — Choose Resume</div>
            {resumes.length > 0 && (
              <div className="form-group">
                <label className="form-label" htmlFor="resume-select">Use a previously uploaded resume</label>
                <select id="resume-select" className="form-select"
                  value={selectedResume} onChange={e => { setSelectedResume(e.target.value); setResumeFile(null); }}>
                  <option value="">— Select resume —</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.file_name}</option>
                  ))}
                </select>
              </div>
            )}
            {!selectedResume && (
              <>
                {resumes.length > 0 && (
                  <div className="flex items-center gap-1" style={{ margin: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <div className="divider" style={{ flex: 1, margin: 0 }}/>
                    <span style={{ padding: '0 0.5rem' }}>or upload a new one</span>
                    <div className="divider" style={{ flex: 1, margin: 0 }}/>
                  </div>
                )}
                <div
                  className={`upload-zone ${dragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  id="resume-upload-zone"
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileInput} />
                  <svg className="upload-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {resumeFile
                    ? <p className="upload-file-name">{resumeFile.name}</p>
                    : <><p>Click to browse or drag & drop</p><p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PDF or DOCX · Max 5 MB</p></>}
                </div>
                {isUploading && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="score-bar-track">
                      <div className="score-bar-fill high" style={{ width: `${uploadProgress}%` }}/>
                    </div>
                    <p className="form-hint">Uploading… {uploadProgress}%</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* step 2: job description */}
          <div className="card mb-2">
            <div className="section-title">Step 2 — Job Description</div>
            <div className="tab-bar">
              <button type="button" id="tab-template" className={`tab-btn ${jobMode === 'template' ? 'active' : ''}`}
                onClick={() => setJobMode('template')}>Use Job Template</button>
              <button type="button" id="tab-manual" className={`tab-btn ${jobMode === 'manual' ? 'active' : ''}`}
                onClick={() => setJobMode('manual')}>Paste Description</button>
            </div>

            {jobMode === 'template' ? (
              <div className="form-group">
                <label className="form-label" htmlFor="job-template-select">Select a Job Template</label>
                <select id="job-template-select" className="form-select" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                  <option value="">— Select a role —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                {jobs.length === 0 && <p className="form-hint">No job templates found. Switch to "Paste Description" to enter one manually.</p>}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="manual-job-title">Job Title (optional)</label>
                  <input id="manual-job-title" type="text" className="form-input" placeholder="e.g. Senior Software Engineer"
                    value={manualJobTitle} onChange={e => setManualJobTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="manual-job-desc">Job Description <span style={{ color: 'var(--error)' }}>*</span></label>
                  <textarea id="manual-job-desc" className="form-textarea" rows={6}
                    placeholder="Paste the full job description here…"
                    value={manualJobDesc} onChange={e => setManualJobDesc(e.target.value)} />
                  <span className="form-hint">{manualJobDesc.length} characters</span>
                </div>
              </>
            )}
          </div>

          <button id="analyze-submit-btn" type="submit" className="btn btn-primary btn-lg" disabled={isAnalyzing}>
            Run AI Analysis
          </button>
        </form>
      )}
    </>
  );
}
