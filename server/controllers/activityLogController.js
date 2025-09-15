const ActivityService = require('../services/activityService');

const getActivityLogs = async (req, res, next) => {
    try {
        const logs = await ActivityService.getActivityLogs(req.query, req.user);
        res.status(200).json(logs);
    } catch (error) {
        next(error);
    }
};

const getUserActivitySummary = async (req, res, next) => {
    try {
        const summary = await ActivityService.getUserActivitySummary(req.query, req.user);
        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

// Optional: Additional controller methods if you add more service methods
const getRecentActivities = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        const activities = await ActivityService.getRecentActivities(parseInt(limit));
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getActivityLogs,
    getUserActivitySummary,
    getRecentActivities // Optional: if you add this method to the service
};