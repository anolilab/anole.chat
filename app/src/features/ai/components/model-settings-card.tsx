import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { Settings, Zap } from "lucide-react";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ModelSettings = {
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    enableStreaming: boolean;
    enableFunctionCalling: boolean;
};

const initialForm: ModelSettings = {
    defaultModel: "gpt-4",
    maxTokens: 4096,
    temperature: 0.7,
    enableStreaming: true,
    enableFunctionCalling: true,
};

const modelSettingsSchema = z.object({
    defaultModel: z.string().min(1, "Default model is required"),
    maxTokens: z.number().min(1, "Max tokens must be at least 1").max(32768, "Max tokens cannot exceed 32768"),
    temperature: z.number().min(0, "Temperature must be at least 0").max(2, "Temperature cannot exceed 2"),
    enableStreaming: z.boolean(),
    enableFunctionCalling: z.boolean(),
}).strict();

const ModelSettingsCard: FC = () => {
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettingsMutation = useMutation(api.auth.functions.updateAIUserPreferences);
    const [loading, setLoading] = useState(false);

    const modelSettings: ModelSettings = aiSettings?.modelSettings || initialForm;

    const form = useAppForm({
        defaultValues: modelSettings,
        onSubmit: async ({ value }) => {
            setLoading(true);
            await updateAIUserSettingsMutation({
                modelSettings: value,
            });
            setLoading(false);
        },
        validators: {
            onChange: modelSettingsSchema,
        },
    });

    const handleModelChange = useCallback((value: string) => {
        form.setFieldValue("defaultModel", value);
    }, [form]);

    const handleMaxTokensChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            form.setFieldValue("maxTokens", value);
        }
    }, [form]);

    const handleTemperatureChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        if (!isNaN(value)) {
            form.setFieldValue("temperature", value);
        }
    }, [form]);

    const handleStreamingChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableStreaming", checked);
    }, [form]);

    const handleFunctionCallingChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableFunctionCalling", checked);
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
                        <Zap className="w-5 h-5" />
                        Model Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure your default AI model and generation parameters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <form.AppField name="defaultModel">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>Default Model</field.FormLabel>
                                        <field.FormControl>
                                            <Select
                                                disabled={loading}
                                                onValueChange={handleModelChange}
                                                value={field.state.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="maxTokens">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>Max Tokens</field.FormLabel>
                                        <field.FormControl>
                                            <Input
                                                disabled={loading}
                                                max={32768}
                                                min={1}
                                                onBlur={field.handleBlur}
                                                onChange={handleMaxTokensChange}
                                                placeholder="4096"
                                                type="number"
                                                value={field.state.value}
                                            />
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="temperature">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>Temperature</field.FormLabel>
                                        <field.FormControl>
                                            <Input
                                                disabled={loading}
                                                max={2}
                                                min={0}
                                                onBlur={field.handleBlur}
                                                onChange={handleTemperatureChange}
                                                placeholder="0.7"
                                                step={0.1}
                                                type="number"
                                                value={field.state.value}
                                            />
                                        </field.FormControl>
                                        <field.FormDescription>
                                            Controls randomness (0 = deterministic, 2 = very random)
                                        </field.FormDescription>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>
                        </div>

                        <div className="space-y-4">
                            <form.AppField name="enableStreaming">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Enable Streaming</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Stream responses in real-time for better user experience
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleStreamingChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableFunctionCalling">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Enable Function Calling</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Allow AI to call external functions and tools
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleFunctionCallingChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>
                        </div>

                        <div className="flex justify-end">
                            <Button aria-busy={loading} disabled={loading} type="submit">
                                Save Settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ModelSettingsCard;