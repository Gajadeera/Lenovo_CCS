const { Device, Customer, User } = require('../models');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { getWarrantyInfo } = require('../utils/WarrantyLookup');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');

class DeviceService {
    static populateDevice(deviceQuery) {
        return deviceQuery.populate('customer', 'name email phone');
    }

    static async createDevice(deviceData, userId) {
        try {
            if (!deviceData.model_number || !deviceData.serial_number) {
                throw new ApiError(400, 'Model number and serial number are required');
            }

            const device = await Device.create({
                model_number: deviceData.model_number,
                serial_number: deviceData.serial_number,
                manufacturer: deviceData.manufacturer,
                device_type: deviceData.device_type || 'other',
                purchase_date: deviceData.purchase_date || null,
                warranty_status: deviceData.warranty_status || 'In Warranty',
                specifications: deviceData.specifications || { cpu: '', ram: '', storage: '', os: '' },
                notes: deviceData.notes || '',
                ...(deviceData.customer_id && { customer: deviceData.customer_id })
            });

            const populatedDevice = await this.populateDevice(Device.findById(device._id));

            await notificationService.createNotification({
                targetRoles: ['coordinator', 'manager'],
                message: `New device added: ${populatedDevice.model_number} (${populatedDevice.serial_number})`,
                type: 'device',
                relatedId: populatedDevice._id,
                metadata: {
                    action: 'device_created',
                    createdBy: userId || 'system',
                    modelNumber: populatedDevice.model_number,
                    serialNumber: populatedDevice.serial_number
                }
            });

            const io = getIO();
            if (io) {
                const eventData = {
                    eventId: new mongoose.Types.ObjectId().toString(),
                    timestamp: new Date(),
                    initiatedBy: {
                        userId: userId || 'system',
                        name: userId?.name || 'System',
                        role: userId?.role || 'system'
                    },
                    device: populatedDevice,
                    metadata: {}
                };

                RoomManager.emitToRoles(['coordinator', 'manager'], 'device-created', eventData);
            }

            return populatedDevice;
        } catch (error) {
            throw error;
        }
    }

    static async getAllDevices(filters) {
        try {
            const {
                serial_number,
                device_type,
                manufacturer,
                model_number,
                warranty_status,
                customer,
                page = 1,
                limit = 10,
                all = false
            } = filters;

            if (all == 'true') {
                const devices = await Device.find({})
                    .populate('customer', 'name email phone')
                    .lean();
                return devices;
            }
            const filter = {};

            if (serial_number) filter.serial_number = { $regex: serial_number, $options: 'i' };
            if (device_type) filter.device_type = device_type;
            if (manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };
            if (model_number) filter.model_number = { $regex: model_number, $options: 'i' };
            if (warranty_status) filter.warranty_status = warranty_status;
            if (customer) filter.customer = customer;


            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.max(1, parseInt(limit));

            const [totalCount, devices] = await Promise.all([
                Device.countDocuments(filter),
                Device.find(filter)
                    .populate('customer', 'name email phone')
                    .sort({ createdAt: -1 })
                    .skip((pageNum - 1) * limitNum)
                    .limit(limitNum)
                    .lean()
            ]);

            return {
                devices,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async getDevice(deviceId) {
        try {
            const device = await Device.findById(deviceId)
                .populate('customer', 'name email phone');

            if (!device) {
                throw new ApiError(404, 'Device not found');
            }

            return device;
        } catch (error) {
            throw error;
        }
    }

    static async updateDevice(deviceId, updateData, userId) {
        try {
            const existingDevice = await Device.findById(deviceId);
            if (!existingDevice) {
                throw new ApiError(404, 'Device not found');
            }

            const oldValues = { ...existingDevice.toObject() };

            const device = await Device.findByIdAndUpdate(
                deviceId,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            ).populate('customer', 'name email phone');

            const changedFields = Object.keys(updateData).filter(key => {
                return JSON.stringify(oldValues[key]) !== JSON.stringify(updateData[key]);
            });

            await notificationService.createNotification({
                targetRoles: ['coordinator', 'manager'],
                message: `Device ${device.model_number} (${device.serial_number}) has been updated`,
                type: 'device',
                relatedId: device._id,
                metadata: {
                    action: 'device_updated',
                    updatedBy: userId || 'system',
                    modelNumber: device.model_number,
                    serialNumber: device.serial_number,
                    changedFields: changedFields
                }
            });
            const io = getIO();
            if (io) {
                const eventData = {
                    eventId: new mongoose.Types.ObjectId().toString(),
                    timestamp: new Date(),
                    initiatedBy: {
                        userId: userId || 'system',
                        name: userId?.name || 'System',
                        role: userId?.role || 'system'
                    },
                    device: device,
                    metadata: {
                        changedFields: changedFields,
                        oldValues: {
                            model_number: oldValues.model_number,
                            serial_number: oldValues.serial_number,
                            warranty_status: oldValues.warranty_status
                        }
                    }
                };

                RoomManager.emitToRoles(['coordinator', 'manager'], 'device-updated', eventData);
            }

            return device;
        } catch (error) {
            throw error;
        }
    }

    static async deleteDevice(deviceId, userId) {
        try {
            const device = await Device.findById(deviceId);
            if (!device) {
                throw new ApiError(404, 'Device not found');
            }

            await Device.findByIdAndDelete(deviceId);
            await notificationService.createNotification({
                targetRoles: ['coordinator', 'manager'],
                message: `Device ${device.model_number} (${device.serial_number}) has been deleted`,
                type: 'device',
                relatedId: device._id,
                metadata: {
                    action: 'device_deleted',
                    deletedBy: userId || 'system',
                    modelNumber: device.model_number,
                    serialNumber: device.serial_number
                }
            });

            const io = getIO();
            if (io) {
                const eventData = {
                    eventId: new mongoose.Types.ObjectId().toString(),
                    timestamp: new Date(),
                    initiatedBy: {
                        userId: userId || 'system',
                        name: userId?.name || 'System',
                        role: userId?.role || 'system'
                    },
                    device: {
                        _id: device._id,
                        model_number: device.model_number,
                        serial_number: device.serial_number
                    },
                    metadata: {}
                };

                RoomManager.emitToRoles(['coordinator', 'manager'], 'device-deleted', eventData);
            }

            return {
                message: 'Device deleted successfully',
                deletedDevice: device
            };
        } catch (error) {
            throw error;
        }
    }

    static async warrantyCheck(serialNumber, userId) {
        try {
            if (!serialNumber) {
                throw new ApiError(400, 'Serial number is required');
            }

            const warrantyInfo = await getWarrantyInfo(serialNumber);
            if (!warrantyInfo) {
                throw new ApiError(404, 'Warranty information not found for this device');
            }
            const device = await Device.findOne({ serial_number: serialNumber });
            if (device && device.warranty_status !== warrantyInfo.warranty_status) {
                const oldWarrantyStatus = device.warranty_status;

                const updatedDevice = await Device.findByIdAndUpdate(
                    device._id,
                    { warranty_status: warrantyInfo.warranty_status },
                    { new: true }
                ).populate('customer', 'name email phone');

                const notificationPromises = [];

                notificationPromises.push(
                    notificationService.createNotification({
                        targetRoles: ['coordinator', 'manager'],
                        message: `Warranty status updated for device ${updatedDevice.model_number} (${updatedDevice.serial_number})`,
                        type: 'device',
                        relatedId: updatedDevice._id,
                        metadata: {
                            action: 'device_warranty_updated',
                            modelNumber: updatedDevice.model_number,
                            serialNumber: updatedDevice.serial_number,
                            oldStatus: oldWarrantyStatus,
                            newStatus: warrantyInfo.warranty_status
                        }
                    })
                );
                if (updatedDevice.customer) {
                    notificationPromises.push(
                        notificationService.createNotification({
                            userId: updatedDevice.customer._id,
                            message: `Warranty status updated for your device ${updatedDevice.model_number}`,
                            type: 'device',
                            relatedId: updatedDevice._id,
                            metadata: {
                                action: 'device_warranty_updated',
                                modelNumber: updatedDevice.model_number,
                                oldStatus: oldWarrantyStatus,
                                newStatus: warrantyInfo.warranty_status
                            }
                        })
                    );
                }

                await Promise.all(notificationPromises);

                const io = getIO();
                if (io) {
                    const eventData = {
                        eventId: new mongoose.Types.ObjectId().toString(),
                        timestamp: new Date(),
                        initiatedBy: {
                            userId: userId || 'system',
                            name: userId?.name || 'System',
                            role: userId?.role || 'system'
                        },
                        device: updatedDevice,
                        metadata: {
                            previousStatus: oldWarrantyStatus,
                            newStatus: warrantyInfo.warranty_status
                        }
                    };

                    RoomManager.emitToRoles(['coordinator', 'manager'], 'device-warranty-updated', eventData);

                    if (updatedDevice.customer) {
                        io.to(`user-${updatedDevice.customer._id}`).emit('device-warranty-updated', eventData);
                    }
                }
            }

            return {
                manufacturer: warrantyInfo.manufacturer,
                model_number: warrantyInfo.model_number,
                warranty_status: warrantyInfo.hasActiveWarranty ? 'In Warranty' : 'Out of Warranty',
                warranty_details: warrantyInfo.warrantyDetails,
                specifications: warrantyInfo.specifications
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DeviceService;