import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { BarChart3, Calendar, Download, Eye, EyeOff } from "lucide-react";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { z } from "zod/v4";
import { useLingui } from "@lingui/react/macro";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type UsageAnalyticsSettings = {
    enableUsageTracking: boolean;
    enableCostTracking: boolean;
    enablePerformanceMetrics: boolean;
    dataRetentionDays: number;
    exportFormat: string;
    enableRealTimeMetrics: boolean;
    enableAlerts: boolean;
    alertThreshold: number;
};

const initialForm: UsageAnalyticsSettings = {
    enableUsageTracking: true,
    enableCostTracking: true,
    enablePerformanceMetrics: true,
    dataRetentionDays: 90,
    exportFormat: "csv",
    enableRealTimeMetrics: false,
    enableAlerts: false,
    alertThreshold: 100,
};

const UsageAnalyticsCard: FC = () => {
    const { t } = useLingui();
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettingsMutation = useMutation(api.auth.functions.updateAIUserPreferences);
    const [loading, setLoading] = useState(false);

    const usageAnalytics: UsageAnalyticsSettings = aiSettings?.usageAnalytics || initialForm;

    const usageAnalyticsSchema = z.object({
        enableUsageTracking: z.boolean(),
        enableCostTracking: z.boolean(),
        enablePerformanceMetrics: z.boolean(),
        dataRetentionDays: z.number().min(1, t`Data retention must be at least 1 day`).max(365, t`Data retention cannot exceed 365 days`),
        exportFormat: z.string().min(1, t`Export format is required`),
        enableRealTimeMetrics: z.boolean(),
        enableAlerts: z.boolean(),
        alertThreshold: z.number().min(1, t`Alert threshold must be at least 1`).max(10000, t`Alert threshold cannot exceed 10000`),
    }).strict();

    const form = useAppForm({
        defaultValues: usageAnalytics,
        onSubmit: async ({ value }) => {
            setLoading(true);
            await updateAIUserSettingsMutation({
                usageAnalytics: value,
            });
            setLoading(false);
        },
        validators: {
            onChange: usageAnalyticsSchema,
        },
    });

    const handleUsageTrackingChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableUsageTracking", checked);
    }, [form]);

    const handleCostTrackingChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableCostTracking", checked);
    }, [form]);

    const handlePerformanceMetricsChange = useCallback((checked: boolean) => {
        form.setFieldValue("enablePerformanceMetrics", checked);
    }, [form]);

    const handleDataRetentionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            form.setFieldValue("dataRetentionDays", value);
        }
    }, [form]);

    const handleExportFormatChange = useCallback((value: string) => {
        form.setFieldValue("exportFormat", value);
    }, [form]);

    const handleRealTimeMetricsChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableRealTimeMetrics", checked);
    }, [form]);

    const handleAlertsChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableAlerts", checked);
    }, [form]);

    const handleAlertThresholdChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            form.setFieldValue("alertThreshold", value);
        }
    }, [form]);

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
    }, [form]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {t`Usage Analytics`}
                    </CardTitle>
                    <CardDescription>
                        {t`Configure usage tracking, analytics, and reporting settings`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <form.AppField name="enableUsageTracking">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t`Usage Tracking`}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t`Track API calls, tokens used, and usage patterns`}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleUsageTrackingChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableCostTracking">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t`Cost Tracking`}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t`Monitor API costs and spending patterns`}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleCostTrackingChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enablePerformanceMetrics">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t`Performance Metrics`}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t`Track response times and model performance`}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handlePerformanceMetricsChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="dataRetentionDays">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Data Retention Period`}</field.FormLabel>
                                        <field.FormControl>
                                            <Input
                                                disabled={loading}
                                                max={365}
                                                min={1}
                                                onBlur={field.handleBlur}
                                                onChange={handleDataRetentionChange}
                                                placeholder="90"
                                                type="number"
                                                value={field.state.value}
                                            />
                                        </field.FormControl>
                                        <field.FormDescription>
                                            {t`Number of days to retain analytics data`}
                                        </field.FormDescription>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="exportFormat">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>{t`Export Format`}</field.FormLabel>
                                        <field.FormControl>
                                            <Select
                                                disabled={loading}
                                                onValueChange={handleExportFormatChange}
                                                value={field.state.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t`Select export format`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="csv">CSV</SelectItem>
                                                    <SelectItem value="json">JSON</SelectItem>
                                                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                                    <SelectItem value="pdf">PDF Report</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableRealTimeMetrics">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t`Real-time Metrics`}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t`Show live usage metrics and dashboards`}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleRealTimeMetricsChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableAlerts">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>{t`Usage Alerts`}</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t`Get notified when usage exceeds thresholds`}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleAlertsChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            {form.watch("enableAlerts") && (
                                <form.AppField name="alertThreshold">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`Alert Threshold`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    max={10000}
                                                    min={1}
                                                    onBlur={field.handleBlur}
                                                    onChange={handleAlertThresholdChange}
                                                    placeholder="100"
                                                    type="number"
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormDescription>
                                                {t`Number of API calls before triggering an alert`}
                                            </field.FormDescription>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </form.AppField>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button disabled={loading} type="button" variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                {t`Export Data`}
                            </Button>
                            <Button aria-busy={loading} disabled={loading} type="submit">
                                {t`Save Analytics Settings`}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsageAnalyticsCard;