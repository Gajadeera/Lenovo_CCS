const CustomerService = require('../services/customerService');

const createCustomer = async (req, res, next) => {
    try {
        const customer = await CustomerService.createCustomer(req.body, req.user);
        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
};

const getAllCustomers = async (req, res, next) => {
    try {
        const result = await CustomerService.getAllCustomers(req.query);

        if (req.query.all === 'true') {
            res.json(result);
        } else {
            res.json(result);
        }
    } catch (error) {
        next(error);
    }
};

const getCustomer = async (req, res, next) => {
    try {
        const customer = await CustomerService.getCustomer(req.params.id);
        res.json(customer);
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const customer = await CustomerService.updateCustomer(req.params.id, req.body, req.user);
        res.json(customer);
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const result = await CustomerService.deleteCustomer(req.params.id, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer
};