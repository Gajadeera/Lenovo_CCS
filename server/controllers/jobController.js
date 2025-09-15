const JobService = require('../services/jobService');

const createJob = async (req, res, next) => {
    try {
        const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const result = await JobService.createJob(bodyData, req.files, req.user);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const updateJob = async (req, res, next) => {
    try {
        const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const result = await JobService.updateJob(req.params.id, bodyData, req.files, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteJob = async (req, res, next) => {
    try {
        const result = await JobService.deleteJob(req.params.id, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const assignJobToTechnician = async (req, res, next) => {
    try {
        const result = await JobService.assignJobToTechnician(req.params.id, req.body, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const updateJobStatus = async (req, res, next) => {
    try {
        const result = await JobService.updateJobStatus(req.params.id, req.body, req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getAllJobs = async (req, res, next) => {
    try {
        const result = await JobService.getAllJobs(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getJobsByCustomer = async (req, res, next) => {
    try {
        const result = await JobService.getJobsByCustomer(req.params.customerId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getJobsByTechnician = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const result = await JobService.getJobsByTechnician(id, parseInt(page), parseInt(limit));
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getJob = async (req, res, next) => {
    try {
        const result = await JobService.getJob(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createJob,
    updateJob,
    deleteJob,
    assignJobToTechnician,
    updateJobStatus,
    getAllJobs,
    getJobsByCustomer,
    getJobsByTechnician,
    getJob,
};