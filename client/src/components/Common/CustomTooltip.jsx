import React from 'react';
import { getChartColors } from './BaseAnalytics';

export const CustomTooltip = ({ active, payload, label, isDark, formatter }) => {
    const colors = getChartColors(isDark);

    if (active && payload && payload.length) {
        return (
            <div
                className="p-2 border text-sm rounded-md shadow-md"
                style={{
                    backgroundColor: colors.tooltipBackground,
                    color: colors.text,
                    borderColor: colors.tooltipBorder
                }}
            >
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry, index) => {
                    const [formattedValue, formattedName] = formatter
                        ? formatter(entry.value, entry.name, entry, index, payload)
                        : [entry.value, entry.name];

                    return (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${formattedName}: ${formattedValue}`}
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};