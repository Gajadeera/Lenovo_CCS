const { Server } = require('socket.io');
const NotificationService = require('../services/notificationService');

const connectedUsers = new Map();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL = 30 * 1000;
let ioInstance = null;

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_CLIENT_ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true
        }
    });

    ioInstance = io;

    const checkInactiveUsers = () => {
        const now = Date.now();
        connectedUsers.forEach((userData, userId) => {
            if (now - userData.lastActivity > INACTIVITY_TIMEOUT) {
                userData.socketIds.forEach(socketId => {
                    io.sockets.sockets.get(socketId)?.disconnect();
                });
                connectedUsers.delete(userId);
                console.log(`User ${userData.userName} (${userId}) removed due to inactivity`);
            }
        });
        updateOnlineUsers();
    };

    const updateOnlineUsers = () => {
        io.emit('onlineUsers', {
            count: connectedUsers.size,
            users: Array.from(connectedUsers.values()).map(user => ({
                userId: user.userId,
                userName: user.userName,
                role: user.role,
                lastActivity: user.lastActivity
            }))
        });
    };

    io.on('connection', (socket) => {
        const { userId, role, userName } = socket.handshake.auth;
        if (!userId) {
            console.log('Connection rejected: No userId provided');
            return socket.disconnect();
        }

        console.log(`New connection: ${userName} (${userId}), role: ${role}, socket: ${socket.id}`);

        const currentTime = Date.now();
        const userData = connectedUsers.get(userId) || {
            userId,
            socketIds: [],
            lastActivity: currentTime,
            userName,
            role,
            rooms: new Set()
        };

        userData.socketIds.push(socket.id);
        userData.lastActivity = currentTime;
        connectedUsers.set(userId, userData);
        socket.join(`user-${userId}`);
        if (role) {
            socket.join(`role-${role.toLowerCase()}`);
            userData.rooms.add(`role-${role.toLowerCase()}`);
        }
        updateOnlineUsers();
        socket.on('authenticate', async (data) => {
            try {
                const { userId: authUserId, userRole } = data;
                if (!authUserId || !userRole) {
                    console.log('Authentication failed: Missing userId or userRole');
                    return;
                }

                socket.userId = authUserId;
                socket.userRole = userRole;
                const notifications = await NotificationService.getUserNotifications(authUserId, userRole);
                socket.emit('initial_notifications', {
                    success: true,
                    notifications,
                    count: notifications.length
                });

                console.log(`User ${authUserId} authenticated with role ${userRole}, ${notifications.length} notifications sent`);

            } catch (error) {
                console.error('Error in authenticate handler:', error);
                socket.emit('authentication_error', {
                    success: false,
                    message: 'Failed to load notifications'
                });
            }
        });

        socket.on('job_assigned', async ({ userId, jobId, jobTitle }) => {
            try {
                const message = `You've been assigned to job: ${jobTitle}`;
                const notification = await NotificationService.createNotification({
                    userId,
                    message,
                    type: 'job_assigned',
                    relatedId: jobId,
                    metadata: { jobId, jobTitle }
                });

                io.to(`user-${userId}`).emit('new_notification', notification);
                console.log(`Job assignment notification sent to user ${userId}`);

            } catch (error) {
                console.error('Error handling job_assigned:', error);
            }
        });

        socket.on('mark_as_read', async (notificationId, callback) => {
            try {
                if (!socket.userId) {
                    if (callback) callback({ success: false, message: 'Not authenticated' });
                    return;
                }

                const updated = await NotificationService.markAsRead(notificationId);
                if (callback) callback({ success: true, notification: updated });

                socket.emit('notification_read', updated);
                console.log(`Notification ${notificationId} marked as read by user ${socket.userId}`);

            } catch (error) {
                console.error('Error marking notification as read:', error);
                if (callback) callback({ success: false, message: 'Failed to mark notification as read' });
            }
        });

        socket.on('mark_all_read', async (callback) => {
            try {
                if (!socket.userId || !socket.userRole) {
                    if (callback) callback({ success: false, message: 'Not authenticated' });
                    return;
                }

                const result = await NotificationService.markAllAsRead(socket.userId, socket.userRole);
                if (callback) callback({
                    success: true,
                    modifiedCount: result.modifiedCount
                });

                socket.emit('all_notifications_read', { success: true });
                console.log(`All notifications marked as read by user ${socket.userId}`);

            } catch (error) {
                console.error('Error marking all notifications as read:', error);
                if (callback) callback({ success: false, message: 'Failed to mark all notifications as read' });
            }
        });

        socket.on('get_notifications', async ({ limit = 50, unreadOnly = false }, callback) => {
            try {
                if (!socket.userId || !socket.userRole) {
                    if (callback) callback({ success: false, message: 'Not authenticated' });
                    return;
                }

                const notifications = await NotificationService.getUserNotifications(
                    socket.userId,
                    socket.userRole,
                    { limit, unreadOnly }
                );

                if (callback) callback({
                    success: true,
                    notifications,
                    count: notifications.length
                });

            } catch (error) {
                console.error('Error fetching notifications:', error);
                if (callback) callback({ success: false, message: 'Failed to fetch notifications' });
            }
        });

        socket.on('requestOnlineUsers', (callback) => {
            updateOnlineUsers();
            if (callback) callback({
                success: true,
                onlineUsers: Array.from(connectedUsers.values()).map(user => ({
                    userId: user.userId,
                    userName: user.userName,
                    role: user.role
                }))
            });
        });

        socket.on('activity', (data, callback) => {
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).lastActivity = Date.now();
                if (callback) callback({
                    status: 'acknowledged',
                    timestamp: Date.now()
                });
            }
        });

        socket.on('join-room', (room, callback) => {
            socket.join(room);
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).rooms.add(room);
            }
            if (callback) callback({ success: true, room });
            console.log(`User ${userId} joined room: ${room}`);
        });

        socket.on('leave-room', (room, callback) => {
            socket.leave(room);
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).rooms.delete(room);
            }
            if (callback) callback({ success: true, room });
            console.log(`User ${userId} left room: ${room}`);
        });

        socket.on('get_user_rooms', (callback) => {
            const userData = connectedUsers.get(userId);
            if (userData && callback) {
                callback({
                    success: true,
                    rooms: Array.from(userData.rooms)
                });
            }
        });

        socket.on('disconnect', (reason) => {
            const userData = connectedUsers.get(userId);
            if (userData) {
                userData.socketIds = userData.socketIds.filter(id => id !== socket.id);

                if (userData.socketIds.length === 0) {
                    connectedUsers.delete(userId);
                    console.log(`User ${userName} (${userId}) completely disconnected. Reason: ${reason}`);
                } else {
                    console.log(`User ${userName} (${userId}) lost one connection. Remaining connections: ${userData.socketIds.length}. Reason: ${reason}`);
                }

                updateOnlineUsers();
            }
        });

        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    return io;
};

const broadcastNotification = async (options) => {
    if (!ioInstance) {
        console.error('No IO instance available for broadcasting');
        return null;
    }

    try {
        const notification = await NotificationService.createNotification(options);

        if (options.userId) {
            ioInstance.to(`user-${options.userId}`).emit('new_notification', notification);
            console.log(`Notification sent to user ${options.userId}: ${options.message}`);
        }

        if (options.targetRoles && options.targetRoles.length > 0) {
            options.targetRoles.forEach(role => {
                const roomName = `role-${role.toLowerCase()}`;
                ioInstance.to(roomName).emit('new_notification', notification);
                console.log(`Notification sent to role ${role}: ${options.message}`);
            });
        }

        return notification;

    } catch (error) {
        console.error('Error broadcasting notification:', error);
        throw error;
    }
};

const emitToRoles = (roles, event, data) => {
    if (!ioInstance) {
        console.error('No IO instance available for role emission');
        return;
    }

    roles.forEach(role => {
        const roomName = `role-${role.toLowerCase()}`;
        ioInstance.to(roomName).emit(event, data);
        console.log(`Event '${event}' emitted to role ${role}`);
    });
};

const emitToUser = (userId, event, data) => {
    if (!ioInstance) {
        console.error('No IO instance available for user emission');
        return;
    }

    ioInstance.to(`user-${userId}`).emit(event, data);
    console.log(`Event '${event}' emitted to user ${userId}`);
};

const getUser = (userId) => {
    return connectedUsers.get(userId);
};

const getOnlineUsers = () => {
    return Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        userName: user.userName,
        role: user.role,
        socketCount: user.socketIds.length,
        lastActivity: user.lastActivity,
        rooms: Array.from(user.rooms)
    }));
};

const getOnlineUsersByRole = (role) => {
    return Array.from(connectedUsers.values())
        .filter(user => user.role === role)
        .map(user => ({
            userId: user.userId,
            userName: user.userName,
            role: user.role
        }));
};

const disconnectUser = (userId) => {
    const userData = connectedUsers.get(userId);
    if (userData && ioInstance) {
        userData.socketIds.forEach(socketId => {
            ioInstance.sockets.sockets.get(socketId)?.disconnect();
        });
        connectedUsers.delete(userId);
        updateOnlineUsers();
        console.log(`User ${userId} forcibly disconnected`);
        return true;
    }
    return false;
};

module.exports = {
    initializeSocket,
    getIO: () => ioInstance,
    getUser,
    getOnlineUsers,
    getOnlineUsersByRole,
    broadcastNotification,
    emitToRoles,
    emitToUser,
    disconnectUser
};