"use client";

import { t } from "@lingui/core/macro";
import { History, Loader2 } from "lucide-react";
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

export interface TransactionHistoryCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

const TRANSACTION_TYPES = [
    { value: "all", label: "All Transactions" },
    { value: "initial_allocation", label: "Initial Allocation" },
    { value: "message_consumption", label: "Message Consumption" },
    { value: "manual_adjustment", label: "Manual Adjustment" },
    { value: "subscription_credit", label: "Subscription Credit" },
    { value: "purchase_credit", label: "Purchase Credit" },
    { value: "refund", label: "Refund" },
    { value: "expiration", label: "Expiration" },
] as const;

export const TransactionHistoryCard = ({ className, classNames }: TransactionHistoryCardProperties) => {
    const [selectedType, setSelectedType] = useState<string>("all");
    const [paginationOpts, setPaginationOpts] = useState({ cursor: null, numItems: 20 });

    const transactionType = selectedType === "all" ? undefined : selectedType as any;
    const transactions = useConvexQuery(
        api.auth.functions.getUserTransactionHistory,
        { paginationOpts, transactionType }
    );

    const loadMore = () => {
        if (transactions && !transactions.isDone) {
            setPaginationOpts({
                cursor: transactions.continueCursor,
                numItems: 20,
            });
        }
    };

    if (!transactions) {
        return (
            <Card className={cn("", className, classNames?.card)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {t`Transaction History`}
                    </CardTitle>
                    <CardDescription>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t`Loading transactions...`}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className={cn("", className, classNames?.card)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            {t`Transaction History`}
                        </CardTitle>
                        <CardDescription>
                            {t`Detailed log of all your credit transactions`}
                        </CardDescription>
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSACTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {transactions.page.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {t`No transactions found`}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t`Date`}</TableHead>
                                        <TableHead>{t`Description`}</TableHead>
                                        <TableHead>{t`Type`}</TableHead>
                                        <TableHead>{t`Amount`}</TableHead>
                                        <TableHead>{t`Balance`}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.page.map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell className="font-medium">
                                                {transaction.formattedDate}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {transaction.description}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.transactionType.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={cn(
                                                "font-semibold",
                                                transaction.amount > 0 ? "text-green-600" : "text-red-600"
                                            )}>
                                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {transaction.balanceAfter}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {!transactions.isDone && (
                            <div className="flex justify-center">
                                <Button onClick={loadMore} variant="outline">
                                    {t`Load More`}
                                </Button>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground text-center">
                            {t`Showing ${transactions.page.length} transactions`}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};