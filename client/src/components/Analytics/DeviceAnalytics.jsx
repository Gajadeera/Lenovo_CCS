import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, BarChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const DeviceAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="Device Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-3"
            isDark={isDark}
        >
            <PieChartComponent
                data={data.deviceTypeDistribution}
                dataKey="value"
                nameKey="name"
                title="Device Type Distribution"
                tooltipFormatter={(value, name) => [`${value} devices`, name]}
                isDark={isDark}
            />

            <PieChartComponent
                data={data.warrantyStatus}
                dataKey="value"
                nameKey="name"
                title="Warranty Status"
                tooltipFormatter={(value, name) => [`${value} devices`, name]}
                isDark={isDark}
            />

            <BarChartComponent
                data={data.topManufacturers}
                dataKey="value"
                nameKey="name"
                title="Top Manufacturers"
                barProps={{ name: "Device Count" }}
                tooltipFormatter={(value) => [`${value} devices`]}
                isDark={isDark}
            />

            {(data.deviceTypeDistribution || data.warrantyStatus) && (
                <DataTable
                    title="Device Statistics"
                    data={[
                        ...(data.deviceTypeDistribution?.map(item => ({
                            metric: `${item.name} Devices`,
                            value: item.value
                        })) || []),
                        ...(data.warrantyStatus?.map(item => ({
                            metric: `Warranty: ${item.name}`,
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
                        ...(data.deviceTypeDistribution || []),
                        ...(data.warrantyStatus || [])
                    ].length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default DeviceAnalytics;