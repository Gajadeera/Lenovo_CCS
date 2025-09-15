const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const upload = require('../middlewares/upload');
const { authentication, authorization } = require('../middlewares/authMiddlware');
const multer = require('multer');

router.use(authentication());

router.post('/', authorization(['administrator', 'manager', 'coordinator']), upload.array('documents'), jobController.createJob);
router.get('/', jobController.getAllJobs);
router.get('/customer/:id', jobController.getJobsByCustomer);
router.get('/technician/:id', authorization(['administrator', 'manager', 'coordinator', 'technician']), jobController.getJobsByTechnician);
router.get('/:id', jobController.getJob);
router.put('/:id', upload.array('documents'), jobController.updateJob);
router.patch('/:id/status', jobController.updateJobStatus);
router.patch('/:id/assign', authorization(['administrator', 'manager', 'coordinator']), jobController.assignJobToTechnician);
router.delete('/:id', authorization(['manager']), jobController.deleteJob);

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