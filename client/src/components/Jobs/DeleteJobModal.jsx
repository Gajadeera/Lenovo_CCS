import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';
import { useDarkMode } from '../../../context/DarkModeContext';

const DeleteJobModal = ({
    isOpen,
    onClose,
    onConfirm,
    jobNumber
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const { isDark } = useDarkMode();

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Confirm Deletion"
            size="sm"
        >
            <div>
                <p className={`p-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Are you sure you want to delete job <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{jobNumber}</span>?
                    This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className={isDark ? 'border-gray-600 hover:bg-gray-800' : ''}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleConfirm}
                        isLoading={isDeleting}
                        disabled={isDeleting}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

DeleteJobModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    jobNumber: PropTypes.string.isRequired
};

export default DeleteJobModal;