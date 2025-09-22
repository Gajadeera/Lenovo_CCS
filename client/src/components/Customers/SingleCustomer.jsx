import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiFileText, FiCalendar, FiEdit, FiTrash2 } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditCustomerModal from './EditCustomerModal';
import DeleteCustomerModal from './DeleteCustomerModal';

const ViewCustomerModal = ({ isOpen, onClose, customerId }) => {
    const { user: currentUser } = useAuth();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen || !customerId) return;

            try {
                setLoading(true);
                setError(null);
                const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };

                const response = await axios.get(`http://localhost:5000/customers/${customerId}`, config);
                setCustomer(response.data);

            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch customer data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId, currentUser, isOpen]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const renderCompactField = (label, value, icon) => (
        <div className="col-span-4 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="flex items-center text-sm h-8">
                {icon && React.cloneElement(icon, { className: "text-gray-400 mr-1", size: 14 })}
                <span className="truncate">{value || 'N/A'}</span>
            </div>
        </div>
    );

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleDeleteClick = () => {
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    const handleDeleteModalClose = () => {
        setDeleteError(null);
        setShowDeleteModal(false);
    };

    const handleCustomerUpdated = (updatedCustomer) => {
        setCustomer(updatedCustomer);
        setShowEditModal(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${currentUser?.token}` } };
            await axios.delete(`http://localhost:5000/customers/${customerId}`, config);
            onClose();
            setShowDeleteModal(false);
        } catch (err) {
            setDeleteError(err.response?.data?.message || err.message || 'Failed to delete customer');
        }
    };

    if (loading) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
            <div className="flex justify-center items-center h-40">Loading...</div>
        </Modal>
    );

    if (error) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
            <div className="flex justify-center items-center h-40 text-red-500 text-sm">{error}</div>
        </Modal>
    );

    if (!customer) return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
            <div className="flex justify-center items-center h-40 text-sm">Customer not found</div>
        </Modal>
    );

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Customer: ${customer.name}`} size="xl">
                <div className="p-4 space-y-3">
                    {error && (
                        <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-center">
                            <FiX className="mr-1" size={14} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                        {renderCompactField("Name", customer.name, <FiUser />)}
                        {renderCompactField("Customer Type", customer.customer_type, <FiShield />)}
                        {renderCompactField("Email", customer.email, <FiMail />)}
                        {renderCompactField("Phone", customer.phone, <FiPhone />)}
                        {renderCompactField("Address", customer.address, <FiMapPin />)}
                        {renderCompactField("Created", formatDate(customer.created_at), <FiCalendar />)}
                    </div>

                    {customer.notes && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                            <div className="text-sm p-2 bg-gray-50 rounded border border-gray-200">
                                {customer.notes}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            size="small"
                        >
                            Close
                        </Button>
                        {(currentUser?.role === 'administrator' || currentUser?.role === 'manager') && (
                            <>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleEditClick}
                                    size="small"
                                    icon={FiEdit}
                                >
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={handleDeleteClick}
                                    size="small"
                                    icon={FiTrash2}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            <EditCustomerModal
                isOpen={showEditModal}
                onClose={handleEditModalClose}
                customerId={customerId}
                customerData={customer}
                onCustomerUpdated={handleCustomerUpdated}
            />

            <DeleteCustomerModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleDeleteConfirm}
                customerName={customer.name}
                error={deleteError}
            />
        </>
    );
};

ViewCustomerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    customerId: PropTypes.string.isRequired
};

export default ViewCustomerModal;