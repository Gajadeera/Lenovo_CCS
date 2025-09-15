const express = require('express');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const activityLogger = require('../middlewares/activityLogger');
const systemIssueController = require('../controllers/systemIssueController');
const upload = require('../middlewares/upload'); // Import multer

const router = express.Router();

router.use(authentication(), activityLogger);

// Apply multer middleware for file uploads
router.post('/',
    authorization(['administrator', 'manager', 'coordinator', 'technician', 'parts_team']),
    upload.array('screenshots', 5), // Handle up to 5 files
    systemIssueController.createSystemIssue
);

router.get('/',
    authorization(['administrator', 'manager', 'coordinator']),
    systemIssueController.getAllSystemIssues
);

router.get('/stats',
    authorization(['administrator', 'manager']),
    systemIssueController.getIssueStats
);

router.get('/:issueId',
    authorization(['administrator', 'manager', 'coordinator', 'technician', 'parts_team']),
    systemIssueController.getSystemIssue
);

router.patch('/:issueId',
    authorization(['administrator', 'manager']),
    upload.array('screenshots', 5), // Handle up to 5 files
    systemIssueController.updateSystemIssue
);

router.delete('/:issueId',
    authorization(['administrator', 'manager', 'coordinator', 'technician']),
    systemIssueController.deleteSystemIssue
);

module.exports = router;