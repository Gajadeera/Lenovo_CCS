import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from './BaseInput';
import Button from './Button';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await axios.post('http://localhost:5000/users/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/30">
                {success ? (
                    <div className="text-center">
                        <FiCheckCircle className="mx-auto h-12 w-12 text-green-500 dark:text-green-400" />
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                            Request Received
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            An admin has been notified and will contact you shortly
                            to assist with your password reset.
                        </p>
                        <Button
                            onClick={() => navigate('/')}
                            className="mt-6 w-full"
                        >
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                                Need Password Help?
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Enter your email and an admin will assist you
                            </p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <Input
                                icon={FiMail}
                                type="email"
                                label="Work Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="your@company.com"
                            />

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                    <FiAlertCircle className="flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                loading={isSubmitting}
                                className="w-full"
                            >
                                Request Admin Assistance
                            </Button>
                        </form>
                        <div className="text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                            >
                                <FiArrowLeft className="mr-1" />
                                Back to login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;