const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * http client service for communicating with the fastapi ml microservice
 */
class MLClient {
  /**
   * sends resume text and job description to fastapi for ai analysis
   * @param {string} resumetext - extracted plain text from resume document
   * @param {string} jobdescription - target job description text
   * @param {string[]} requiredskills - optional explicit skills list from job template
   * @returns {promise<object>} - score breakdown, matched/missing skills, recommendations
   */
  static async analyze(resumeText, jobDescription, requiredSkills = []) {
    try {
      const response = await axios.post(
        `${ML_SERVICE_URL}/api/v1/analyze`,
        {
          resume_text: resumeText,
          job_description: jobDescription,
          required_skills: requiredSkills
        },
        {
          timeout: 30000, // 30s timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const err = new Error('The AI analysis service is currently unavailable. Please try again later.');
        err.statusCode = 503;
        err.errorCode = 'ML_SERVICE_UNAVAILABLE';
        throw err;
      }

      if (error.code === 'ECONNABORTED') {
        const err = new Error('The AI analysis service timed out while processing your request.');
        err.statusCode = 504;
        err.errorCode = 'ML_SERVICE_TIMEOUT';
        throw err;
      }

      const statusCode = error.response?.status || 500;
      const detail = error.response?.data?.detail || error.message || 'ML service error';
      const err = new Error(`AI analysis service returned an error: ${detail}`);
      err.statusCode = statusCode;
      err.errorCode = 'ML_SERVICE_ERROR';
      throw err;
    }
  }

  /**
   * checks if fastapi ml service is reachable
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch {
      return { status: 'offline', model_loaded: false };
    }
  }
}

module.exports = MLClient;
