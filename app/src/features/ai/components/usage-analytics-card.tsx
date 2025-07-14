import { api } from "@anole/convex/api";
import { useQuery } from "convex/react";
import { Activity, BarChart3, TrendingUp, Zap } from "lucide-react";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MODEL_COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#eab308", // yellow
    "#dc2626", // red-600
    "#059669", // emerald-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#0891b2", // cyan-600
    "#65a30d", // lime-600
    "#ea580c", // orange-600
    "#4f46e5", // indigo-600
];

interface UsageDashboardProperties {
    className?: string;
}

interface ModelStats {
    completionTokens: number;
    modelId: string;
    modelName: string;
    promptTokens: number;
    reasoningTokens: number;
    requests: number;
    totalTokens: number;
}

interface UsageStats {
    modelStats: ModelStats[];
    totalRequests: number;
    totalTokens: number;
}

interface ChartModelData {
    completionTokens: number;
    promptTokens: number;
    reasoningTokens: number;
    tokens: number;
}

interface ChartDay {
    date: string;
    models: Record<string, ChartModelData>;
    totalTokens: number;
}

const isUsageStats = (object: unknown): object is UsageStats => !!object && typeof object === "object" && Array.isArray((object as UsageStats).modelStats);

const isChartDayArray = (object: unknown): object is ChartDay[] =>
    Array.isArray(object)
    && object.every(
        (day) =>
            day
            && typeof day === "object"
            && typeof (day as ChartDay).date === "string"
            && typeof (day as ChartDay).totalTokens === "number"
            && typeof (day as ChartDay).models === "object",
    );

const UsageAnalyticsCard: FC<UsageDashboardProperties> = ({ className }) => {
    const [timeframe, setTimeframe] = useState<"1d" | "7d" | "30d">("7d");
    const isMobile = useIsMobile();
    const statsRaw = useQuery(api.ai.functions.getMyUsageStats, { timeframe });
    const chartDataRaw = useQuery(api.ai.functions.getMyUsageChartData, { timeframe });
    const stats: UsageStats | undefined = isUsageStats(statsRaw) ? statsRaw : undefined;
    const chartData: ChartDay[] | undefined = isChartDayArray(chartDataRaw) ? chartDataRaw : undefined;

    const modelUsageData = useMemo(() => {
        if (!chartData)
            return [];

        return chartData.map((day: ChartDay) => {
            const dayData: Record<string, any> = {
                date: day.date,
                total: day.totalTokens,
            };

            Object.entries(day.models).forEach(([modelId, data]: [string, ChartModelData]) => {
                dayData[modelId] = data.tokens;
            });

            return dayData;
        });
    }, [chartData]);

    const tokenTypeData = useMemo(() => {
        if (!chartData)
            return [];

        return chartData.map((day: ChartDay) => {
            return {
                completion: Object.values(day.models).reduce((sum: number, model: ChartModelData) => sum + model.completionTokens, 0),
                date: day.date,
                prompt: Object.values(day.models).reduce((sum: number, model: ChartModelData) => sum + model.promptTokens, 0),
                reasoning: Object.values(day.models).reduce((sum: number, model: ChartModelData) => sum + model.reasoningTokens, 0),
            };
        });
    }, [chartData]);

    const modelIds = useMemo(() => {
        if (!stats)
            return [];

        return stats.modelStats.map((model: ModelStats) => model.modelId);
    }, [stats]);

    const modelChartConfig = useMemo(() => {
        const config: ChartConfig = {};

        modelIds.forEach((modelId: string, index: number) => {
            config[modelId] = {
                color: MODEL_COLORS[index % MODEL_COLORS.length],
                label: stats?.modelStats.find((m: ModelStats) => m.modelId === modelId)?.modelName || modelId,
            };
        });

        return config;
    }, [modelIds, stats]);

    const tokenChartConfig = {
        completion: {
            label: "Output Tokens",
        },
        prompt: {
            label: "Input Tokens",
        },
        reasoning: {
            label: "Reasoning Tokens",
        },
    } satisfies ChartConfig;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs onValueChange={(value: string) => setTimeframe(value as "1d" | "7d" | "30d")} value={timeframe}>
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="1d">1 Day</TabsTrigger>
                        <TabsTrigger value="7d">7 Days</TabsTrigger>
                        <TabsTrigger value="30d">30 Days</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card className="gap-3 p-4">
                    <CardHeader className="flex flex-row items-center px-0">
                        <Activity className="text-muted-foreground size-3 sm:size-4" />
                        <CardTitle className="text-xs font-medium sm:text-sm">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-lg font-bold sm:text-2xl">{stats?.totalRequests || 0}</div>
                        <p className="text-muted-foreground text-xs">{timeframe === "1d" ? "today" : `last ${timeframe === "7d" ? "7" : "30"} days`}</p>
                    </CardContent>
                </Card>
                <Card className="gap-3 p-4">
                    <CardHeader className="flex flex-row items-center px-0">
                        <Zap className="text-muted-foreground size-3 sm:size-4" />
                        <CardTitle className="text-xs font-medium sm:text-sm">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-lg font-bold sm:text-2xl">
                            {((stats?.totalTokens || 0) / 1000).toFixed(1)}
                            K
                        </div>
                        <p className="text-muted-foreground text-xs">input + output + reasoning</p>
                    </CardContent>
                </Card>
                <Card className="gap-3 p-4">
                    <CardHeader className="flex flex-row items-center px-0">
                        <BarChart3 className="text-muted-foreground size-3 sm:size-4" />
                        <CardTitle className="text-xs font-medium sm:text-sm">Models Used</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-lg font-bold sm:text-2xl">{stats?.modelStats.length || 0}</div>
                        <p className="text-muted-foreground text-xs">different models</p>
                    </CardContent>
                </Card>
                <Card className="gap-3 p-4">
                    <CardHeader className="flex flex-row items-center px-0">
                        <TrendingUp className="text-muted-foreground size-3 sm:size-4" />
                        <CardTitle className="text-xs font-medium sm:text-sm">Avg tokens/request</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-lg font-bold sm:text-2xl">
                            {stats?.totalRequests ? Math.round((stats?.totalTokens || 0) / stats.totalRequests) : 0}
                        </div>
                        <p className="text-muted-foreground text-xs">total tokens / total requests</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4">
                <Card className="gap-3 overflow-hidden p-4">
                    <CardHeader className="gap-0 px-0 pb-3">
                        <CardTitle className="text-base sm:text-lg">Token Usage by Model</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Daily token consumption breakdown by model</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 px-0">
                        <ChartContainer className="aspect-auto h-[250px] w-full overflow-hidden sm:h-[300px]" config={modelChartConfig}>
                            <BarChart data={modelUsageData} height={undefined} margin={{ bottom: 0, left: 0, right: 10, top: 5 }} width={undefined}>
                                <XAxis
                                    dataKey="date"
                                    fontSize={isMobile ? 10 : 12}
                                    tickFormatter={(value: string) => {
                                        const date = new Date(value);

                                        if (timeframe === "1d") {
                                            return date.toLocaleTimeString([], {
                                                hour: "numeric",
                                                hour12: true,
                                            });
                                        }

                                        return isMobile ? `${date.getMonth() + 1}/${date.getDate()}` : date.toLocaleDateString();
                                    }}
                                />
                                <YAxis fontSize={isMobile ? 10 : 12} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`} width={30} />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    formatter={(value: number, name: string) => [
                                        `${Number(value).toLocaleString()} tokens - `,
                                        modelChartConfig[name as string]?.label || name,
                                    ]}
                                    labelFormatter={(value: string) => {
                                        const date = new Date(value);

                                        if (timeframe === "1d") {
                                            return date.toLocaleString([], {
                                                day: "numeric",
                                                hour: "numeric",
                                                hour12: true,
                                                minute: "2-digit",
                                                month: "short",
                                            });
                                        }

                                        return date.toLocaleDateString([], {
                                            day: "numeric",
                                            month: "short",
                                            weekday: "short",
                                        });
                                    }}
                                />
                                {modelIds.map((modelId: string) => (
                                    <Bar dataKey={modelId} fill={modelChartConfig[modelId]?.color} key={modelId} stackId="models" />
                                ))}
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="gap-3 overflow-hidden p-4">
                    <CardHeader className="gap-0 px-0 pb-3">
                        <CardTitle className="text-base sm:text-lg">Token Type Distribution</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Input, output, and reasoning token breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 px-0">
                        <ChartContainer className="aspect-auto h-[250px] w-full overflow-hidden sm:h-[300px]" config={tokenChartConfig}>
                            <BarChart data={tokenTypeData} height={undefined} margin={{ bottom: 0, left: 0, right: 10, top: 5 }} width={undefined}>
                                <XAxis
                                    dataKey="date"
                                    fontSize={isMobile ? 10 : 12}
                                    tickFormatter={(value: string) => {
                                        const date = new Date(value);

                                        if (timeframe === "1d") {
                                            return date.toLocaleTimeString([], {
                                                hour: "numeric",
                                                hour12: true,
                                            });
                                        }

                                        return isMobile ? `${date.getMonth() + 1}/${date.getDate()}` : date.toLocaleDateString();
                                    }}
                                />
                                <YAxis fontSize={isMobile ? 10 : 12} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`} width={30} />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    formatter={(value: number, name: string) => [
                                        `${Number(value).toLocaleString()} `,
                                        tokenChartConfig[name as keyof typeof tokenChartConfig]?.label || name,
                                    ]}
                                    labelFormatter={(value: string) => {
                                        const date = new Date(value);

                                        if (timeframe === "1d") {
                                            return date.toLocaleString([], {
                                                day: "numeric",
                                                hour: "numeric",
                                                hour12: true,
                                                minute: "2-digit",
                                                month: "short",
                                            });
                                        }

                                        return date.toLocaleDateString([], {
                                            day: "numeric",
                                            month: "short",
                                            weekday: "short",
                                        });
                                    }}
                                />
                                <Bar dataKey="prompt" fill="var(--chart-1)" stackId="tokens" />
                                <Bar dataKey="completion" fill="var(--chart-2)" stackId="tokens" />
                                <Bar dataKey="reasoning" fill="var(--chart-3)" stackId="tokens" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
            <Card className="gap-3 p-4">
                <CardHeader className="gap-0 px-0">
                    <CardTitle className="text-base sm:text-lg">Model Usage Details</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Detailed breakdown by model for the selected period</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-0">
                    <div className="space-y-1.5">
                        {stats?.modelStats.map((model: ModelStats, index: number) => (
                            <div className="flex items-center justify-between rounded-lg border px-2 py-1" key={model.modelId}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length],
                                        }}
                                    />
                                    <div>
                                        <div className="text-sm font-medium">{model.modelName}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {model.requests}
                                            {" "}
                                            request
                                            {model.requests === 1 ? "" : "s"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium sm:text-base">
                                        {(model.totalTokens / 1000).toFixed(1)}
                                        K tokens
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {(model.promptTokens / 1000).toFixed(0)}
                                        K in •
                                        {(model.completionTokens / 1000).toFixed(0)}
                                        K out
                                        {model.reasoningTokens > 0 && ` • ${(model.reasoningTokens / 1000).toFixed(0)}K reasoning`}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.modelStats || stats.modelStats.length === 0) && (
                            <div className="text-muted-foreground py-8 text-center">No usage data for the selected period</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsageAnalyticsCard;
