const express = require('express');
const router = express.Router();
const analyticsRoutes = require('./analyticsRoutes');
const customerRoutes = require('./customerRoutes');
const deviceRoutes = require('./deviceRoutes');
const jobRoutes = require('./jobRoutes');
const partsRequestRoutes = require('./PartsRequestRoutes');
const SystemIssueRoutes = require('./systemIssueRoutes');
const userRoutes = require('./userRoutes');
const activityRoutes = require('./activityRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/analytics', analyticsRoutes);
router.use('/customers', customerRoutes);
router.use('/devices', deviceRoutes);
router.use('/jobs', jobRoutes);
router.use('/parts-requests', partsRequestRoutes);
router.use('/system-issues', SystemIssueRoutes);
router.use('/users', userRoutes);
router.use('/search', require('./searchRoute'));
router.use('/activity', activityRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;