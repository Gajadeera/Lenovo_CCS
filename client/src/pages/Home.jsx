import React, { useState } from 'react';
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

    const roleRoutes = {
        administrator: '/administratorDashboard',
        technician: '/technicianDashboard',
        manager: '/managerDashboard',
        coordinator: '/coordinatorDashboard',
        parts_team: '/partsTeamDashboard',
    };

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
            {/* Hero */}
            <section
                className={`relative min-h-[85vh] flex items-center justify-between px-6 md:px-20 ${isDark ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-r from-[#164165] via-[#1f5780] to-[#52c3cb]'
                    }`}
            >
                {/* Left content */}
                <div className="z-10 max-w-xl">
                    <img src={isDark ? LogoWhite || Logo : Logo} alt="Logo" className="h-16 mb-8" />
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                        ThakralOne <br /> CCS Service Portal
                    </h1>
                    <p className="text-xl opacity-90 mb-8">
                        {user ? `Welcome back, ${user.name}!` : 'Your one-stop solution for service excellence.'}
                    </p>
                    {!user ? (
                        <Button variant="primary" size="lg" rightIcon={<FiLogIn />} onClick={() => setIsLoginModalOpen(true)}>
                            Sign In
                        </Button>
                    ) : (
                        <Button
                            variant="accent"
                            size="lg"
                            rightIcon={<FiArrowRight />}
                            onClick={() => navigate(roleRoutes[user.role])}
                        >
                            Go to Dashboard
                        </Button>
                    )}
                </div>

                {/* Right image */}
                <div className="hidden md:flex justify-center items-center w-1/2">
                    <img src={homeImage} alt="Hero" className="max-h-[400px] drop-shadow-2xl" />
                </div>
            </section>

            {/* Services */}
            <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-center text-4xl font-bold mb-16">Our Services</h2>
                <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                    {services.map((s, i) => (
                        <div
                            key={i}
                            className={`p-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-3 ${isDark ? 'bg-gray-800/70 border border-gray-700' : 'bg-white border border-gray-200'
                                }`}
                        >
                            <div className="flex justify-center mb-6">
                                <s.icon className="w-12 h-12 text-[#52c3cb]" />
                            </div>
                            <h3 className="text-2xl font-semibold text-center mb-4">{s.title}</h3>
                            <p className="text-center opacity-80">{s.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* About */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#164165] to-[#52c3cb] -skew-y-3 transform" />
                <div className="relative max-w-4xl mx-auto text-center text-white px-6">
                    <h2 className="text-4xl font-bold mb-6">About ThakralOne Service</h2>
                    <p className="mb-8 leading-relaxed">
                        Our dedicated service team provides comprehensive support for all ThakralOne products. With certified
                        technicians and innovative solutions, we ensure excellence in every repair and service.
                    </p>
                    <Button variant="accent" size="lg" rightIcon={<FiArrowRight />}>
                        Learn More
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-6 text-center ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                © {new Date().getFullYear()} ThakralOne CCS Service Portal
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
