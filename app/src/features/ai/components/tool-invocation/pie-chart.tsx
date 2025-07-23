"use client";

import * as React from "react";
import { Label, Pie, PieChart as RechartsPieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { JsonViewPopup } from "./json-view-popup";
import { sanitizeCssVariableName } from "./shared.tool-invocation";

// PieChart component props interface
export interface PieChartProperties {
    // Chart data array (required)
    data: {
        label: string; // Item label
        value: number; // Item value
    }[];
    // Chart description (optional)
    description?: string;
    // Chart title (required)
    title: string;
    // Value unit (optional, e.g., "visitors", "users", etc.)
    unit?: string;
}

// Color variable names (chart-1 ~ chart-5)
const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export const PieChart = (properties: PieChartProperties) => {
    const { data, description, title, unit } = properties;
    // Calculate total value
    const total = React.useMemo(() => data.reduce((accumulator, current) => accumulator + current.value, 0), [data]);

    // Generate chart configuration dynamically
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};

        // Set value unit
        if (unit) {
            config.value = {
                label: unit,
            };
        }

        // Configure each data item
        data.forEach((item, index) => {
            // Colors cycle through chart-1 ~ chart-5
            const colorIndex = index % chartColors.length;

            config[sanitizeCssVariableName(item.label)] = {
                color: chartColors[colorIndex],
                label: item.label,
            };
        });

        return config;
    }, [data, unit]);

    // Generate actual chart data
    const chartData = React.useMemo(
        () =>
            data.map((item) => {
                return {
                    // Add fill property if needed
                    fill: `var(--color-${sanitizeCssVariableName(item.label)})`,
                    label: item.label,
                    name: item.label,
                    value: item.value,
                };
            }),
        [data],
    );

    return (
        <Card className="bg-card flex flex-col">
            <CardHeader className="relative flex flex-col items-center gap-2 pb-0">
                <CardTitle className="flex items-center">
                    Pie Chart -
                    {" "}
                    {title}
                    <div className="top- absolute right-4">
                        <JsonViewPopup data={properties} />
                    </div>
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer className="mx-auto aspect-square max-h-[300px]" config={chartConfig}>
                    <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
                        <Pie data={chartData} dataKey="value" innerRadius={60} nameKey="name" strokeWidth={5}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                                                <tspan className="fill-foreground text-3xl font-bold" x={viewBox.cx} y={viewBox.cy}>
                                                    {total.toLocaleString()}
                                                </tspan>
                                                {unit && (
                                                    <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy || 0) + 24}>
                                                        {unit}
                                                    </tspan>
                                                )}
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </RechartsPieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};
