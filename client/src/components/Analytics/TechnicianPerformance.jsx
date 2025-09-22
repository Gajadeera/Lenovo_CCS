import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { BarChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const TechnicianPerformance = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="Technician Performance"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-2"
            isDark={isDark}
        >
            <BarChartComponent
                data={data}
                dataKey="completedJobs"
                nameKey="name"
                title="Jobs Completed by Technician"
                barProps={{ name: "Completed Jobs" }}
                tooltipFormatter={(value) => [`${value} jobs`]}
                isDark={isDark}
            />

            <BarChartComponent
                data={data}
                dataKey="avgCompletionTime"
                nameKey="name"
                title="Average Job Completion Time (Hours)"
                barProps={{ name: "Avg. Completion Time" }}
                tooltipFormatter={(value) => [`${value} hours`]}
                isDark={isDark}
            />

            {data && (
                <DataTable
                    title="Technician Performance Metrics"
                    data={data}
                    columns={[
                        {
                            key: 'name',
                            header: 'Technician',
                            accessor: (row) => row.name
                        },
                        {
                            key: 'completedJobs',
                            header: 'Completed Jobs',
                            accessor: (row) => row.completedJobs,
                            align: 'right'
                        },
                        {
                            key: 'avgCompletionTime',
                            header: 'Avg. Time (hrs)',
                            accessor: (row) => row.avgCompletionTime,
                            align: 'right'
                        }
                    ]}
                    page={1}
                    limit={10}
                    totalCount={data.length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default TechnicianPerformance;