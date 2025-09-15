const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authentication, authorization } = require('../middlewares/authMiddlware');

router.use(authentication());

router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear', notificationController.clearAllNotifications);

router.post('/', authorization(['administrator', 'manager']), notificationController.createNotification);
router.get('/user/:userId', authorization(['administrator', 'manager']), notificationController.getUserNotifications);
router.get('/:id', notificationController.getNotification);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', authorization(['administrator', 'manager']), notificationController.deleteNotification);
router.patch('/user/:userId/mark-all-read', authorization(['administrator', 'manager']), notificationController.markAllAsRead);
router.delete('/user/:userId/clear', authorization(['administrator', 'manager']), notificationController.clearAllNotifications);
router.get('/user/:userId/unread-count', authorization(['administrator', 'manager']), notificationController.getUnreadCount);

router.get('/all/list', authorization(['administrator', 'manager', 'coordinator']), notificationController.getAllNotifications);

module.exports = router;