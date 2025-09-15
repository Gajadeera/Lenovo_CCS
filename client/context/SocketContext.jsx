import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connectionState, setConnectionState] = useState({
        isConnected: false,
        status: 'disconnected'
    });
    const [joinedRooms, setJoinedRooms] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({
        count: 0,
        users: []
    });

    const initializeSocket = useCallback(() => {
        if (!user?._id) return null;

        const socketOptions = {
            auth: {
                userId: user._id,
                userName: user.name || user.email,
                role: user.role.toLowerCase()
            },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            transports: ['websocket'],
            withCredentials: true,
            autoConnect: false // We'll manually connect after setting up listeners
        };

        const newSocket = io('http://localhost:5000', socketOptions);

        // Connection status handlers
        newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnectionState({
                isConnected: true,
                status: 'connected'
            });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setConnectionState({
                isConnected: false,
                status: reason === 'io server disconnect' ? 'disconnected' : 'reconnecting'
            });
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionState({
                isConnected: false,
                status: 'error'
            });
        });

        newSocket.on('reconnect_attempt', (attempt) => {
            console.log(`Reconnection attempt ${attempt}`);
            setConnectionState(prev => ({
                ...prev,
                status: 'reconnecting'
            }));
        });

        newSocket.on('reconnect_failed', () => {
            console.error('Reconnection failed');
            setConnectionState({
                isConnected: false,
                status: 'failed'
            });
        });

        // Online users handler
        newSocket.on('onlineUsers', (data) => {
            setOnlineUsers({
                count: data.count,
                users: data.users
            });
        });

        // Now connect after setting up all listeners
        newSocket.connect();

        return newSocket;
    }, [user]);

    useEffect(() => {
        const newSocket = initializeSocket();
        setSocket(newSocket);

        return () => {
            if (newSocket) {
                console.log('Cleaning up socket connection');
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('connect_error');
                newSocket.off('onlineUsers'); // Clean up onlineUsers listener
                // newSocket.disconnect();
            }
        };
    }, [initializeSocket]);

    const joinRoom = useCallback(async (room) => {
        if (!socket || !connectionState.isConnected) return false;

        try {
            const response = await new Promise((resolve) => {
                socket.emit('join-room', room, resolve);
                setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
            });

            if (response.success) {
                setJoinedRooms(prev => [...new Set([...prev, room])]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error joining room:', error);
            return false;
        }
    }, [socket, connectionState.isConnected]);

    const leaveRoom = useCallback((room) => {
        if (!socket || !connectionState.isConnected) return;

        socket.emit('leave-room', room);
        setJoinedRooms(prev => prev.filter(r => r !== room));
    }, [socket, connectionState.isConnected]);

    const subscribe = useCallback((event, handler) => {
        if (!socket) return () => { };

        socket.on(event, handler);
        return () => {
            socket.off(event, handler);
        };
    }, [socket]);

    const value = {
        socket,
        connectionState,
        joinedRooms,
        onlineUsers, // Add onlineUsers to the context value
        joinRoom,
        leaveRoom,
        subscribe,
        isConnected: connectionState.isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};