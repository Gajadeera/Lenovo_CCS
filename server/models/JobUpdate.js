const mongoose = require('mongoose');

const jobUpdateSchema = new mongoose.Schema({
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    update_text: {
        type: String,
        trim: true
    },
    update_timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: false
});

jobUpdateSchema.index({ job_id: 1 });
jobUpdateSchema.index({ updated_by: 1 });
jobUpdateSchema.index({ update_timestamp: -1 });
jobUpdateSchema.index({ job_id: 1, update_timestamp: -1 });

module.exports = mongoose.models.JobUpdate || mongoose.model('JobUpdate', jobUpdateSchema);