const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobRoutes = require('./routes/job.routes');
const analysisRoutes = require('./routes/analysis.routes');
const errorHandler = require('./middleware/errorHandler');
const { errorResponse } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5000;

// enable core middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// register api routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analyses', analysisRoutes);

// handle 404 unmatched routes
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`, 'NOT_FOUND');
});

// centralized error handling middleware
app.use(errorHandler);

if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Express Backend] Running on http://localhost:${PORT}`);
    console.log(`[Express Backend] ML Service target: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
  });
}

module.exports = app;
