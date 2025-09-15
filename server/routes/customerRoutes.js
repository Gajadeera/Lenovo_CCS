const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authentication, authorization } = require('../middlewares/authMiddlware');

router.use(authentication());

router.post('/', authorization(['administrator', 'manager']), customerController.createCustomer);
router.get('/', authorization(['administrator', 'manager', 'coordinator']), customerController.getAllCustomers);
router.get('/:id', authorization(['administrator', 'manager', 'coordinator']), customerController.getCustomer);
router.put('/:id', authorization(['administrator', 'manager', 'coordinator']), customerController.updateCustomer);
router.delete('/:id', authorization(['administrator', 'manager', 'coordinator']), customerController.deleteCustomer);

module.exports = router;