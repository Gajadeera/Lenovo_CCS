const UserService = require('../services/userService');

const signup = async (req, res, next) => {
    try {
        const result = await UserService.signup(req.body, req.file, req.user);
        res.status(201).send(result);
    } catch (error) {
        next(error);
    }
};

const signin = async (req, res, next) => {
    try {
        const result = await UserService.signin(req.body.email, req.body.password, req.ip);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const result = await UserService.getProfile(req.user._id);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const result = await UserService.updateProfile(req.user._id, req.body, req.file, req.user);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const result = await UserService.getAllUsers(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const result = await UserService.getUserById(req.params.userId);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const result = await UserService.updateUser(req.params.userId, req.body, req.file, req.user);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const result = await UserService.deleteUser(req.params.userId, req.user);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
};

const getUserCounts = async (req, res, next) => {
    try {
        const result = await UserService.getUserCounts();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getUserActivity = async (req, res, next) => {
    try {
        const result = await UserService.getUserActivity();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getRoleDistribution = async (req, res, next) => {
    try {
        const result = await UserService.getRoleDistribution();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getUserGrowth = async (req, res, next) => {
    try {
        const result = await UserService.getUserGrowth(req.query.period);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const uploadProfileImage = async (req, res, next) => {
    try {
        const result = await UserService.uploadProfileImage(req.user._id, req.file);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    signin,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserCounts,
    getUserActivity,
    getRoleDistribution,
    getUserGrowth,
    uploadProfileImage
};