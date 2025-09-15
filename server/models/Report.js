const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filters: { type: Object },
    documentCount: { type: Number },
    filePath: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);