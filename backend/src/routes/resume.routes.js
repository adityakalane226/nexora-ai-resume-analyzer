const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const authenticateToken = require('../middleware/auth.middleware');
const ResumeController = require('../controllers/resume.controller');

/**
 * protected resume routes (requires auth token)
 */
router.use(authenticateToken);

router.post('/upload', upload.single('resume'), ResumeController.uploadResume);
router.get('/', ResumeController.getMyResumes);
router.get('/:id', ResumeController.getResumeById);

module.exports = router;
