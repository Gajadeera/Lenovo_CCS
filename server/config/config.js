require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoose: {
        url: process.env.MONGODB_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key-please-change',
        accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES) || 1440,  // 24 hours
        refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS) || 30,       // 30 days
        resetPasswordExpirationMinutes: parseInt(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES) || 10, // 10 mins
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    }
};