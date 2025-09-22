import React from 'react';
import { PieChart, BarChart, LineChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const getChartColors = (isDark) => {
    return {
        dataColors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
        text: isDark ? '#E5E7EB' : '#374151',
        background: isDark ? '#1F2937' : '#FFFFFF',
        grid: isDark ? '#4B5563' : '#E5E7EB',
        tooltipBackground: isDark ? '#374151' : '#FFFFFF',
        tooltipBorder: isDark ? '#4B5563' : '#E5E7EB',
    };
};

export const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export const NoDataMessage = ({ message = "No data available", isDark = false }) => (
    <div className={`flex justify-center items-center h-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {message}
    </div>
);

const BaseAnalytics = ({
    title,
    data,
    children,
    loading,
    error,
    chartGrid = "grid-cols-1 md:grid-cols-2",
    isDark = false
}) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <div className={isDark ? 'text-red-400' : 'text-red-600'}>Error: {error}</div>;

    return (
        <div className={`p-4 space-y-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1E4065]'}`}>{title}</h2>
            <div className={`grid ${chartGrid} gap-6`}>
                {children}
            </div>
        </div>
    );
};

export default BaseAnalytics;