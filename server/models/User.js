const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const job = require('../models/Job');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email']
    },
    phone: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        minlength: 6,
        trim: true,
        private: true
    },
    image: {
        url: { type: String, trim: true },
        public_id: { type: String, trim: true }
    },
    role: {
        type: String,
        enum: ['coordinator', 'technician', 'manager', 'parts_team', 'administrator'],
        required: true
    },
    skill: [{
        name: {
            type: String,
            enum: [
                "Hardware",
                "Software",
                "Server",
                "Electronics",
                "Printer",
                "Network",
                "Network Administration",
                "System Management",
                "Team Management",
                "Operations",
                "Coordination",
                "Documentation",
                "Customer Service",
                "Communication",
                "Inventory Management",
                "Logistics"
            ],
            required: true
        },
        subskills: [{
            type: String,
            trim: true
        }]
    }],
    last_login: {
        type: Date
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
    // Remove timestamps since we're manually handling created_at and updated_at
    // to match the MongoDB schema requirements
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ last_login: -1 });
userSchema.index({ created_at: -1 });
userSchema.index({
    name: 'text',
    email: 'text',
    phone: 'text'
}, {
    name: 'users_text_search_index',
    weights: {
        name: 3,
        email: 2,
        phone: 1
    }
});

// Virtuals
userSchema.virtual('image_url').get(function () {
    return this.image?.url || null;
});

// In your User schema, add:
userSchema.virtual('current_job_count').get(async function () {
    try {
        return await mongoose.model('Job').countDocuments({
            assigned_to: this._id,
            status: { $in: ['Assigned', 'In Progress', 'On Hold'] }
        });
    } catch (error) {
        return 0;
    }
});

// Middleware to update updated_at timestamp
userSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

// Methods
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Hooks
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);