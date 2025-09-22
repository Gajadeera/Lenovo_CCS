import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import LoginModal from '../components/Common/LoginModal';
import Button from '../components/Common/Button';
import axios from 'axios';
import Logo from '../../Assets/imgs/ThakralOne_CCS_Logo.svg';
import LogoWhite from '../../Assets/imgs/ThakralOne_CCS_Logo.svg';
import homeImage from '../../Assets/imgs/Image_illustration.png';
import { FiTool, FiBarChart2, FiPackage, FiArrowRight, FiLogIn } from 'react-icons/fi';

const Home = () => {
    const { user, signin } = useAuth();
    const { isDark } = useDarkMode();
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginState, setLoginState] = useState({
        email: localStorage.getItem('rememberedEmail') || '',
        password: '',
        rememberMe: Boolean(localStorage.getItem('rememberedEmail')),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [userStats, setUserStats] = useState({
        total: 0,
        active: 0,
        newLast24Hours: 0
    });

    const roleRoutes = {
        administrator: '/administratorDashboard',
        technician: '/technicianDashboard',
        manager: '/managerDashboard',
        coordinator: '/coordinatorDashboard',
        parts_team: '/partsTeamDashboard',
    };

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/users/counts');
                setUserStats(response.data);
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
            }
        };

        fetchUserStats();
    }, []);

    const handleLoginChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLoginState((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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
                password: loginState.password,
            });
            if (loginState.rememberMe) {
                localStorage.setItem('rememberedEmail', loginState.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            signin({ ...response.data.user, token: response.data.token });
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
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
            <section className={`relative min-h-screen flex items-center overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                <div className="absolute inset-0">
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'}`}></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
                </div>

                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-20 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute top-40 right-32 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute bottom-32 left-40 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute bottom-20 right-20 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute top-60 left-60 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute top-80 right-60 w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-12 items-center">

                        <div className="space-y-8 lg:col-span-2">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#52c3cb] to-[#164165] shadow-lg">
                                    <img src={isDark ? LogoWhite || Logo : Logo} alt="Logo" className="h-8 w-auto" />
                                </div>
                                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-400 to-transparent"></div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Portal</span>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                                    <span className="block text-gray-900 dark:text-white">ThakralOne</span>
                                    <span className="block bg-gradient-to-r from-[#52c3cb] to-[#164165] bg-clip-text text-transparent">
                                        CCS Platform
                                    </span>
                                </h1>
                                <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-light max-w-lg">
                                    {user ? `Welcome back, ${user.name}!` : 'Streamline your service operations with our comprehensive management platform.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                {!user ? (
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        rightIcon={<FiLogIn />}
                                        onClick={() => setIsLoginModalOpen(true)}
                                        className="transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                                    >
                                        Sign In to Get Started
                                    </Button>
                                ) : (
                                    <Button
                                        variant="accent"
                                        size="lg"
                                        rightIcon={<FiArrowRight />}
                                        onClick={() => navigate(roleRoutes[user.role])}
                                        className="group relative overflow-hidden bg-gradient-to-r from-[#164165] to-[#52c3cb] hover:from-[#52c3cb] hover:to-[#164165] transition-all duration-300 shadow-xl hover:shadow-2xl"
                                    >
                                        <span className="relative z-10">Go to Dashboard</span>
                                        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Support</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">Security</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">High</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">High</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Performance</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Image Area */}
                        <div className="relative lg:pl-2 lg:col-span-3">
                            <div className="relative">
                                {/* Background Elements */}
                                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-[#52c3cb]/20 to-[#164165]/20 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>

                                {/* Main Image Container */}
                                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 w-full">
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                        <img
                                            src={homeImage}
                                            alt="ThakralOne CCS Platform"
                                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>

                                    {/* Floating Cards */}
                                    <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Live Status</span>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-[#52c3cb] to-[#164165] rounded-lg flex items-center justify-center">
                                                <FiTool className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Active Jobs</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">12 in progress</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services & About Combined */}
            <section className="min-h-screen flex flex-col">
                {/* Services */}
                <div className="flex-[2] py-16 px-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-20 left-20 w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="absolute top-40 right-32 w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="absolute bottom-32 left-40 w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="absolute bottom-20 right-20 w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-center">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                Our Services
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Comprehensive solutions designed to streamline your service experience
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {services.map((s, i) => (
                                <div
                                    key={i}
                                    className={`group p-8 rounded-3xl shadow-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${isDark
                                        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-sm'
                                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50'
                                        }`}
                                >
                                    <div className="flex justify-center mb-8">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#52c3cb] to-[#164165] shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <s.icon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-center mb-6 group-hover:text-[#52c3cb] transition-colors duration-300">
                                        {s.title}
                                    </h3>
                                    <p className="text-center text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
                                        {s.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </section>

            {/* Footer */}
            <footer className={`py-6 text-center relative overflow-hidden ${isDark ? 'bg-gradient-to-t from-gray-900 to-gray-800 text-gray-400' : 'bg-gradient-to-t from-gray-100 to-white text-gray-600'}`}>
                <div className="absolute inset-0 opacity-50">
                    <div className="absolute top-5 left-10 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute top-10 right-20 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute bottom-5 left-20 w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="absolute bottom-10 right-10 w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <div className="relative z-10">
                    <div className="mb-2">
                        <img src={isDark ? LogoWhite || Logo : Logo} alt="Logo" className="h-8 mx-auto opacity-60" />
                    </div>
                    <p className="text-sm font-medium">
                        © {new Date().getFullYear()} ThakralOne CCS Service Portal
                    </p>
                    <p className="text-xs mt-1 opacity-75">
                        Excellence in Service, Innovation in Solutions
                    </p>
                </div>
            </footer>

            {/* Login Modal */}
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

const services = [
    { icon: FiTool, title: 'Repair Tracking', description: 'Real-time updates on repair job status.' },
    { icon: FiBarChart2, title: 'Performance Analytics', description: 'Detailed insights and reports.' },
    { icon: FiPackage, title: 'Parts Management', description: 'Automated tracking with alerts.' },
];

export default Home;
