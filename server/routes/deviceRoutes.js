const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authentication, authorization } = require('../middlewares/authMiddlware');

router.use(authentication());

router.post('/', authorization(['administrator', 'manager', 'coordinator']), deviceController.createDevice);
router.get('/', deviceController.getAllDevices);
router.get('/warranty-check/:serial', authorization(['administrator', 'manager', 'coordinator']), deviceController.warrantyCheck);

router.get('/:id', deviceController.getDevice);
router.put('/:id', authorization(['administrator', 'manager', 'coordinator']), deviceController.updateDevice);
router.delete('/:id', authorization(['administrator', 'manager']), deviceController.deleteDevice);

module.exports = router;