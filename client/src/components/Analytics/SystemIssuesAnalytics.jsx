import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, BarChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const SystemIssuesAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="System Issues Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-3"
            isDark={isDark}
        >
            <PieChartComponent
                data={data.byStatus}
                dataKey="count"
                nameKey="_id"
                title="Issues by Status"
                tooltipFormatter={(value, name) => [`${value} issues`, name]}
                isDark={isDark}
            />

            <PieChartComponent
                data={data.byPriority}
                dataKey="count"
                nameKey="_id"
                title="Issues by Priority"
                tooltipFormatter={(value, name) => [`${value} issues`, name]}
                isDark={isDark}
            />

            <BarChartComponent
                data={data.byCategory}
                dataKey="count"
                nameKey="_id"
                title="Issues by Category"
                barProps={{ name: "Issues" }}
                tooltipFormatter={(value) => [`${value} issues`]}
                isDark={isDark}
            />

            {data.recentIssues && (
                <DataTable
                    title="Recent Issues"
                    data={data.recentIssues}
                    columns={[
                        {
                            key: 'title',
                            header: 'Title',
                            accessor: (row) => row.title
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            accessor: (row) => row.status
                        },
                        {
                            key: 'priority',
                            header: 'Priority',
                            accessor: (row) => row.priority
                        },
                        {
                            key: 'date',
                            header: 'Date',
                            accessor: (row) => new Date(row.created_at).toLocaleDateString(),
                            align: 'right'
                        }
                    ]}
                    page={1}
                    limit={10}
                    totalCount={data.recentIssues.length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default SystemIssuesAnalytics;