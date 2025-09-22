const { getIO } = require('./socketService');

const ROOMS = {
    COORDINATOR: 'role-coordinator',
    TECHNICIAN: 'role-technician',
    MANAGER: 'role-manager',
    PARTS_TEAM: 'role-parts-team',
    ADMINISTRATOR: 'role-administrator'
};

class RoomManager {
    static joinRoleRooms(socket, roles) {
        Object.values(ROOMS).forEach(room => socket.leave(room));

        roles.forEach(role => {
            switch (role.toLowerCase()) {
                case 'coordinator':
                    socket.join(ROOMS.COORDINATOR);
                    break;
                case 'technician':
                    socket.join(ROOMS.TECHNICIAN);
                    break;
                case 'manager':
                    socket.join(ROOMS.MANAGER);
                    break;
                case 'parts_team':
                    socket.join(ROOMS.PARTS_TEAM);
                    break;
                case 'administrator':
                    socket.join(ROOMS.ADMINISTRATOR);
                    break;
            }
        });
    }

    static emitToRole(role, event, data) {
        const io = getIO();
        if (!io) return;

        switch (role.toLowerCase()) {
            case 'coordinator':
                io.to(ROOMS.COORDINATOR).emit(event, data);
                break;
            case 'technician':
                io.to(ROOMS.TECHNICIAN).emit(event, data);
                break;
            case 'manager':
                io.to(ROOMS.MANAGER).emit(event, data);
                break;
            case 'parts_team':
                io.to(ROOMS.PARTS_TEAM).emit(event, data);
                break;
            case 'administrator':
                io.to(ROOMS.ADMINISTRATOR).emit(event, data);
                break;
        }
    }

    static emitToRoles(roles, event, data) {
        const io = getIO();
        if (!io) {
            console.error("[SOCKET] No IO instance available");
            return;
        }

        console.log(`[SOCKET] Emitting '${event}' to roles:`, roles);

        roles.forEach(role => {
            const roomName = `role-${role.toLowerCase()}`;
            console.log(`[SOCKET] Emitting to room: ${roomName}`);
            io.to(roomName).emit(event, data);
        });
    }
}

module.exports = { RoomManager, ROOMS };