const express = require('express');
const router = express.Router();
const AnalysisController = require('../controllers/analysis.controller');
const authenticateToken = require('../middleware/auth.middleware');

/**
 * protected analysis routes (requires jwt auth token)
 */
router.use(authenticateToken);

router.get('/stats', AnalysisController.getDashboardStats);
router.get('/ml-health', AnalysisController.checkMLHealth);
router.post('/', AnalysisController.createAnalysis);
router.get('/', AnalysisController.getMyAnalyses);
router.get('/:id', AnalysisController.getAnalysisById);

module.exports = router;
