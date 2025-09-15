// PartsAnalytics.jsx
import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, BarChartComponent, LineChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const PartsAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="Parts Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-3"
            isDark={isDark}
        >
            <PieChartComponent
                data={data.statusDistribution}
                dataKey="value"
                nameKey="name"
                title="Parts Request Status"
                tooltipFormatter={(value, name) => [`${value} parts`, name]}
                isDark={isDark}
            />

            <BarChartComponent
                data={data.urgencyDistribution}
                dataKey="value"
                nameKey="name"
                title="Parts Request Urgency"
                barProps={{ name: "Request Count" }}
                tooltipFormatter={(value) => [`${value} requests`]}
                isDark={isDark}
            />

            <LineChartComponent
                data={data.partsOverTime}
                dataKey="count"
                nameKey="date"
                title="Parts Requests Over Time"
                lineProps={{ name: "Parts Requests" }}
                tooltipFormatter={(value) => [`${value} requests`]}
                isDark={isDark}
            />

            {(data.statusDistribution || data.urgencyDistribution) && (
                <DataTable
                    title="Parts Request Statistics"
                    data={[
                        ...(data.statusDistribution?.map(item => ({
                            metric: `Status: ${item.name}`,
                            value: item.value
                        })) || []),
                        ...(data.urgencyDistribution?.map(item => ({
                            metric: `Urgency: ${item.name}`,
                            value: item.value
                        })) || [])
                    ]}
                    columns={[
                        {
                            key: 'metric',
                            header: 'Metric',
                            accessor: (row) => row.metric
                        },
                        {
                            key: 'value',
                            header: 'Value',
                            accessor: (row) => row.value,
                            align: 'right'
                        }
                    ]}
                    page={1}
                    limit={10}
                    totalCount={[
                        ...(data.statusDistribution || []),
                        ...(data.urgencyDistribution || [])
                    ].length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default PartsAnalytics;