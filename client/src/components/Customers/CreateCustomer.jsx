import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiUser, FiPhone, FiMail, FiMapPin, FiFileText } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import BaseInput from '../Common/BaseInput';
import BaseSelectInput from '../Common/BaseSelectInput';
import Button from '../Common/Button';

const CreateCustomerModal = ({ isOpen, onClose, onCreateCustomer }) => {
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
    const { user: currentUser } = useAuth();

    const customerTypeOptions = [
        { value: 'Personal', label: 'Personal' },
        { value: 'Enterprise', label: 'Enterprise' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = useCallback(() => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            customer_type: 'Personal',
            notes: ''
        });
        setError('');
        onClose();
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.phone || !formData.email) {
            setError('Name, Phone, and Email are required');
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                'http://localhost:5000/customers/',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
                    }
                }
            );

            if (onCreateCustomer) {
                onCreateCustomer(response.data);
            }
            handleClose();
        } catch (err) {
            console.error('Customer creation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Customer"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md flex items-center">
                        <FiX className="mr-2" />
                        {error}
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
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <BaseSelectInput
                            label="Customer Type"
                            name="customer_type"
                            value={formData.customer_type}
                            onChange={handleChange}
                            options={customerTypeOptions}
                        />
                    </div>

                    <div className="col-span-2">
                        <BaseInput
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            icon={FiMapPin}
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
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Customer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

CreateCustomerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateCustomer: PropTypes.func
};

export default CreateCustomerModal;