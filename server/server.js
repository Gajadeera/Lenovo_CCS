const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app)
const io = initializeSocket(server);

app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO origin: ${process.env.SOCKET_CLIENT_ORIGIN || 'http://localhost:5173'}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});