const express = require('express');
const activityLogController = require('../controllers/activityLogController');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const router = express.Router();

router.use(authentication());

router.get(
    '/logs',
    authorization(['administrator', 'manager', 'auditor']),
    activityLogController.getActivityLogs
);

router.get(
    '/summary',
    authorization(['administrator']),
    activityLogController.getUserActivitySummary
);

module.exports = router;