"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import type { ChartConfig } from "@anole/ui/components/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@anole/ui/components/chart";
import { generateUniqueKey } from "@anole/ui/utils/generate-unique-key";
import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { JsonViewPopup } from "./json-view-popup";
import { sanitizeCssVariableName } from "./shared.tool-invocation";
// LineChart component props interface
export interface LineChartProperties {
    // Chart data array (required)
    data: {
        series: {
            seriesName: string; // Line series name
            value: number; // Value at this point
        }[];
        xAxisLabel: string; // X-axis point label (e.g. date, month, category)
    }[];
    // Chart description (optional)
    description?: string;
    // Chart title (required)
    title: string;
    // Y-axis label (optional)
    yAxisLabel?: string;
}

// Color variable names (chart-1 ~ chart-5)
const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export const LineChart = (properties: LineChartProperties) => {
    const { data, description, title, yAxisLabel } = properties;

    const deduplicateData =     useMemo(
        () =>
            data.reduce(
                (accumulator, item) => {
                    const names = accumulator.map((item) => item.xAxisLabel);
                    const newXAxisLabel = generateUniqueKey(item.xAxisLabel, names);

                    return [
                        ...accumulator,
                        {
                            series: item.series.reduce(
                                (accumulator, item) => {
                                    const names = accumulator.map((item) => item.seriesName);
                                    const newSeriesName = generateUniqueKey(item.seriesName, names);

                                    return [
                                        ...accumulator,
                                        {
                                            ...item,
                                            seriesName: newSeriesName,
                                        },
                                    ];
                                },
                                [] as LineChartProperties["data"][number]["series"],
                            ),
                            xAxisLabel: newXAxisLabel,
                        },
                    ];
                },
                [] as LineChartProperties["data"],
            ),
        [data],
    );

    // Get series names from the first data item (assuming all items have the same series)
    const seriesNames = deduplicateData[0]?.series.map((item) => item.seriesName) || [];

    // Generate chart configuration dynamically
    const chartConfig =     useMemo(() => {
        const config: ChartConfig = {};

        // Configure each series
        seriesNames.forEach((seriesName, index) => {
            // Colors cycle through chart-1 ~ chart-5
            const colorIndex = index % chartColors.length;

            config[sanitizeCssVariableName(seriesName)] = {
                color: chartColors[colorIndex],
                label: seriesName,
            };
        });

        return config;
    }, [seriesNames]);

    // Generate chart data for Recharts
    const chartData =   useMemo(
        () =>
            deduplicateData.map((item) => {
                const result: any = {
                    label: item.xAxisLabel,
                    name: item.xAxisLabel,
                };

                // Add each series value to the result
                item.series.forEach(({ seriesName, value }) => {
                    result[sanitizeCssVariableName(seriesName)] = value;
                });

                return result;
            }),
        [deduplicateData],
    );

    return (
        <Card className="bg-card">
            <CardHeader className="relative flex flex-col gap-2">
                <CardTitle className="flex items-center">
                    Line Chart -
                    {" "}
                    {title}
                    <div className="absolute top-0 right-4">
                        <JsonViewPopup
                            data={{
                                ...properties,
                                data: deduplicateData,
                            }}
                        />
                    </div>
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div>
                    <ChartContainer config={chartConfig}>
                        <ResponsiveContainer height="400px" width="100%">
                            <RechartsLineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
                                <YAxis
                                    axisLine={false}
                                    label={
                                        yAxisLabel
                                            ? {
                                                angle: -90,
                                                position: "insideLeft",
                                                value: yAxisLabel,
                                            }
                                            : undefined
                                    }
                                    tickLine={false}
                                    tickMargin={10}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                                <Legend />
                                {seriesNames.map((seriesName, index) => (
                                    <Line
                                        dataKey={sanitizeCssVariableName(seriesName)}
                                        dot={false}
                                        key={index}
                                        name={seriesName}
                                        stroke={`var(--color-${sanitizeCssVariableName(seriesName)})`}
                                        strokeWidth={2}
                                        type="monotone"
                                    />
                                ))}
                            </RechartsLineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
};
