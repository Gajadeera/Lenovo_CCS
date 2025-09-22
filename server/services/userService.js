const config = require('../config/config');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const mongoose = require('mongoose');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');

class UserService {
    static generateAuthResponse(user) {
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                name: user.name,
                email: user.email
            },
            config.jwt.secret,
            {
                expiresIn: config.jwt.accessExpirationMinutes * 60
            }
        );

        const userData = user.toObject();
        delete userData.password;
        delete userData.__v;

        return {
            user: userData,
            token
        };
    }

    static async handleImageUpload(file, userId, isUpdate = false) {
        if (!file) return null;

        let tempFilePath = file.path;
        try {
            const folder = `Lenovo_CCS/User_Profiles_Images/${userId}`;
            const result = await cloudinary.uploader.upload(tempFilePath, {
                folder,
                public_id: 'profile',
                width: 500,
                height: 500,
                crop: 'fill',
                quality: 'auto',
                format: 'jpg',
                overwrite: true
            });

            return {
                url: result.secure_url,
                public_id: result.public_id
            };
        } catch (error) {
            throw new ApiError(500, 'Image upload failed');
        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    static async cleanupImage(user) {
        if (user.image?.public_id && user.image.public_id !== 'default_public_id') {
            try {
                await cloudinary.uploader.destroy(user.image.public_id);
                await cloudinary.api.delete_folder(`Lenovo_CCS/User_Profiles_Images/${user._id}`);
            } catch (error) {
                console.log('Cloudinary cleanup failed:', error.message);
            }
        }
    }

    static async emitUserEvent(eventName, data, targetRoles = [], targetUser = null) {
        const io = getIO();
        if (!io) return;

        if (targetUser) {
            io.to(`user-${targetUser}`).emit(eventName, data);
        }

        if (targetRoles.length > 0) {
            RoomManager.emitToRoles(targetRoles, eventName, data);
        }
    }

    static async createUserNotification(target, message, type, metadata, relatedId) {
        const notificationData = {
            message,
            type,
            relatedId,
            metadata
        };

        if (target.userId) {
            notificationData.userId = target.userId;
        } else if (target.roles) {
            notificationData.targetRoles = target.roles;
        }

        await notificationService.createNotification(notificationData);
    }

    static async signup(userData, file, currentUser) {
        const { name, email, password, role, phone, skills } = userData;
        console.log('Signup data received:', userData);

        if (!validator.isEmail(email)) throw new ApiError(400, 'Invalid email format');
        if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
        if (await User.isEmailTaken(email)) throw new ApiError(400, 'Email already taken');

        const validRoles = ['coordinator', 'technician', 'manager', 'parts_team', 'administrator'];
        if (!validRoles.includes(role)) throw new ApiError(400, 'Invalid user role');

        let parsedSkills = [];
        if (skills) {
            try {
                parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;
                console.log('Parsed skills:', parsedSkills); // Add this debug log
            } catch (err) {
                console.error('Skills parsing error:', err);
                throw new ApiError(400, 'Invalid skills format');
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone: phone || null,
            skills: parsedSkills.map(s => ({
                name: s.name,
                subskills: (s.subskills || []).filter(sub => sub && sub.trim() !== '')
            })),
            image: {
                url: 'https://res.cloudinary.com/demo/image/upload/v1626282931/sample.jpg',
                public_id: 'default_public_id'
            },
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('New user created:', user);

        if (file) {
            user.image = await this.handleImageUpload(file, user._id);
            await user.save();
        }

        const authResponse = this.generateAuthResponse(user);

        await this.createUserNotification(
            { roles: ['administrator', 'manager'] },
            `New user account created for ${user.name} (${user.role})`,
            'user',
            {
                action: 'user_created',
                createdBy: currentUser?._id || 'system',
                userEmail: user.email
            },
            user._id
        );

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: currentUser?._id || 'system',
                name: currentUser?.name || 'System',
                role: currentUser?.role || 'system'
            },
            user: user.toObject(),
            metadata: {}
        };

        await this.emitUserEvent('user-created', eventData, ['administrator', 'manager']);
        await this.emitUserEvent('user-welcome', {
            ...eventData,
            initiatedBy: {
                userId: 'system',
                name: 'System',
                role: 'system'
            }
        }, [], user._id);

        return authResponse;
    }

    static async signin(email, password, ipAddress) {
        if (!email || !password) throw new ApiError(400, 'Email and password are required');

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.isPasswordMatch(password))) {
            throw new ApiError(401, 'Incorrect email or password');
        }

        user.last_login = new Date();
        await user.save();

        const authResponse = this.generateAuthResponse(user);

        await this.createUserNotification(
            { roles: ['administrator'] },
            `${user.name} (${user.role}) logged in at ${new Date().toLocaleString()}`,
            'user',
            {
                action: 'user_login',
                loginTime: new Date(),
                ipAddress
            },
            user._id
        );

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: user._id,
                name: user.name,
                role: user.role
            },
            user: user.toObject(),
            metadata: {}
        };

        await this.emitUserEvent('user-login', eventData, ['administrator', 'manager']);

        return authResponse;
    }

    static async getProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    static async updateProfile(userId, updateData, file, currentUser) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        const oldValues = { ...user.toObject() };
        const removeImage = updateData.removeImage;
        if (removeImage === 'true' || removeImage === true) {
            await this.cleanupImage(user);
            user.image = {
                url: 'https://res.cloudinary.com/demo/image/upload/v1626282931/sample.jpg',
                public_id: 'default_public_id'
            };
        }
        else if (file) {
            await this.cleanupImage(user);
            user.image = await this.handleImageUpload(file, user._id, true);
        }
        if (updateData.name !== undefined) user.name = updateData.name;
        if (updateData.phone !== undefined) user.phone = updateData.phone;

        await user.save();

        const changedFields = [];
        if (updateData.name !== undefined && updateData.name !== oldValues.name) {
            changedFields.push('name');
        }
        if (updateData.phone !== undefined && updateData.phone !== oldValues.phone) {
            changedFields.push('phone');
        }
        if (file || removeImage) {
            changedFields.push('image');
        }

        await this.createUserNotification(
            { userId: user._id },
            'Your profile has been updated successfully',
            'user',
            {
                action: 'profile_updated',
                changedFields,
                updatedBy: currentUser._id
            },
            user._id
        );

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: currentUser._id,
                name: currentUser.name,
                role: currentUser.role
            },
            user: user.toObject(),
            metadata: {
                changedFields,
                oldValues
            }
        };

        await this.emitUserEvent('user-profile-updated', eventData, [], user._id);

        return user;
    }

    static async getAllUsers(filters = {}) {
        const { name, role, page = 1, limit = 5, all = false } = filters;
        const query = {};

        if (name) query.name = { $regex: name, $options: 'i' };
        if (role) query.role = role;

        if (all == 'true') {
            return await User.find(query).lean();
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));

        const [totalCount, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean()
        ]);

        return {
            users,
            totalCount,
            page: pageNum,
            limit: limitNum
        };
    }

    static async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    static async updateUser(userId, updateData, file, currentUser) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        const oldValues = user.toObject();

        let parsedSkills = [];
        if (updateData.skills) {
            try {
                parsedSkills = typeof updateData.skills === "string"
                    ? JSON.parse(updateData.skills)
                    : updateData.skills;
                console.log('Parsed skills for update:', parsedSkills);
            } catch (err) {
                console.error('Skills parsing error:', err);
                throw new ApiError(400, 'Invalid skills format');
            }
        }

        if (updateData.removeImage === 'true' || updateData.removeImage === true) {
            await this.cleanupImage(user);
            user.image = {
                url: 'https://res.cloudinary.com/demo/image/upload/v1626282931/sample.jpg',
                public_id: 'default_public_id'
            };
        } else if (file) {
            await this.cleanupImage(user);
            user.image = await this.handleImageUpload(file, user._id, true);
        }

        const updates = {
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone,
            role: updateData.role,
            ...(updateData.password && { password: updateData.password }),
            ...(updateData.skills && {
                skills: parsedSkills.map(s => ({
                    name: s.name,
                    subskills: (s.subskills || []).filter(sub => sub && sub.trim() !== '')
                }))
            }),
            updated_at: new Date()
        };

        Object.assign(user, updates);
        await user.save();

        const userObject = user.toObject();
        delete userObject.password;

        const changedFields = Object.keys(updates).filter(key => {
            if (key === 'skills') {
                return JSON.stringify(oldValues[key] || []) !== JSON.stringify(updates[key] || []);
            }
            return JSON.stringify(oldValues[key]) !== JSON.stringify(updates[key]);
        });

        await this.createUserNotification(
            { userId: user._id },
            `Your profile was updated by ${currentUser.name}`,
            'user',
            {
                action: 'user_updated',
                updatedBy: currentUser._id,
                changedFields
            },
            user._id
        );

        await this.createUserNotification(
            { roles: ['administrator'] },
            `User ${user.name} was updated by ${currentUser.name}: ${changedFields.join(', ')} changed`,
            'user',
            {
                action: 'user_updated_by_admin',
                updatedBy: currentUser._id,
                userName: user.name,
                changedFields
            },
            user._id
        );

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: currentUser._id,
                name: currentUser.name,
                role: currentUser.role
            },
            user: userObject,
            metadata: {
                changedFields,
                oldValues
            }
        };

        await this.emitUserEvent('user-updated', eventData, ['administrator', 'manager'], user._id);

        return { data: userObject };
    }

    static async deleteUser(userId, currentUser) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        await this.cleanupImage(user);

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        await User.findByIdAndDelete(userId);
        await this.createUserNotification(
            { roles: ['administrator', 'manager'] },
            `User account deleted: ${user.name} (${user.role}) by ${currentUser.name}`,
            'user',
            {
                action: 'user_deleted',
                deletedBy: currentUser._id,
                userName: user.name,
                userRole: user.role
            },
            user._id
        );

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: currentUser._id,
                name: currentUser.name,
                role: currentUser.role
            },
            user: userData,
            metadata: {}
        };

        await this.emitUserEvent('user-deleted', eventData, ['administrator', 'manager']);

        return { message: 'User deleted successfully' };
    }

    static async getUserCounts() {
        const [totalCount, activeCount, newUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ last_login: { $gt: new Date(Date.now() - 15 * 60 * 1000) } }),
            User.countDocuments({ created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        ]);

        const stats = {
            total: totalCount,
            active: activeCount,
            newLast24Hours: newUsers
        };

        await this.emitUserEvent('user-stats-updated', stats, ['administrator', 'manager']);

        return stats;
    }

    static async getUserActivity() {
        const activities = await User.aggregate([
            { $match: { last_login: { $exists: true } } },
            { $sort: { last_login: -1 } },
            { $limit: 10 },
            { $project: { name: 1, email: 1, role: 1, last_login: 1 } }
        ]);

        await this.emitUserEvent('user-activity-updated', activities, ['administrator']);

        return activities;
    }

    static async getRoleDistribution() {
        const distribution = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $project: { role: '$_id', count: 1, _id: 0 } }
        ]);

        await this.emitUserEvent('role-distribution-updated', distribution, ['administrator', 'manager']);

        return distribution;
    }

    static async getUserGrowth(period = 'weekly') {
        let groupBy;

        switch (period) {
            case 'daily':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
                break;
            case 'monthly':
                groupBy = { $dateToString: { format: '%Y-%m', date: '$created_at' } };
                break;
            default:
                groupBy = { $dateToString: { format: '%Y-%U', date: '$created_at' } };
        }

        const growth = await User.aggregate([
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 },
                    date: { $first: '$created_at' }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    period: '$_id',
                    count: 1,
                    date: 1,
                    _id: 0
                }
            }
        ]);

        const result = {
            period,
            data: growth
        };
        await this.emitUserEvent('user-growth-updated', result, ['administrator']);

        return growth;
    }

    static async uploadProfileImage(userId, file) {
        if (!file) {
            throw new ApiError(400, 'No image file provided');
        }

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        await this.cleanupImage(user);
        user.image = await this.handleImageUpload(file, user._id, true);
        await user.save();

        return {
            message: 'Profile image uploaded successfully',
            imageUrl: user.image.url
        };
    }
}

module.exports = UserService;