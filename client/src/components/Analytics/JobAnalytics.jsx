import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, LineChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const JobAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    console.log('JobAnalytics received data:', data);

    if (!data) return <LoadingSpinner />;

    const hasStatusData = data.statusDistribution && data.statusDistribution.length > 0;
    const hasPriorityData = data.priorityDistribution && data.priorityDistribution.length > 0;
    const hasTimeData = data.jobsOverTime && data.jobsOverTime.length > 0;
    const pieTooltipFormatter = (value, name) => [`${value}`, name];
    const lineTooltipFormatter = (value) => [`${value}`, 'jobs'];

    return (
        <BaseAnalytics
            title="Job Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-2"
            isDark={isDark}
        >
            {hasStatusData ? (
                <PieChartComponent
                    data={data.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    title="Job Status Distribution"
                    tooltipFormatter={pieTooltipFormatter}
                    isDark={isDark}
                />
            ) : (
                <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 flex items-center justify-center`}>
                    <p className="text-gray-500">No status data available</p>
                </div>
            )}

            {hasPriorityData ? (
                <PieChartComponent
                    data={data.priorityDistribution}
                    dataKey="value"
                    nameKey="name"
                    title="Job Priority Distribution"
                    tooltipFormatter={pieTooltipFormatter}
                    isDark={isDark}
                />
            ) : (
                <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 flex items-center justify-center`}>
                    <p className="text-gray-500">No priority data available</p>
                </div>
            )}

            {hasTimeData ? (
                <LineChartComponent
                    data={data.jobsOverTime}
                    dataKey="count"
                    nameKey="date"
                    title="Jobs Created Over Time"
                    tooltipFormatter={lineTooltipFormatter}
                    isDark={isDark}
                />
            ) : (
                <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 flex items-center justify-center`}>
                    <p className="text-gray-500">No timeline data available</p>
                </div>
            )}
            {hasStatusData ? (
                <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                    <DataTable
                        title="Job Statistics"
                        data={data.statusDistribution}
                        columns={[
                            {
                                key: 'name',
                                header: 'Status',
                                accessor: (row) => row.name
                            },
                            {
                                key: 'value',
                                header: 'Count',
                                accessor: (row) => row.value,
                                align: 'right'
                            }
                        ]}
                        page={1}
                        limit={10}
                        totalCount={data.statusDistribution.length}
                        onPageChange={() => { }}
                        isDark={isDark}
                    />
                </div>
            ) : (
                <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 flex items-center justify-center`}>
                    <p className="text-gray-500">No data available for table</p>
                </div>
            )}
        </BaseAnalytics>
    );
};

export default JobAnalytics;