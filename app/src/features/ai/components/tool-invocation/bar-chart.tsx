"use client";

import { generateUniqueKey } from "lib/utils";
import * as React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { JsonViewPopup } from "./json-view-popup";
import { sanitizeCssVariableName } from "./shared.tool-invocation";

// BarChart component props interface
export interface BarChartProperties {
    // Chart data array (required)
    data: {
        series: {
            seriesName: string; // Series name
            value: number; // Value for this series
        }[];
        xAxisLabel: string; // X-axis label name
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

export const BarChart = (properties: BarChartProperties) => {
    const { data, description, title, yAxisLabel } = properties;

    const deduplicateData = React.useMemo(
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
                                [] as BarChartProperties["data"][number]["series"],
                            ),
                            xAxisLabel: newXAxisLabel,
                        },
                    ];
                },
                [] as BarChartProperties["data"],
            ),
        [data],
    );

    // Get series names from the first data item (assuming all items have the same series)
    const seriesNames = deduplicateData[0]?.series.map((item) => item.seriesName) || [];

    // Generate chart configuration dynamically
    const chartConfig = React.useMemo(() => {
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
    const chartData = React.useMemo(
        () =>
            deduplicateData.map((item) => {
                const result: any = {
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
                    Bar Chart -
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
                            <RechartsBarChart data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis axisLine={false} dataKey="name" tickLine={false} tickMargin={10} />
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
                                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} cursor={false} />
                                {seriesNames.map((seriesName, index) => (
                                    <Bar
                                        dataKey={sanitizeCssVariableName(seriesName)}
                                        fill={`var(--color-${sanitizeCssVariableName(seriesName)})`}
                                        key={index}
                                        radius={4}
                                    />
                                ))}
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
};
