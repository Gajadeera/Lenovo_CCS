import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiRefreshCw, FiUser, FiPhone, FiMail, FiMapPin, FiFileText } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';

const EditCustomerModal = ({ isOpen, onClose, customerId, customerData, onCustomerUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        customer_type: 'Personal',
        notes: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const { user: currentUser } = useAuth();

    const customerTypeOptions = [
        { value: 'Personal', label: 'Personal' },
        { value: 'Enterprise', label: 'Enterprise' }
    ];

    useEffect(() => {
        const fetchCustomerData = async () => {
            if (!isOpen) return;

            try {
                setFetching(true);
                setError('');

                // If customerData is provided, use that instead of fetching
                if (customerData) {
                    setFormData({
                        name: customerData.name || '',
                        phone: customerData.phone || '',
                        email: customerData.email || '',
                        address: customerData.address || '',
                        customer_type: customerData.customer_type || 'Personal',
                        notes: customerData.notes || ''
                    });
                    return;
                }

                const response = await axios.get(
                    `http://localhost:5000/customers/${customerId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${currentUser?.token}`
                        }
                    }
                );

                setFormData({
                    name: response.data.name || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    address: response.data.address || '',
                    customer_type: response.data.customer_type || 'Personal',
                    notes: response.data.notes || ''
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load customer data');
            } finally {
                setFetching(false);
            }
        };

        fetchCustomerData();
    }, [isOpen, customerId, customerData, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = useCallback(() => {
        setError('');
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.phone || !formData.email) {
            setError('Name, Phone, and Email are required');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.put(
                `http://localhost:5000/customers/${customerId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
                    }
                }
            );

            if (onCustomerUpdated) {
                onCustomerUpdated(response.data);
            }
            handleClose();
        } catch (err) {
            console.error('Customer update error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Customer"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
                        <FiX className="mr-2" />
                        {error}
                    </div>
                )}

                {fetching && (
                    <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md flex items-center">
                        <FiRefreshCw className="mr-2 animate-spin" />
                        Loading customer data...
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <BaseInput
                            label="Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            icon={FiUser}
                            required
                            disabled={loading || fetching}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <BaseInput
                            type="email"
                            label="Email *"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            icon={FiMail}
                            required
                            disabled={loading || fetching}
                        />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <BaseInput
                            type="tel"
                            label="Phone *"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            icon={FiPhone}
                            required
                            disabled={loading || fetching}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <BaseSelectInput
                            label="Customer Type"
                            name="customer_type"
                            value={formData.customer_type}
                            onChange={handleChange}
                            options={customerTypeOptions}
                            disabled={loading || fetching}
                        />
                    </div>

                    <div className="col-span-2">
                        <BaseInput
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            icon={FiMapPin}
                            disabled={loading || fetching}
                        />
                    </div>

                    <div className="col-span-2">
                        <BaseInput
                            type="textarea"
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            icon={FiFileText}
                            rows={3}
                            disabled={loading || fetching}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading || fetching}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        disabled={loading || fetching}
                    >
                        {loading ? 'Updating...' : 'Update Customer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

EditCustomerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    customerId: PropTypes.string.isRequired,
    customerData: PropTypes.object,
    onCustomerUpdated: PropTypes.func
};

export default EditCustomerModal;