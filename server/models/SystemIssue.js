const mongoose = require('mongoose');
const validator = require('validator');

const commentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const screenshotSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
        validate: [validator.isURL, 'Invalid URL']
    },
    public_id: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const systemIssueSchema = new mongoose.Schema({
    reported_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    category: {
        type: String,
        enum: ['Bug', 'Feature Request', 'UI/UX', 'Performance', 'Other'],
        required: true
    },
    screenshots: [screenshotSchema],
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolution: {
        type: String,
        trim: true
    },
    comments: [commentSchema]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

systemIssueSchema.index({ reported_by: 1 });
systemIssueSchema.index({ status: 1 });
systemIssueSchema.index({ priority: 1 });
systemIssueSchema.index({ category: 1 });
systemIssueSchema.index({ assigned_to: 1 });
systemIssueSchema.index({ created_at: -1 });
systemIssueSchema.index({ title: 'text', description: 'text', resolution: 'text' }, {
    name: 'system_issues_text_search_index',
    weights: {
        title: 3,
        description: 2,
        resolution: 1
    }
});

systemIssueSchema.virtual('screenshot_urls').get(function () {
    return this.screenshots.map(screenshot => screenshot.url);
});

systemIssueSchema.methods.addComment = function (userId, text) {
    this.comments.push({
        user_id: userId,
        text: text
    });
    return this.save();
};

systemIssueSchema.methods.changeStatus = function (newStatus) {
    this.status = newStatus;
    return this.save();
};

systemIssueSchema.statics.findOpenIssues = function () {
    return this.find({ status: 'Open' });
};

systemIssueSchema.statics.findByReporter = function (userId) {
    return this.find({ reported_by: userId });
};

systemIssueSchema.methods.toJSON = function () {
    const issue = this.toObject();
    delete issue.__v;
    return issue;
};

module.exports = mongoose.models.SystemIssue || mongoose.model('SystemIssue', systemIssueSchema);