import React from 'react';
import PropTypes from 'prop-types';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import Modal from '../Common/BaseModal';
import Input from '../Common/BaseInput';
import Button from '../Common/Button';

const LoginModal = ({
    isOpen,
    onClose,
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    error
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sign in to your account"
            size="sm"
        >
            <div className="space-y-6 py-4 px-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 stroke-1" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Input
                            icon={FiMail}
                            iconProps={{ className: "text-[#164165] dark:text-blue-400 stroke-1" }}
                            type="email"
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full py-2 focus:outline-none focus:ring-2 focus:ring-[#52c3cb] dark:focus:ring-blue-400"
                            autoComplete="username"
                        />
                    </div>

                    <div className="relative">
                        <Input
                            icon={FiLock}
                            iconProps={{ className: "text-[#164165] dark:text-blue-400 stroke-1" }}
                            type="password"
                            label="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full py-2 focus:outline-none focus:ring-2 focus:ring-[#52c3cb] dark:focus:ring-blue-400"
                            autoComplete="current-password"
                        />
                        <div className="mt-2 text-right">
                            <a
                                href="/forgot-password"
                                className="text-sm text-[#164165] dark:text-blue-400 hover:text-[#52c3cb] dark:hover:text-blue-300 hover:underline transition-colors duration-200"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <div className="flex items-center mt-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe || false}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-[#164165] dark:text-blue-400 focus:ring-[#52c3cb] dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Remember me</span>
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        Sign In
                    </Button>
                </form>
            </div>
        </Modal>
    );
};

LoginModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        email: PropTypes.string,
        password: PropTypes.string,
        rememberMe: PropTypes.bool,
    }).isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    error: PropTypes.string,
};

export default LoginModal;