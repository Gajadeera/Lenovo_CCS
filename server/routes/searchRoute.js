const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddlware');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');
const { User, Customer, Device, Job, PartsRequest, SystemIssue } = require('../models');

router.get(
    '/',
    auth.authentication(),
    [
        check('query', 'Search query is required').not().isEmpty(),
        check('collection', 'Invalid collection').optional().isIn([
            'customers', 'devices', 'jobs', 'users',
            'parts_requests', 'system_issues', 'activity_logs'
        ])
    ],
    async (req, res, next) => {
        res.set('Cache-Control', 'no-store, max-age=0');
        res.set('Pragma', 'no-cache');
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Validation Error', errors.array());
            }

            const { query, collection } = req.query;
            const user = req.user;

            let results = [];

            if (collection) {
                if (!canSearchCollection(collection, user.role)) {
                    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to search this collection');
                }
                results = await searchSpecificCollection(collection, query, user);
            } else {
                results = await globalSearch(query, user);
            }

            res.json(results);
        } catch (err) {
            next(err);
        }
    }
);

function canSearchCollection(collection, role) {
    const collectionPermissions = {
        customers: ['administrator', 'manager', 'coordinator'],
        devices: ['administrator', 'manager', 'coordinator', 'technician'],
        jobs: ['administrator', 'manager', 'coordinator', 'technician', 'parts_team'],
        users: ['administrator', 'manager'],
        parts_requests: ['administrator', 'manager', 'parts_team'],
        system_issues: ['administrator', 'manager'],
        activity_logs: ['administrator']
    };

    return collectionPermissions[collection]?.includes(role) || false;
}

async function searchSpecificCollection(collection, query, user) {
    switch (collection) {
        case 'customers':
            return await searchCustomers(query, user);
        case 'devices':
            return await searchDevices(query, user);
        case 'jobs':
            return await searchJobs(query, user);
        case 'users':
            return await searchUsers(query, user);
        case 'parts_requests':
            return await searchPartsRequests(query, user);
        case 'system_issues':
            return await searchSystemIssues(query, user);
        case 'activity_logs':
            return await searchActivityLogs(query, user);
        default:
            return [];
    }
}

async function globalSearch(query, user) {
    const results = {};
    const searchableCollections = [
        { name: 'customers', roles: ['administrator', 'manager', 'coordinator'] },
        { name: 'devices', roles: ['administrator', 'manager', 'coordinator', 'technician'] },
        { name: 'jobs', roles: ['administrator', 'manager', 'coordinator', 'technician', 'parts_team'] },
        { name: 'users', roles: ['administrator', 'manager'] },
        { name: 'parts_requests', roles: ['administrator', 'manager', 'parts_team'] },
        { name: 'system_issues', roles: ['administrator', 'manager'] }
    ];

    for (const collection of searchableCollections) {
        if (collection.roles.includes(user.role)) {
            results[collection.name] = await searchSpecificCollection(collection.name, query, user);
        }
    }

    return results;
}

async function searchCustomers(query, user) {
    const searchQuery = {
        $text: { $search: query }
    };

    if (user.role === 'coordinator') {
        searchQuery.is_ad_hoc = false;
    }

    return await Customer.find(searchQuery)
        .select('-__v -created_at -updated_at')
        .limit(10);
}

async function searchDevices(query, user) {
    const searchQuery = {
        $text: { $search: query }
    };

    if (user.role === 'technician') {
        searchQuery.is_ad_hoc = false;
    }

    return await Device.find(searchQuery)
        .populate('customer', 'name email phone')
        .select('-__v -created_at -updated_at')
        .limit(10);
}

async function searchJobs(query, user) {
    const searchQuery = {
        $text: { $search: query }
    };

    if (user.role === 'technician') {
        searchQuery.assigned_to = user._id;
        searchQuery.$or = [
            { is_ad_hoc_customer: false },
            { is_ad_hoc_customer: { $exists: false } }
        ];
    } else if (user.role === 'parts_team') {
        searchQuery.status = { $in: ['Assigned', 'In Progress'] };
    }

    return await Job.find(searchQuery)
        .populate('customer', 'name email phone')
        .populate('assigned_to', 'name email')
        .select('-__v -created_at -updated_at')
        .limit(10);
}

async function searchUsers(query, user) {
    if (!canSearchCollection('users', user.role)) {
        return [];
    }

    const cleanedQuery = query.trim().replace(/[+\-]/g, ' ');

    const users = await User.find(
        { $text: { $search: cleanedQuery } },
        {
            score: { $meta: "textScore" },
            name: 1,
            email: 1,
            phone: 1,
            role: 1,
            image: 1,
            last_login: 1
        }
    )
        .sort({ score: { $meta: "textScore" } })
        .select('-password -__v')
        .lean()
        .limit(10);

    return users.map(user => ({
        ...user,
        imageUrl: user.image?.url || null
    }));
}

async function searchPartsRequests(query, user) {
    const searchQuery = {
        $text: { $search: query }
    };

    if (user.role === 'parts_team') {
        searchQuery.requested_by = user._id;
    }

    return await PartsRequest.find(searchQuery)
        .populate('job_id', 'job_number')
        .populate('requested_by', 'name')
        .select('-__v')
        .limit(10);
}

async function searchSystemIssues(query, user) {
    const searchQuery = {
        $text: { $search: query }
    };

    if (!canSearchCollection('users', user.role)) {
        return [];
    }

    return await SystemIssue.find(searchQuery)
        .populate('reported_by', 'name')
        .populate('assigned_to', 'name')
        .select('-__v')
        .limit(10);
}

async function searchActivityLogs(query, user) {
    if (user.role !== 'administrator') {
        return [];
    }

    return await ActivityLog.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
    )
        .sort({ score: { $meta: "textScore" } })
        .limit(10);
}

module.exports = router;