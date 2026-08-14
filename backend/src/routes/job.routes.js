const express = require('express');
const router = express.Router();
const JobController = require('../controllers/job.controller');
const { validateJobCreation } = require('../validators/job.validator');
const authenticateToken = require('../middleware/auth.middleware');

/**
 * protected job routes (requires auth token)
 */
router.use(authenticateToken);

router.get('/', JobController.getAllJobs);
router.get('/:id', JobController.getJobById);
router.post('/', validateJobCreation, JobController.createJob);

module.exports = router;
