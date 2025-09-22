import React from 'react';
import BaseAnalytics, { LoadingSpinner } from '../Common/BaseAnalytics';
import { PieChartComponent, LineChartComponent, BarChartComponent } from '../Common/ChartComponents';
import DataTable from '../Common/DataTable';
import { useDarkMode } from '../../../context/DarkModeContext';

const ActivityAnalytics = ({ data }) => {
    const { isDark } = useDarkMode();

    if (!data) return <LoadingSpinner />;

    return (
        <BaseAnalytics
            title="Activity Analytics"
            data={data}
            chartGrid="grid-cols-1 md:grid-cols-2"
            isDark={isDark}
        >
            <PieChartComponent
                data={data.activityTypes}
                dataKey="value"
                nameKey="name"
                title="Activity Types"
                tooltipFormatter={(value, name) => [`${value} activities`, name]}
                isDark={isDark}
            />

            <LineChartComponent
                data={data.activityOverTime}
                dataKey="count"
                nameKey="date"
                title="Activity Over Time"
                lineProps={{ name: "Activities" }}
                tooltipFormatter={(value) => [`${value} activities`]}
                isDark={isDark}
            />

            {data.userActivity && (
                <BarChartComponent
                    data={data.userActivity}
                    dataKey="value"
                    nameKey="name"
                    title="User Activity"
                    barProps={{ name: "Activities" }}
                    tooltipFormatter={(value) => [`${value} activities`]}
                    isDark={isDark}
                />
            )}

            {data.activityTypes && (
                <DataTable
                    title="Activity Statistics"
                    data={data.activityTypes}
                    columns={[
                        {
                            key: 'name',
                            header: 'Activity Type',
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
                    totalCount={data.activityTypes.length}
                    onPageChange={() => { }}
                    isDark={isDark}
                />
            )}
        </BaseAnalytics>
    );
};

export default ActivityAnalytics;