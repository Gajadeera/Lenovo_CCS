import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
    const getStatusClasses = () => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Approved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            case 'Fulfilled':
                return 'bg-blue-100 text-blue-800';
            case 'Pending Assignment':
                return 'bg-purple-100 text-purple-800';
            case 'Assigned':
                return 'bg-indigo-100 text-indigo-800';
            case 'In Progress':
                return 'bg-amber-100 text-amber-800';
            case 'Closed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses()}`}>
            {status}
        </span>
    );
};

export default StatusBadge;