import React from 'react';
import PropTypes from 'prop-types';
import { FiX } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import { useDarkMode } from '../../../context/DarkModeContext';

const DeleteCustomerModal = ({
    isOpen,
    onClose,
    onConfirm,
    customerName
}) => {
    const { isDark } = useDarkMode();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Deletion"
            size="sm"
        >
            <div >
                <p className={`p-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Are you sure you want to delete customer <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{customerName}</span>?
                    This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className={isDark ? 'border-gray-600 hover:bg-gray-800' : ''}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

DeleteCustomerModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    customerName: PropTypes.string.isRequired
};

export default DeleteCustomerModal;