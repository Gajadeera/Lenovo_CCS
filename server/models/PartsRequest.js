const mongoose = require('mongoose');

const partsRequestSchema = new mongoose.Schema({
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    requested_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parts_description: {
        type: String,
        trim: true
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
        uploaded_at: { type: Date, default: Date.now }
    }],
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'],
        default: 'Pending',
        required: true
    },
    requested_at: {
        type: Date,
        default: Date.now,
        required: true
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approved_at: {
        type: Date
    },
    rejection_reason: {
        type: String,
        trim: true
    },
    fulfillment_date: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

partsRequestSchema.index({ job_id: 1 });
partsRequestSchema.index({ requested_by: 1 });
partsRequestSchema.index({ status: 1 });
partsRequestSchema.index({ urgency: 1 });
partsRequestSchema.index({ requested_at: -1 });
partsRequestSchema.index({ approved_by: 1 });
partsRequestSchema.index({ fulfillment_date: 1 });
partsRequestSchema.index({ 'attachments.type': 1 });
partsRequestSchema.index({
    parts_description: 'text',
    notes: 'text'
}, {
    name: 'parts_requests_text_search_index'
});

partsRequestSchema.virtual('primary_image').get(function () {
    const img = this.attachments.find(a => a.type === 'image');
    return img ? img.url : null;
});

module.exports = mongoose.models.PartsRequest || mongoose.model('PartsRequest', partsRequestSchema);