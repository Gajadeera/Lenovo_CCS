import PropTypes from 'prop-types';

const TextArea = ({
    label,
    name,
    value,
    onChange,
    placeholder = '',
    error = '',
    disabled = false,
    required = false,
    className = '',
    rows = 3,
    ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={name} className="block text-md font-medium text-[#1E4065] dark:text-blue-300 mb-2">
                    {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={`
                    block w-full text-md border rounded-md p-3 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-[#65C2CB] dark:focus:ring-blue-400 focus:border-[#65C2CB] dark:focus:border-blue-400
                    ${error ? 'border-red-500 dark:border-red-400' : 'border-[#1E4065]/30 dark:border-gray-600'}
                    ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-80' : 'bg-white dark:bg-gray-800'}
                    text-[#1E4065] dark:text-gray-200
                    placeholder-gray-500 dark:placeholder-gray-400
                `}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

TextArea.propTypes = {
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    className: PropTypes.string,
    rows: PropTypes.number,
};

export default TextArea;