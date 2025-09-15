const DeviceService = require('../services/deviceService');

const createDevice = async (req, res, next) => {
    try {
        const device = await DeviceService.createDevice(req.body, req.user);
        res.status(201).json(device);
    } catch (error) {
        next(error);
    }
};

const getAllDevices = async (req, res, next) => {
    try {
        const result = await DeviceService.getAllDevices(req.query);

        // Handle different return types based on all flag
        if (req.query.all === 'true') {
            res.json(result);
        } else {
            res.json(result);
        }
    } catch (error) {
        next(error);
    }
};

const getDevice = async (req, res, next) => {
    try {
        const device = await DeviceService.getDevice(req.params.id);
        res.json(device);
    } catch (error) {
        next(error);
    }
};

const updateDevice = async (req, res, next) => {
    try {
        const device = await DeviceService.updateDevice(req.params.id, req.body, req.user);
        res.json(device);
    } catch (error) {
        next(error);
    }
};

const deleteDevice = async (req, res, next) => {
    try {
        const result = await DeviceService.deleteDevice(req.params.id, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const warrantyCheck = async (req, res, next) => {
    try {
        const result = await DeviceService.warrantyCheck(req.params.serial, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDevice,
    getAllDevices,
    getDevice,
    updateDevice,
    deleteDevice,
    warrantyCheck
};