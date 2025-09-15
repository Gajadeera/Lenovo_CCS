const mongoose = require('mongoose');
const validator = require('validator');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    address: {
        type: String,
        trim: true
    },
    customer_type: {
        type: String,
        enum: ["Personal", "Enterprise", "individual"],
        default: "Personal"
    },
    is_ad_hoc: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ customer_type: 1 });
customerSchema.index({ is_ad_hoc: 1 });
customerSchema.index({ created_by: 1 });
customerSchema.index({
    name: 'text',
    email: 'text',
    phone: 'text',
    address: 'text'
}, {
    name: 'customers_text_search_index',
    weights: {
        name: 3,
        email: 2,
        phone: 2,
        address: 1
    }
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);