const express = require('express');
const userController = require('../controllers/userController');
const activityLogController = require('../controllers/activityLogController');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const activityLogger = require('../middlewares/activityLogger');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/signin', userController.signin);
router.use(authentication(), activityLogger);

router.get('/profile', userController.getProfile);
router.put('/profile', upload.single('image'), userController.updateProfile);
router.post('/profile-image', upload.single('image'), userController.uploadProfileImage);

router.get('/counts', authorization(['administrator', 'manager']), userController.getUserCounts);
router.get('/activity', authorization(['administrator', 'manager']), userController.getUserActivity);
router.get('/role-distribution', authorization(['administrator', 'manager']), userController.getRoleDistribution);
router.get('/user-growth', authorization(['administrator', 'manager']), userController.getUserGrowth);

router.get('/activity-logs', authorization(['administrator']), activityLogController.getActivityLogs);
router.get('/activity-summary', authorization(['administrator']), activityLogController.getUserActivitySummary);

router.post('/signup', authorization(['administrator', 'manager']), upload.single('image'), userController.signup);
router.get('/', authorization(['administrator', 'manager', 'coordinator']), userController.getAllUsers);

router.get('/:userId', authorization(['administrator', 'manager']), userController.getUserById);
router.put('/:userId', authorization(['administrator', 'manager']), upload.single('image'), userController.updateUser);
router.delete('/:userId', authorization(['administrator']), userController.deleteUser);

module.exports = router;