// ChartComponents.jsx
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { NoDataMessage, getChartColors } from './BaseAnalytics';
import { CustomTooltip } from './CustomTooltip';

export const PieChartComponent = ({ data, dataKey, nameKey, title, tooltipFormatter, isDark = false }) => {
    if (!data || data.length === 0) return <NoDataMessage isDark={isDark} />;

    const colors = getChartColors(isDark);
    const borderColor = isDark ? 'white' : 'black';

    return (
        <div className={`p-4 rounded-lg shadow-sm flex flex-col border ${isDark ? 'bg-gray-800 border-white' : 'bg-white border-black'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-[#1E4065]'}`}>{title}</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={dataKey}
                            nameKey={nameKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text
                                        x={x} y={y}
                                        fill={colors.text}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                    >
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.dataColors[index % colors.dataColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip isDark={isDark} formatter={tooltipFormatter} />}
                        />
                        <Legend
                            wrapperStyle={{ color: colors.text }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const BarChartComponent = ({ data, dataKey, nameKey, title, tooltipFormatter, barProps = {}, isDark = false }) => {
    if (!data || data.length === 0) return <NoDataMessage isDark={isDark} />;

    const colors = getChartColors(isDark);
    const borderColor = isDark ? 'white' : 'black';

    return (
        <div className={`p-4 rounded-lg shadow-sm flex flex-col border ${isDark ? 'bg-gray-800 border-white' : 'bg-white border-black'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-[#1E4065]'}`}>{title}</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey={nameKey} stroke={colors.text} />
                        <YAxis stroke={colors.text} />
                        <Tooltip content={<CustomTooltip isDark={isDark} formatter={tooltipFormatter} />} />
                        <Legend wrapperStyle={{ color: colors.text }} />
                        <Bar
                            dataKey={dataKey}
                            fill={colors.dataColors[2]}
                            radius={[4, 4, 0, 0]}
                            {...barProps}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const LineChartComponent = ({ data, dataKey, nameKey, title, tooltipFormatter, lineProps = {}, isDark = false }) => {
    if (!data || data.length === 0) return <NoDataMessage isDark={isDark} />;

    const colors = getChartColors(isDark);
    const borderColor = isDark ? 'white' : 'black';

    return (
        <div className={`p-4 rounded-lg shadow-sm flex flex-col border ${isDark ? 'bg-gray-800 border-white' : 'bg-white border-black'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-[#1E4065]'}`}>{title}</h3>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey={nameKey} stroke={colors.text} />
                        <YAxis stroke={colors.text} />
                        <Tooltip content={<CustomTooltip isDark={isDark} formatter={tooltipFormatter} />} />
                        <Legend wrapperStyle={{ color: colors.text }} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={colors.dataColors[1]}
                            activeDot={{ r: 8, stroke: colors.background, strokeWidth: 2 }}
                            {...lineProps}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};