const AnalyticsService = require('../services/analyticsService');

const getJobAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getJobAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomerAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getCustomerAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDeviceAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getDeviceAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getUserAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPartsAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getPartsAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivityAnalytics = async (req, res) => {
    try {
        const result = await AnalyticsService.getActivityAnalytics(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTechnicianPerformance = async (req, res) => {
    try {
        const result = await AnalyticsService.getTechnicianPerformance(req.user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getJobAnalytics,
    getCustomerAnalytics,
    getDeviceAnalytics,
    getUserAnalytics,
    getPartsAnalytics,
    getActivityAnalytics,
    getTechnicianPerformance
};