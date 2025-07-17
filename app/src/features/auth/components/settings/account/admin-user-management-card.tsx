"use client";

import { t } from "@lingui/core/macro";
import { Crown, Shield, Users } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConvexMutation, useConvexQuery } from "@/lib/convex/use-query";
import { api } from "@/lib/convex/_generated/api";
import { cn } from "@/lib/utils";

import type { SettingsCardClassNames } from "../shared/settings-card";

export interface AdminUserManagementCardProperties {
    className?: string;
    classNames?: SettingsCardClassNames;
}

export const AdminUserManagementCard = ({ className, classNames }: AdminUserManagementCardProperties) => {
    const [searchEmail, setSearchEmail] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    
    const usersWithSkipCreditChecks = useConvexQuery(api.auth.functions.getUsersWithSkipCreditChecks);
    const toggleSkipCreditChecks = useConvexMutation(api.auth.functions.toggleSkipCreditChecks);

    const handleToggleSkipCreditChecks = async (userId: string, enabled: boolean) => {
        setIsUpdating(userId);
        try {
            await toggleSkipCreditChecks({
                userId: userId as any, // Type assertion for Convex ID
                skipCreditChecks: enabled,
            });
        } catch (error) {
            console.error("Failed to toggle skip credit checks:", error);
        } finally {
            setIsUpdating(null);
        }
    };

    if (!usersWithSkipCreditChecks) {
        return (
            <Card className={cn("", className, classNames?.card)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t`Admin User Management`}
                    </CardTitle>
                    <CardDescription>
                        {t`Loading users...`}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const filteredUsers = usersWithSkipCreditChecks.filter(user =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    return (
        <Card className={cn("", className, classNames?.card)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t`Admin User Management`}
                </CardTitle>
                <CardDescription>
                    {t`Manage skip credit checks for all users`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                    <Label htmlFor="search-email">{t`Search by Email`}</Label>
                    <Input
                        id="search-email"
                        placeholder={t`Enter email to search...`}
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Users className="h-6 w-6 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Total Users`}</p>
                            <p className="text-2xl font-bold">{usersWithSkipCreditChecks.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Crown className="h-6 w-6 text-purple-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Unlimited Users`}</p>
                            <p className="text-2xl font-bold">
                                {usersWithSkipCreditChecks.filter(u => u.skipCreditChecks).length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Shield className="h-6 w-6 text-green-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t`Standard Users`}</p>
                            <p className="text-2xl font-bold">
                                {usersWithSkipCreditChecks.filter(u => !u.skipCreditChecks).length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                            {searchEmail ? t`No users found matching "${searchEmail}"` : t`No users found`}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t`User`}</TableHead>
                                    <TableHead>{t`Email`}</TableHead>
                                    <TableHead>{t`Credits`}</TableHead>
                                    <TableHead>{t`Skip Credit Checks`}</TableHead>
                                    <TableHead>{t`Actions`}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell className="font-medium">
                                            {user.name || t`Unknown`}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {user.credits} {t`credits`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.skipCreditChecks ? (
                                                <Badge variant="default" className="bg-purple-500">
                                                    <Crown className="mr-1 h-3 w-3" />
                                                    {t`Unlimited`}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    {t`Standard`}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={user.skipCreditChecks}
                                                disabled={isUpdating === user._id}
                                                onCheckedChange={(enabled) => 
                                                    handleToggleSkipCreditChecks(user._id, enabled)
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Instructions */}
                <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        {t`Toggle the switch to enable/disable skip credit checks for users. Users with skip credit checks enabled can send unlimited messages without consuming credits.`}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};