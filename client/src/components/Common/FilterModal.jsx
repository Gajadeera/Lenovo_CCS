import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FiSearch, FiX, FiFilter, FiChevronDown } from 'react-icons/fi';
import { useDarkMode } from '../../../context/DarkModeContext';
import Modal from '../Common/BaseModal';
import Button from '../Common/Button';

const FilterModal = ({
    isOpen,
    onClose,
    filters = [],
    onFilterChange,
    onClearFilters,
    title = 'Filters'
}) => {
    const { isDark } = useDarkMode();
    const [localFilters, setLocalFilters] = useState({});

    useEffect(() => {
        if (isOpen) {
            const initialFilters = {};
            filters.forEach(filter => {
                if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    initialFilters[filter.key] = filter.value;
                }
            });
            setLocalFilters(initialFilters);
        } else {
            setLocalFilters({});
        }
    }, [isOpen, filters]);

    const groupedFilters = [];
    for (let i = 0; i < filters.length; i += 3) {
        groupedFilters.push(filters.slice(i, i + 3));
    }

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        Object.entries(localFilters).forEach(([key, value]) => {
            onFilterChange(key, value);
        });
        onClose();
    };

    const handleClearAll = () => {
        const clearedFilters = {};
        filters.forEach(filter => {
            clearedFilters[filter.key] = '';
        });
        setLocalFilters(clearedFilters);
        onClearFilters();
    };

    const handleClose = () => {
        setLocalFilters({});
        onClose();
    };

    const hasActiveFilters = filters.some(filter => filter.value && filter.value !== '');

    const renderFilterInput = (filter) => {
        const currentValue = localFilters[filter.key] !== undefined ? localFilters[filter.key] : (filter.value || '');

        if (filter.type === 'select') {
            return (
                <div className="relative">
                    <select
                        value={currentValue}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className={`block appearance-none w-full text-sm pl-3 pr-8 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-white text-gray-800'} rounded-md focus:ring-2 focus:ring-[#52c3cb] focus:border-[#52c3cb] outline-none`}
                    >
                        <option value="">All {filter.label}</option>
                        {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                        <FiChevronDown className="h-4 w-4" />
                    </div>
                </div>
            );
        } else {
            return (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiSearch className="h-4 w-4" />
                    </div>
                    <input
                        type={filter.type || 'text'}
                        value={currentValue}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className={`block w-full text-sm pl-10 pr-3 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-white text-gray-800'} rounded-md focus:ring-2 focus:ring-[#52c3cb] focus:border-[#52c3cb] outline-none`}
                        placeholder={filter.placeholder || `Search ${filter.label}`}
                    />
                </div>
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            size="xl"
        >
            <div className={`space-y-6 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                {groupedFilters.map((filterRow, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filterRow.map((filter) => (
                            <div key={filter.key}>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {filter.label}
                                </label>
                                {renderFilterInput(filter)}
                            </div>
                        ))}
                        {filterRow.length < 3 && Array.from({ length: 3 - filterRow.length }).map((_, index) => (
                            <div key={`empty-${index}`} className="hidden md:block"></div>
                        ))}
                    </div>
                ))}

                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        onClick={handleClearAll}
                        variant="outline"
                        size="sm"
                        leftIcon={<FiX />}
                        className={isDark ? 'text-gray-300 hover:text-blue-400' : 'text-[#305777] hover:text-[#52c3cb]'}
                    >
                        Clear All
                    </Button>

                    <div className="flex space-x-2">
                        <Button
                            onClick={handleClose}
                            variant="secondary"
                            size="sm"
                            className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-[#305777] hover:bg-gray-100'}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApplyFilters}
                            variant="primary"
                            size="sm"
                            className="text-white bg-[#305777] hover:bg-[#23405d]"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

FilterModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            type: PropTypes.oneOf(['text', 'select', 'date']),
            value: PropTypes.any,
            options: PropTypes.arrayOf(
                PropTypes.shape({
                    value: PropTypes.any.isRequired,
                    label: PropTypes.string.isRequired,
                })
            ),
            placeholder: PropTypes.string,
        })
    ),
    onFilterChange: PropTypes.func.isRequired,
    onClearFilters: PropTypes.func.isRequired,
    title: PropTypes.string,
};

FilterModal.defaultProps = {
    filters: [],
    title: 'Filters',
};

export default FilterModal;