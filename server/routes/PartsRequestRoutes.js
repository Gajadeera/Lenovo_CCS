const express = require('express');
const router = express.Router();
const partsRequestController = require('../controllers/partsRequestController');
const upload = require('../middlewares/upload');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const multer = require('multer');

router.use(authentication());

router.post('/', authorization(['parts_team', 'manager', 'technician']), upload.array('attachments'), partsRequestController.createPartsRequest);
router.get('/', partsRequestController.getAllPartsRequests);
router.get('/job/:jobId', partsRequestController.getPartsRequestsByJob);
router.get('/requester/:userId', partsRequestController.getPartsRequestsByRequester);
router.get('/:requestId', partsRequestController.getPartsRequest);
router.put('/:id', authorization(['parts_team', 'manager']), upload.array('attachments'), partsRequestController.updatePartsRequest);
router.patch('/:id/approve', authorization(['parts_team', 'manager']), partsRequestController.approvePartsRequest);
router.patch('/:id/reject', authorization(['parts_team', 'manager']), partsRequestController.rejectPartsRequest);
router.patch('/:id/fulfill', authorization(['parts_team', 'manager']), partsRequestController.fulfillPartsRequest);
router.delete('/:id', authorization(['parts_team', 'manager']), partsRequestController.deletePartsRequest);

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 5 files allowed.'
            });
        }
    } else if (err.message.includes('Only images')) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next(err);
});

module.exports = router;