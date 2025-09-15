const express = require('express');
const reportController = require('../controllers/reportController');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const activityLogger = require('../middlewares/activityLogger');

const router = express.Router();

router.use(authentication(), activityLogger);

router.post('/:model', authorization(['administrator', 'manager', 'coordinator']), reportController.generateReport);
router.get('/history', authorization(['administrator', 'manager', 'coordinator']), reportController.getReportHistory);
router.get('/:filename', authorization(['administrator', 'manager', 'coordinator']), reportController.downloadReport);

module.exports = router;