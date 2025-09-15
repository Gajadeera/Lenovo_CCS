const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config/config');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const routes = require('./routes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use('/', routes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

if (!config.jwt?.secret) {
    console.error('FATAL ERROR: JWT configuration is missing');
    process.exit(1);
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
