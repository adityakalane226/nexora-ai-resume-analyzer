const JobModel = require('../models/job.model');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * controller handling job description template operations
 */
class JobController {
  /**
   * list all available target job descriptions
   */
  static async getAllJobs(req, res, next) {
    try {
      const jobs = await JobModel.findAll();
      return successResponse(res, 200, 'Job description templates fetched successfully', { jobs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get specific job description details by id
   */
  static async getJobById(req, res, next) {
    try {
      const jobId = req.params.id;
      const job = await JobModel.findById(jobId);

      if (!job) {
        return errorResponse(res, 404, 'Job description not found', 'NOT_FOUND');
      }

      return successResponse(res, 200, 'Job description fetched successfully', { job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * create custom job description
   */
  static async createJob(req, res, next) {
    try {
      const { title, company, description, requiredSkills, experienceYears, educationLevel } = req.body;

      const job = await JobModel.createJob({
        title,
        company,
        description,
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
        experienceYears: parseInt(experienceYears || 0, 10),
        educationLevel
      });

      return successResponse(res, 201, 'Job description created successfully', { job });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobController;
