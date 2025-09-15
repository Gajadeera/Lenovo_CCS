// CustomerAnalytics.jsx
import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, LineChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const CustomerAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="Customer Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-2"
            isDark={isDark}
        >
            <PieChartComponent
                data={data.customerTypeDistribution}
                dataKey="value"
                nameKey="name"
                title="Customer Type Distribution"
                tooltipFormatter={(value, name) => [`${value} customers`, name]}
                isDark={isDark}
            />

            <LineChartComponent
                data={data.customersOverTime}
                dataKey="count"
                nameKey="date"
                title="Customer Acquisition Over Time"
                lineProps={{ name: "New Customers" }}
                tooltipFormatter={(value) => [`${value} customers`]}
                isDark={isDark}
            />

            {data.customerTypeDistribution && (
                <DataTable
                    title="Customer Statistics"
                    data={data.customerTypeDistribution}
                    columns={[
                        {
                            key: 'name',
                            header: 'Customer Type',
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
                    totalCount={data.customerTypeDistribution.length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default CustomerAnalytics;