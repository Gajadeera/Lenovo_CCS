const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    targetRoles: [{
        type: String,
        enum: ['coordinator', 'technician', 'manager', 'parts_team', 'administrator'],
        index: true
    }],
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: [
            'job',
            'device',
            'customer',
            'parts-request',
            'system-issue',
            'report',
            'user',
            'general'
        ],
        default: 'general'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ targetRoles: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

notificationSchema.statics.exists = function (filters) {
    return this.findOne(filters).then(notification => !!notification);
};

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);