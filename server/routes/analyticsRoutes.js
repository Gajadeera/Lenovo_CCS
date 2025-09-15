const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const router = express.Router();

router.use(authentication());

router.get('/job-analytics', authorization(['manager', 'coordinator']), analyticsController.getJobAnalytics);

router.get('/customer-analytics', authorization(['administrator', 'manager', 'coordinator']), analyticsController.getCustomerAnalytics);

router.get('/device-analytics', authorization(['administrator', 'manager', 'technician', 'coordinator']), analyticsController.getDeviceAnalytics);

router.get('/technician-performance', authorization(['administrator', 'manager', 'coordinator']), analyticsController.getTechnicianPerformance);

router.get('/parts-analytics', authorization(['administrator', 'manager', 'parts_team', 'coordinator']), analyticsController.getPartsAnalytics);

router.get('/user-analytics', authorization(['administrator']), analyticsController.getUserAnalytics);
router.get('/activity-analytics', authorization(['administrator', 'manager']), analyticsController.getActivityAnalytics);

module.exports = router;