const { Customer } = require('../models');
const ApiError = require('../utils/apiError');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');

class CustomerService {
    static async createNotification(options) {
        return notificationService.createNotification({
            targetRoles: ['coordinator', 'manager', 'administrator'],
            type: 'customer',
            relatedId: options.customer._id,
            ...options,
            metadata: {
                customerName: options.customer.name,
                ...options.metadata
            }
        });
    }

    static async emitSocketEvent(eventName, data, customer) {
        const io = getIO();
        if (!io) return;

        const eventData = {
            eventId: new mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            initiatedBy: {
                userId: data.userId || 'system',
                name: data.userId?.name || 'System',
                role: data.userId?.role || 'system'
            },
            customer: customer,
            metadata: data.metadata || {}
        };

        RoomManager.emitToRoles(['coordinator', 'manager', 'administrator'], eventName, eventData);
    }

    static async validateCustomerData(customerData) {
        if (!customerData.name) {
            throw new ApiError(400, 'Name is required');
        }
    }

    static async buildCustomerFilter(filters) {
        const { name, email, phone, customer_type } = filters;
        const filter = {};

        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (phone) filter.phone = { $regex: phone, $options: 'i' };
        if (customer_type) filter.customer_type = customer_type;

        return filter;
    }

    static async handlePagination(filter, page = 1, limit = 5) {
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const totalCount = await Customer.countDocuments(filter);

        const customers = await Customer.find(filter)
            .sort({ created_at: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        return {
            customers,
            totalCount,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum)
        };
    }

    static async createCustomer(customerData, userId) {
        try {
            await this.validateCustomerData(customerData);

            const customer = await Customer.create({
                name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                customer_type: customerData.customer_type || 'individual',
                address: customerData.address,
                company: customerData.company
            });

            // Create notification
            await this.createNotification({
                message: `New customer created: ${customer.name}`,
                customer: customer,
                metadata: {
                    action: 'customer_created',
                    createdBy: userId || 'system',
                    customerType: customer.customer_type
                }
            });

            // Emit socket event
            await this.emitSocketEvent('customer-created', { userId }, customer);

            return customer;
        } catch (error) {
            throw error;
        }
    }

    static async getAllCustomers(filters) {
        try {
            const { all = false, page = 1, limit = 5, ...filterParams } = filters;

            if (all === 'true') {
                const customers = await Customer.find({}).lean();
                return customers;
            }

            const filter = await this.buildCustomerFilter(filterParams);
            return await this.handlePagination(filter, page, limit);
        } catch (error) {
            throw error;
        }
    }

    static async getCustomer(customerId) {
        try {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                throw new ApiError(404, 'Customer not found');
            }

            return customer;
        } catch (error) {
            throw error;
        }
    }

    static async updateCustomer(customerId, updateData, userId) {
        try {
            const existingCustomer = await Customer.findById(customerId);
            if (!existingCustomer) {
                throw new ApiError(404, 'Customer not found');
            }

            const oldValues = { ...existingCustomer.toObject() };
            const customer = await Customer.findByIdAndUpdate(
                customerId,
                updateData,
                { new: true, runValidators: true }
            );

            // Get changed fields
            const changedFields = Object.keys(updateData).filter(key =>
                JSON.stringify(oldValues[key]) !== JSON.stringify(updateData[key])
            );

            // Create notification
            await this.createNotification({
                message: `Customer ${customer.name} has been updated`,
                customer: customer,
                metadata: {
                    action: 'customer_updated',
                    updatedBy: userId || 'system',
                    changedFields
                }
            });

            // Emit socket event
            await this.emitSocketEvent('customer-updated', {
                userId,
                metadata: {
                    changedFields,
                    oldValues: {
                        name: oldValues.name,
                        email: oldValues.email,
                        phone: oldValues.phone
                    }
                }
            }, customer);

            return customer;
        } catch (error) {
            throw error;
        }
    }

    static async deleteCustomer(customerId, userId) {
        try {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                throw new ApiError(404, 'Customer not found');
            }

            await Customer.findByIdAndDelete(customerId);

            // Create notification
            await this.createNotification({
                message: `Customer ${customer.name} has been deleted`,
                customer: customer,
                metadata: {
                    action: 'customer_deleted',
                    deletedBy: userId || 'system',
                    customerEmail: customer.email
                }
            });

            // Emit socket event
            await this.emitSocketEvent('customer-deleted', { userId }, {
                _id: customer._id,
                name: customer.name,
                email: customer.email
            });

            return {
                message: 'Customer deleted successfully',
                deletedCustomer: {
                    _id: customer._id,
                    name: customer.name,
                    email: customer.email
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CustomerService;