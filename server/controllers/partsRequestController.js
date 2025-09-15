const partsRequestService = require('../services/partsRequestService');

const createPartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.createPartsRequest(
            req.body,
            req.files,
            req.user
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const getAllPartsRequests = async (req, res, next) => {
    try {
        const result = await partsRequestService.getAllPartsRequests(
            req.query,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getPartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.getPartsRequest(
            req.params.requestId,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getPartsRequestsByJob = async (req, res, next) => {
    try {
        const result = await partsRequestService.getPartsRequestsByJob(
            req.params.jobId,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getPartsRequestsByRequester = async (req, res, next) => {
    try {
        const result = await partsRequestService.getPartsRequestsByRequester(
            req.params.userId,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const updatePartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.updatePartsRequest(
            req.params.id,
            req.body,
            req.files,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const approvePartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.approvePartsRequest(
            req.params.id,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const rejectPartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.rejectPartsRequest(
            req.params.id,
            req.body.rejection_reason,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const fulfillPartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.fulfillPartsRequest(
            req.params.id,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deletePartsRequest = async (req, res, next) => {
    try {
        const result = await partsRequestService.deletePartsRequest(
            req.params.id,
            req.user
        );
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPartsRequest,
    getAllPartsRequests,
    getPartsRequest,
    getPartsRequestsByJob,
    getPartsRequestsByRequester,
    updatePartsRequest,
    approvePartsRequest,
    rejectPartsRequest,
    fulfillPartsRequest,
    deletePartsRequest,
};