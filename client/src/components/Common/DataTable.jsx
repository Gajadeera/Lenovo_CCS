import PropTypes from 'prop-types';
import { FiAlertCircle } from 'react-icons/fi';
import { useDarkMode } from '../../../context/DarkModeContext';

const DataTable = ({
    data,
    columns,
    loading,
    page,
    limit,
    totalCount,
    onPageChange,
    rowActions,
    onRowClick,
    rowClassName = '',
    headerClassName = 'bg-[#1e4065] text-white',
    emptyStateMessage = 'No data found',
    loadingMessage = 'Loading...',
    error = null,
}) => {
    const { isDark } = useDarkMode();
    const totalPages = Math.ceil(totalCount / limit);

    const handleRowClick = (item) => {
        if (onRowClick) {
            onRowClick(item);
        }
    };

    if (loading && data.length === 0) {
        return (
            <div className={`flex justify-center items-center p-6 space-x-3 ${isDark ? 'text-gray-300' : 'text-[#305777]'}`}>
                <div className={`animate-spin rounded-full h-5 w-5 border-2 ${isDark ? 'border-blue-400 border-t-transparent' : 'border-[#52c3cb] border-t-transparent'}`}></div>
                <span className="text-sm">{loadingMessage}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-lg overflow-hidden`}>
                <div className={`p-6 text-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                    <div className={`inline-flex items-center justify-center ${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-full p-3 mb-3`}>
                        <FiAlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Unable to load data</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error.message || 'An error occurred while fetching data'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-[#305777] hover:bg-[#23405d] focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#52c3cb] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={`border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-lg overflow-hidden`}>
                <div className={`text-center p-8 ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-white text-[#305777]'}`}>
                    <h3 className="text-lg font-bold mb-2">{emptyStateMessage}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className={`border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-lg overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={headerClassName}>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                >
                                    {column.header}
                                </th>
                            ))}
                            {rowActions && rowActions.length > 0 && (
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                        {data.map((item, rowIndex) => (
                            <tr
                                key={item._id || rowIndex}
                                onClick={() => handleRowClick(item)}
                                className={`${onRowClick ? 'cursor-pointer hover:bg-[#52c3cb]/10 dark:hover:bg-gray-800' : ''} ${rowClassName} ${isDark ? 'text-gray-300' : 'text-gray-800'}`}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${column.key}-${rowIndex}`}
                                        className={`px-4 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}
                                    >
                                        {typeof column.accessor === 'function'
                                            ? column.accessor(item)
                                            : item[column.accessor]}
                                    </td>
                                ))}
                                {rowActions && rowActions.length > 0 && (
                                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                                        <div className="flex justify-end space-x-2">
                                            {rowActions.map((action, actionIndex) => (
                                                <button
                                                    key={actionIndex}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        action.onClick(item);
                                                    }}
                                                    className={`${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-[#305777]'} focus:outline-none p-1.5 rounded-md hover:bg-opacity-10 ${isDark ? 'hover:bg-blue-400' : 'hover:bg-[#305777]'}`}
                                                    title={action.title}
                                                >
                                                    {action.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {totalCount > limit && (
                <div className={`flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-[#305777]'}`}>
                    <div className="flex items-center space-x-2 mb-3 sm:mb-0">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={page <= 1}
                            className={`px-3 py-1.5 text-sm rounded-md ${page <= 1 ? 'text-gray-400 cursor-not-allowed' : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-[#52c3cb]/10 text-[#305777]'}`}
                        >
                            First
                        </button>

                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className={`px-3 py-1.5 text-sm rounded-md ${page <= 1 ? 'text-gray-400 cursor-not-allowed' : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-[#52c3cb]/10 text-[#305777]'}`}
                        >
                            Previous
                        </button>

                        <span className="text-sm font-medium px-2">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className={`px-3 py-1.5 text-sm rounded-md ${page >= totalPages ? 'text-gray-400 cursor-not-allowed' : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-[#52c3cb]/10 text-[#305777]'}`}
                        >
                            Next
                        </button>

                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={page >= totalPages}
                            className={`px-3 py-1.5 text-sm rounded-md ${page >= totalPages ? 'text-gray-400 cursor-not-allowed' : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-[#52c3cb]/10 text-[#305777]'}`}
                        >
                            Last
                        </button>
                    </div>

                    <p className="text-sm">
                        Showing <span className="font-bold">{(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)}</span> of{' '}
                        <span className="font-bold">{totalCount}</span> items
                    </p>
                </div>
            )}
        </div>
    );
};

DataTable.propTypes = {
    data: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            header: PropTypes.string.isRequired,
            accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
        })
    ).isRequired,
    loading: PropTypes.bool,
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    rowActions: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.node.isRequired,
            title: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
        })
    ),
    onRowClick: PropTypes.func,
    rowClassName: PropTypes.string,
    headerClassName: PropTypes.string,
    emptyStateMessage: PropTypes.string,
    loadingMessage: PropTypes.string,
    error: PropTypes.shape({
        message: PropTypes.string,
    }),
};

DataTable.defaultProps = {
    loading: false,
    rowClassName: '',
    headerClassName: 'bg-[#1e4065] text-white',
    emptyStateMessage: 'No data found',
    loadingMessage: 'Loading...',
    error: null,
};

export default DataTable;