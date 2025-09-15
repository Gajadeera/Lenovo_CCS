const SystemIssueService = require('../services/systemIssueService');
const ApiError = require('../utils/apiError');

const createSystemIssue = async (req, res, next) => {
    try {
        const result = await SystemIssueService.createSystemIssue(req.body, req.files, req.user);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const getAllSystemIssues = async (req, res, next) => {
    try {
        const result = await SystemIssueService.getAllSystemIssues(req.query, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getSystemIssue = async (req, res, next) => {
    try {
        const result = await SystemIssueService.getSystemIssue(req.params.issueId, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const updateSystemIssue = async (req, res, next) => {
    try {
        const result = await SystemIssueService.updateSystemIssue(
            req.params.issueId || req.params.id,
            req.body,
            req.files,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteSystemIssue = async (req, res, next) => {
    try {
        const result = await SystemIssueService.deleteSystemIssue(req.params.issueId, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getIssueStats = async (req, res, next) => {
    try {
        const result = await SystemIssueService.getIssueStats();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSystemIssue,
    getAllSystemIssues,
    getSystemIssue,
    updateSystemIssue,
    deleteSystemIssue,
    getIssueStats
};