const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 }
});

counterSchema.statics.getNextSequence = async function (name) {
    const result = await this.findByIdAndUpdate(
        name,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return result.sequence_value;
};

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);