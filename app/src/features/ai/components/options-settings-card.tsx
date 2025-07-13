import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { Settings, ToggleLeft } from "lucide-react";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type OptionsSettings = {
    enableAutoSave: boolean;
    enableHistory: boolean;
    maxHistoryLength: number;
    enableContextWindow: boolean;
    contextWindowSize: number;
    customSystemPrompt: string;
    enableDebugMode: boolean;
};

const initialForm: OptionsSettings = {
    enableAutoSave: true,
    enableHistory: true,
    maxHistoryLength: 50,
    enableContextWindow: true,
    contextWindowSize: 10,
    customSystemPrompt: "",
    enableDebugMode: false,
};

const optionsSettingsSchema = z.object({
    enableAutoSave: z.boolean(),
    enableHistory: z.boolean(),
    maxHistoryLength: z.number().min(1, "History length must be at least 1").max(1000, "History length cannot exceed 1000"),
    enableContextWindow: z.boolean(),
    contextWindowSize: z.number().min(1, "Context window size must be at least 1").max(100, "Context window size cannot exceed 100"),
    customSystemPrompt: z.string().max(2000, "System prompt cannot exceed 2000 characters"),
    enableDebugMode: z.boolean(),
}).strict();

const OptionsSettingsCard: FC = () => {
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettingsMutation = useMutation(api.auth.functions.updateAIUserPreferences);
    const [loading, setLoading] = useState(false);

    const optionsSettings: OptionsSettings = aiSettings?.optionsSettings || initialForm;

    const form = useAppForm({
        defaultValues: optionsSettings,
        onSubmit: async ({ value }) => {
            setLoading(true);
            await updateAIUserSettingsMutation({
                optionsSettings: value,
            });
            setLoading(false);
        },
        validators: {
            onChange: optionsSettingsSchema,
        },
    });

    const handleAutoSaveChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableAutoSave", checked);
    }, [form]);

    const handleHistoryChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableHistory", checked);
    }, [form]);

    const handleMaxHistoryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            form.setFieldValue("maxHistoryLength", value);
        }
    }, [form]);

    const handleContextWindowChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableContextWindow", checked);
    }, [form]);

    const handleContextWindowSizeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            form.setFieldValue("contextWindowSize", value);
        }
    }, [form]);

    const handleSystemPromptChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        form.setFieldValue("customSystemPrompt", event.target.value);
    }, [form]);

    const handleDebugModeChange = useCallback((checked: boolean) => {
        form.setFieldValue("enableDebugMode", checked);
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
                        <ToggleLeft className="w-5 h-5" />
                        AI Options
                    </CardTitle>
                    <CardDescription>
                        Configure AI behavior and application options
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <form.AppField name="enableAutoSave">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Auto Save</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Automatically save conversations and settings
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleAutoSaveChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableHistory">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Conversation History</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Keep track of your conversation history
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleHistoryChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            {form.watch("enableHistory") && (
                                <form.AppField name="maxHistoryLength">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>Max History Length</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    max={1000}
                                                    min={1}
                                                    onBlur={field.handleBlur}
                                                    onChange={handleMaxHistoryChange}
                                                    placeholder="50"
                                                    type="number"
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormDescription>
                                                Maximum number of conversations to keep in history
                                            </field.FormDescription>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </form.AppField>
                            )}

                            <form.AppField name="enableContextWindow">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Context Window</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Maintain context from previous messages
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleContextWindowChange}
                                                />
                                            </div>
                                        </field.FormControl>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            {form.watch("enableContextWindow") && (
                                <form.AppField name="contextWindowSize">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>Context Window Size</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    max={100}
                                                    min={1}
                                                    onBlur={field.handleBlur}
                                                    onChange={handleContextWindowSizeChange}
                                                    placeholder="10"
                                                    type="number"
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormDescription>
                                                Number of previous messages to include in context
                                            </field.FormDescription>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </form.AppField>
                            )}

                            <form.AppField name="customSystemPrompt">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormLabel>Custom System Prompt</field.FormLabel>
                                        <field.FormControl>
                                            <Textarea
                                                disabled={loading}
                                                onBlur={field.handleBlur}
                                                onChange={handleSystemPromptChange}
                                                placeholder="Enter a custom system prompt to guide AI behavior..."
                                                rows={4}
                                                value={field.state.value}
                                            />
                                        </field.FormControl>
                                        <field.FormDescription>
                                            Optional custom prompt to guide AI behavior across all conversations
                                        </field.FormDescription>
                                        <field.FormMessage />
                                    </field.FormItem>
                                )}
                            </form.AppField>

                            <form.AppField name="enableDebugMode">
                                {(field) => (
                                    <field.FormItem>
                                        <field.FormControl>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Debug Mode</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable debug information and logging
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={field.state.value}
                                                    disabled={loading}
                                                    onCheckedChange={handleDebugModeChange}
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
                                Save Options
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OptionsSettingsCard;