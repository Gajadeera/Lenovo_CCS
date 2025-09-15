const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const activityLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user_name: { type: String, required: true },
    user_role: { type: String, required: true },
    action: { type: String, required: true },
    entity_type: { type: String },
    entity_id: { type: mongoose.Schema.Types.Mixed },
    details: { type: Object },
    ip_address: { type: String },
    user_agent: { type: String },
    timestamp: { type: Date, default: Date.now, required: true }
}, {
    timestamps: false,
    versionKey: false
});

activityLogSchema.index({ user_id: 1 });
activityLogSchema.index({ user_role: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entity_type: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({
    user_name: 'text',
    action: 'text',
    entity_type: 'text'
}, {
    name: 'activity_logs_text_search_index'
});

activityLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);