import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiShield, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';

const SingleUserModal = ({ isOpen, onClose, userId, onUserUpdate }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { user: currentUser } = useAuth();

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:5000/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`
                    }
                }
            );
            setUser(response.data.user || response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch user');
            console.error('Error fetching user:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchUser();
        }
    }, [isOpen, userId, currentUser]);

    const handleUserUpdated = (updatedUser) => {
        // Refresh the user data after update
        fetchUser();
        if (onUserUpdate) {
            onUserUpdate(updatedUser);
        }
        setShowEditModal(false);
    };

    const handleDeleteUser = async () => {
        try {
            await axios.delete(
                `http://localhost:5000/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`
                    }
                }
            );
            setShowDeleteModal(false);
            onClose();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
                <div className="flex justify-center items-center h-40 text-gray-800 dark:text-gray-200">
                    Loading...
                </div>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
                <div className="flex justify-center items-center h-40 text-red-500 dark:text-red-400">
                    {error}
                </div>
            </Modal>
        );
    }

    if (!user) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
                <div className="flex justify-center items-center h-40 text-gray-800 dark:text-gray-200">
                    User not found
                </div>
            </Modal>
        );
    }

    const canEdit = ['administrator', 'manager'].includes(currentUser.role) || currentUser._id === userId;
    const canDelete = ['administrator', 'manager'].includes(currentUser.role) && currentUser._id !== userId;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="xl">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-teal-400 dark:border-teal-500">
                                {user.image?.url ? (
                                    <img
                                        src={user.image.url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <FiUser className="w-16 h-16 text-gray-600 dark:text-gray-300" />
                                )}
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {user.name}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                        {user?.role?.replace('_', ' ') || 'No role'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiMail className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Email
                                            </h3>
                                            <p className="text-gray-800 dark:text-gray-200">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiPhone className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Phone
                                            </h3>
                                            <p className="text-gray-800 dark:text-gray-200">
                                                {user.phone || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiShield className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Role
                                            </h3>
                                            <p className="text-gray-800 dark:text-gray-200 capitalize">
                                                {user?.role?.replace('_', ' ') || 'No role'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg mr-3">
                                            <FiUser className="text-teal-600 dark:text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </h3>
                                            <p className="text-gray-800 dark:text-gray-200">
                                                Active
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                                {canEdit && (
                                    <Button
                                        onClick={() => setShowEditModal(true)}
                                        variant="primary"
                                        icon={FiEdit}
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        onClick={() => setShowDeleteModal(true)}
                                        variant="danger"
                                        icon={FiTrash2}
                                        className="ml-2"
                                    >
                                        Delete User
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                userId={userId}
                onUserUpdate={handleUserUpdated}
            />

            {/* Delete User Modal */}
            <DeleteUserModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteUser}
                userName={user.name}
            />
        </>
    );
};

SingleUserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userId: PropTypes.string.isRequired,
    onUserUpdate: PropTypes.func
};

export default SingleUserModal;