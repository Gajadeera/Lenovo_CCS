const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    device_type: {
        type: String,
        enum: ["Laptop", "Desktop", "Server", "Printer", "Tablet", "Workstation", "All-in-One"],
        required: true
    },
    manufacturer: {
        type: String,
        trim: true,
        required: true
    },
    model_number: {
        type: String,
        trim: true,
    },
    serial_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    purchase_date: {
        type: Date
    },
    warranty_status: {
        type: String,
        enum: ["In Warranty", "Out of Warranty"]
    },
    is_ad_hoc: {
        type: Boolean,
        default: false
    },
    specifications: {
        cpu: { type: String, trim: true },
        ram: { type: String, trim: true },
        storage: { type: String, trim: true },
        os: { type: String, trim: true }
    },
    notes: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

deviceSchema.index({ customer_id: 1 });
deviceSchema.index({ device_type: 1 });
deviceSchema.index({ warranty_status: 1 });
deviceSchema.index({ is_ad_hoc: 1 });
deviceSchema.index({ 'specifications.os': 1 });
deviceSchema.index({
    manufacturer: 'text',
    model_number: 'text',
    serial_number: 'text',
    'specifications.cpu': 'text',
    'specifications.ram': 'text'
}, {
    name: 'devices_text_search_index',
    weights: {
        serial_number: 3,
        model_number: 2,
        manufacturer: 1
    }
});

module.exports = mongoose.models.Device || mongoose.model('Device', deviceSchema);