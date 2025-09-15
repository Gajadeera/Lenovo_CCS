const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/config');
const { User } = require('./models');

mongoose.connect(config.mongoose.url, config.mongoose.options)
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

const seedMG = async () => {
    try {
        await mongoose.connection.dropDatabase();

        // Create manager user with all required fields
        const managerData = {
            name: "Service Manager",
            email: "manager@lenovo-ccs.com",
            phone: "0723456789",
            password: "Manager@123", // Will be hashed by pre-save hook
            role: "manager",
            image: {
                url: "https://example.com/default-manager.jpg",
                public_id: "manager-default"
            }
        };

        // Create using User model to trigger pre-save hooks
        const manager = new User(managerData);
        const createdUser = await manager.save();

        console.log(`✅ Seed complete. Created manager user:
            Name: ${createdUser.name}
            Email: ${createdUser.email}
            Role: ${createdUser.role}
            Password: Manager@123 (use this to login)`);

        // Verify the password can be matched
        const isMatch = await createdUser.isPasswordMatch("Manager@123");
        console.log(`Password verification test: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    } catch (e) {
        console.error('Seeding error:', e);
    } finally {
        mongoose.disconnect();
    }
};

seedMG();