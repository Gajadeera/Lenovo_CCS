const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    job_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    serial_number: {
        type: String,
        required: true,
        trim: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    },
    job_type: {
        type: String,
        enum: ['workshop', 'onsite', 'remote'],
        required: true
    },
    warranty_status: {
        type: String,
        enum: ['In Warranty', 'Out of Warranty'],
        default: 'In Warranty'
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    attachments: [{
        url: { type: String, required: true, trim: true },
        public_id: { type: String, required: true, trim: true },
        type: {
            type: String,
            required: true,
            enum: ['image', 'document', 'report', 'other']
        },
        name: { type: String, trim: true },
        uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: [
            'Pending Assignment',
            'Assigned',
            'In Progress',
            'On Hold',
            'Awaiting Workshop Repair',
            'Closed',
            'Reopened'
        ],
        default: 'Pending Assignment'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    scheduled_date: Date,
    completed_date: Date,
    is_ad_hoc_customer: {
        type: Boolean,
        default: false
    },
    is_ad_hoc_device: {
        type: Boolean,
        default: false
    },
    previous_assignments: [{
        technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assigned_at: Date,
        unassigned_at: Date
    }]
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

jobSchema.index({ customer: 1 });
jobSchema.index({ device: 1 });
jobSchema.index({ serial_number: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ priority: 1 });
jobSchema.index({ assigned_to: 1 });
jobSchema.index({ created_by: 1 });
jobSchema.index({ is_ad_hoc_customer: 1 });
jobSchema.index({ is_ad_hoc_device: 1 });
jobSchema.index({ scheduled_date: 1 });
jobSchema.index({ completed_date: 1 });
jobSchema.index({ 'attachments.type': 1 });
jobSchema.index({
    job_number: 'text',
    serial_number: 'text',
    description: 'text'
}, {
    name: 'jobs_text_search_index',
    weights: {
        job_number: 3,
        serial_number: 2,
        description: 1
    }
});


jobSchema.virtual('primary_image').get(function () {
    if (!this.attachments) return null;
    const img = this.attachments.find(a => a.type === 'image');
    return img ? img.url : null;
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);