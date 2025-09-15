import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import LoginModal from '../components/Common/LoginModal';
import Button from '../components/Common/Button';
import axios from 'axios';
import Logo from '../../Assets/imgs/ThakralOne_CCS_Logo.svg';
import LogoWhite from '../../Assets/imgs/A_gentleman_handing.png'; // Assuming you have a white version
import homeImage from '../../Assets/imgs/A_gentleman_handing.png';
import homeImageDark from '../../Assets/imgs/A_gentleman_handing.png'; // Optional: darker version
import { FiTool, FiBarChart2, FiPackage, FiArrowRight, FiLogIn } from 'react-icons/fi';

const Home = () => {
    const { user, signin } = useAuth();
    const { isDark } = useDarkMode();
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginState, setLoginState] = useState({
        email: localStorage.getItem('rememberedEmail') || '',
        password: '',
        rememberMe: Boolean(localStorage.getItem('rememberedEmail'))
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const roleRoutes = {
        administrator: '/administratorDashboard',
        technician: '/technicianDashboard',
        manager: '/managerDashboard',
        coordinator: '/coordinatorDashboard',
        parts_team: '/partsTeamDashboard'
    };

    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        if (!loginState.email || !loginState.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/users/signin', {
                email: loginState.email,
                password: loginState.password
            });

            // Handle remember me functionality
            if (loginState.rememberMe) {
                localStorage.setItem('rememberedEmail', loginState.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            signin({
                ...response.data.user,
                token: response.data.token
            });

            setIsLoginModalOpen(false);
            navigate(roleRoutes[response.data.user.role] || '/');

        } catch (error) {
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsLoginModalOpen(false);
        setError('');
    };

    return (
        <div className={`min-h-screen overflow-x-hidden flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* Hero Section */}
            <section className={`relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-[#164165]'}`}>
                <div className="absolute inset-0">
                    <div className={`w-full h-full ${isDark ? 'bg-gray-900 opacity-70' : 'bg-gray-800 opacity-50'}`}>
                        <img
                            src={isDark ? homeImageDark || homeImage : homeImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="absolute top-8 left-8 md:left-16 z-10">
                    <img
                        src={isDark ? LogoWhite || Logo : Logo}
                        alt="ThakralOne Logo"
                        className="h-16 md:h-20 w-auto"
                    />
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        ThakralOne CCS Service Portal
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 font-medium">
                        {user ? `Welcome back, ${user.name}!` : `Sign in to access your DashBoard`}
                    </p>

                    <div className="mt-8">
                        {!user ? (
                            <Button
                                variant="primary"
                                size="lg"
                                rightIcon={<FiLogIn className="w-5 h-5 stroke-1" />}
                                onClick={() => setIsLoginModalOpen(true)}
                                className="mx-auto"
                            >
                                Sign In
                            </Button>
                        ) : (
                            <Button
                                variant={isDark ? "primary" : "secondary"}
                                size="lg"
                                rightIcon={<FiArrowRight className="w-5 h-5 stroke-1" />}
                                onClick={() => navigate(roleRoutes[user.role])}
                                className="mx-auto"
                            >
                                Go to Dashboard
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className={`py-16 md:py-24 transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 ${isDark ? 'text-white' : 'text-[#164165]'}`}>
                        Our Services
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
                        {services.map((service, index) => (
                            <ServiceCard key={index} {...service} isDark={isDark} />
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className={`py-16 md:py-24 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-[#164165]'} text-white`}>
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8">
                        About ThakralOne Service
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed mb-8">
                        Our dedicated service team provides comprehensive support for all ThakralOne products.
                        With certified technicians, we ensure your devices get the best care through our
                        innovative service platform.
                    </p>
                    <Button
                        variant="accent"
                        size="lg"
                        rightIcon={<FiArrowRight className="w-5 h-5 stroke-1" />}
                        className="mx-auto"
                    >
                        Learn More
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-8 mt-auto transition-colors duration-300 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                <div className="container mx-auto px-4 text-center">
                    <p>© {new Date().getFullYear()} ThakralOne CCS Service Portal. All rights reserved.</p>
                </div>
            </footer>

            {/* Simplified Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={closeModal}
                formData={loginState}
                handleChange={handleLoginChange}
                handleSubmit={handleLoginSubmit}
                isSubmitting={isSubmitting}
                error={error}
            />
        </div>
    );
};

// Service data moved outside component for better organization
const services = [
    {
        icon: FiTool,
        title: "Repair Tracking",
        description: "Real-time updates on repair job status with comprehensive tracking."
    },
    {
        icon: FiBarChart2,
        title: "Performance Analytics",
        description: "Comprehensive reports on technical teams and service metrics."
    },
    {
        icon: FiPackage,
        title: "Parts Management",
        description: "Efficient parts tracking with automated inventory alerts."
    }
];

// Updated ServiceCard component with dark mode support
const ServiceCard = ({ icon: Icon, title, description, isDark }) => (
    <div className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}>
        <div className="p-6 md:p-8">
            <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-full ${isDark ? 'bg-[#52c3cb] bg-opacity-20' : 'bg-[#52c3cb] bg-opacity-20'}`}>
                    <Icon className={`w-8 h-8 stroke-1 ${isDark ? 'text-[#52c3cb]' : 'text-[#164165]'}`} />
                </div>
            </div>
            <h3 className={`text-xl md:text-2xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-[#164165]'}`}>
                {title}
            </h3>
            <p className={isDark ? 'text-gray-300 text-center' : 'text-gray-700 text-center'}>
                {description}
            </p>
        </div>
    </div>
);

export default Home;