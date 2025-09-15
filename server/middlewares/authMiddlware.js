const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const config = require('../config/config');
const User = require('../models/User');

const authentication = () => {
    return async (req, res, next) => {
        try {
            if (req.path === '/signin' && req.method === 'POST') {
                return next();
            }

            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
            }

            const decoded = jwt.verify(token, config.jwt.secret);

            const user = await User.findById(decoded.id);
            if (!user) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'User belonging to this token no longer exists');
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
            }
            if (error.name === 'TokenExpiredError') {
                return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
            }
            next(error);
        }
    };
};

const authorization = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
            }

            if (!roles.includes(req.user.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authentication,
    authorization
};