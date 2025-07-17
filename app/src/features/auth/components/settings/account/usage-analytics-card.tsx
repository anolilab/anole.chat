"use client";

import { t } from "@lingui/core/macro";
import { BarChart3, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConvexQuery } from "@/lib/convex/use-query";
import { api } from "@/lib/convex/_generated/api";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "../shared/settings-card";

export interface UsageAnalyticsCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const UsageAnalyticsCard = ({ className, classNames }: UsageAnalyticsCardProperties) => {
    const [timeRange, setTimeRange] = useState<number>(30);
    const usageStats = useConvexQuery(api.auth.functions.getUserUsageStats, { days: timeRange });

    if (!usageStats) {
        return (
            <Card className={cn("", className, classNames?.card)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        {t`Usage Analytics`}
                    </CardTitle>
                    <CardDescription>
                        {t`Loading usage statistics...`}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { totals, modelUsage, dailyStats, recentTransactions } = usageStats;

    return (
        <Card className={cn("", className, classNames?.card)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {t`Usage Analytics`}
                        </CardTitle>
                        <CardDescription>
                            {t`Your credit usage over the last ${timeRange} days`}
                        </CardDescription>
                    </div>
                    <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <MessageSquare className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Messages Sent`}</p>
                            <p className="text-2xl font-bold">{totals.messageCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Credits Consumed`}</p>
                            <p className="text-2xl font-bold">{totals.creditsConsumed}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Calendar className="h-8 w-8 text-purple-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Credits Added`}</p>
                            <p className="text-2xl font-bold">{totals.creditsAdded}</p>
                        </div>
                    </div>
                </div>

                {/* Model Usage */}
                {Object.keys(modelUsage).length > 0 && (
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">{t`Model Usage`}</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(modelUsage).map(([model, count]) => (
                                <Badge key={model} variant="secondary">
                                    {model}: {count} {t`messages`}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Usage Chart */}
                {dailyStats.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">{t`Daily Usage`}</h3>
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t`Date`}</TableHead>
                                        <TableHead>{t`Messages`}</TableHead>
                                        <TableHead>{t`Credits Used`}</TableHead>
                                        <TableHead>{t`Credits Added`}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyStats.slice(0, 7).map((stat) => (
                                        <TableRow key={stat.date}>
                                            <TableCell className="font-medium">{stat.formattedDate}</TableCell>
                                            <TableCell>{stat.messageCount}</TableCell>
                                            <TableCell className="text-red-600">{stat.creditsConsumed}</TableCell>
                                            <TableCell className="text-green-600">{stat.creditsAdded}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                {recentTransactions.length > 0 && (
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">{t`Recent Transactions`}</h3>
                        <div className="space-y-2">
                            {recentTransactions.map((transaction) => (
                                <div key={transaction._id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">{transaction.description}</p>
                                        <p className="text-sm text-muted-foreground">{transaction.formattedDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "font-semibold",
                                            transaction.amount > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {transaction.amount > 0 ? "+" : ""}{transaction.amount} {t`credits`}
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                            {transaction.transactionType.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};