const path = require('path');
const ResumeModel = require('../models/resume.model');
const ExtractionService = require('../services/extraction.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * controller handling resume file uploads, text extractions, and queries
 */
class ResumeController {
  /**
   * upload resume document (.pdf / .docx) and extract text
   */
  static async uploadResume(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 400, 'No resume file uploaded', 'MISSING_FILE');
      }

      const userId = req.user.id;
      const fileName = req.file.originalname;
      const filePath = `/uploads/${req.file.filename}`;
      const absolutePath = req.file.path;
      const fileType = path.extname(fileName).replace('.', '').toLowerCase();

      // 1. perform text extraction
      const extractedText = await ExtractionService.extractText(absolutePath);

      // 2. insert resume record into postgresql
      const resume = await ResumeModel.createResume({
        userId,
        fileName,
        filePath,
        fileType,
        extractedText
      });

      return successResponse(res, 201, 'Resume uploaded and text extracted successfully', {
        resume: {
          id: resume.id,
          fileName: resume.file_name,
          filePath: resume.file_path,
          fileType: resume.file_type,
          extractedTextLength: extractedText.length,
          extractedTextPreview: extractedText.substring(0, 300) + '...',
          createdAt: resume.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get list of resumes uploaded by authenticated user
   */
  static async getMyResumes(req, res, next) {
    try {
      const userId = req.user.id;
      const resumes = await ResumeModel.findByUserId(userId);
      return successResponse(res, 200, 'Resumes fetched successfully', { resumes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get specific resume details by id
   */
  static async getResumeById(req, res, next) {
    try {
      const resumeId = req.params.id;
      const resume = await ResumeModel.findById(resumeId);

      if (!resume) {
        return errorResponse(res, 404, 'Resume record not found', 'NOT_FOUND');
      }

      // verify ownership
      if (resume.user_id !== req.user.id) {
        return errorResponse(res, 403, 'Unauthorized access to resume record', 'FORBIDDEN');
      }

      return successResponse(res, 200, 'Resume fetched successfully', { resume });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ResumeController;
