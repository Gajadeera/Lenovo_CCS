const ActivityLog = require('../models/ActivityLog');

const activityLogger = async (req, res, next) => {
    try {
        if (!req.user) return next();

        const actionMap = {
            'POST': 'create',
            'GET': 'view',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete'
        };

        const entityMap = {
            '/users': 'user',
            '/customers': 'customer',
            '/devices': 'device',
            '/jobs': 'job',
            '/parts-requests': 'parts_request',
            '/system-issues': 'system_issue'
        };

        const basePath = req.baseUrl + req.path;
        let entityType = '';
        let entityId = req.params.userId || req.params.id || null;

        for (const [path, type] of Object.entries(entityMap)) {
            if (basePath.includes(path)) {
                entityType = type;
                break;
            }
        }

        const excludedRoutes = [
            '/profile',
            '/change-password',
            '/activity-logs'
        ];

        if (excludedRoutes.some(route => basePath.includes(route))) {
            return next();
        }

        const logEntry = {
            user_id: req.user._id,
            user_name: req.user.name,
            user_role: req.user.role,
            action: actionMap[req.method] || req.method.toLowerCase(),
            entity_type: entityType,
            entity_id: entityId,
            details: {
                route: basePath,
                method: req.method,
                params: req.params,
                query: req.query,
                body: req.method === 'GET' ? null : req.body
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            timestamp: new Date()
        };

        ActivityLog.create(logEntry).catch(err => console.error('Activity log error:', err));

        next();
    } catch (err) {
        console.error('Activity logging middleware error:', err);
        next();
    }
};

module.exports = activityLogger;