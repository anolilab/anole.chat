import { api } from "@anole/convex/api";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod/v4";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODELS_SHARED: { abilities: string[]; id: string; name: string }[] = [
    { abilities: ["text", "function_calling"], id: "gpt-4o", name: "GPT-4o" },
    { abilities: ["text"], id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
    { abilities: ["text", "image"], id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
];

const ModelSettingsCard: FC = () => {
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettingsMutation = useMutation(api.auth.functions.updateAIUserPreferences);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [customModelEditKey, setCustomModelEditKey] = useState<string | undefined>(undefined);
    const [customModelFormError, setCustomModelFormError] = useState<string | undefined>(undefined);

    const customModels = useMemo(() => aiSettings?.customModels || {}, [aiSettings]);

    // --- Custom Model Form ---
    const customModelSchema = z.object({
        abilities: z.array(z.string()),
        contextLength: z.number(),
        enabled: z.boolean(),
        maxTokens: z.number(),
        modelId: z.string(),
        name: z.string(),
        providerId: z.string(),
    }).strict();
    const initialCustomModel = useMemo(() => {
        return {
            abilities: ["text"],
            contextLength: 4096,
            enabled: true,
            maxTokens: 4096,
            modelId: "",
            name: "",
            providerId: "openai",
        };
    }, []);
    const customModelDefaultValues = customModelEditKey && customModels[customModelEditKey] ? customModels[customModelEditKey] : initialCustomModel;
    const customModelForm = useAppForm({
        defaultValues: customModelDefaultValues,
        onSubmit: async ({ value }) => {
            setLoading(true);
            setCustomModelFormError(undefined);

            try {
                const key = value.modelId;

                await updateAIUserSettingsMutation({
                    customModels: {
                        ...customModels,
                        [key]: { ...value },
                    },
                });
                setDialogOpen(false);
            } catch (error) {
                setCustomModelFormError((error as Error).message);
            }

            setLoading(false);
        },
        validators: { onChange: customModelSchema },
    });

    // Remove unnecessary useCallback hooks
    function openAddCustomModel() {
        setCustomModelEditKey(undefined);
        setDialogOpen(true);
    }

    function openEditCustomModel(key: string) {
        setCustomModelEditKey(key);
        setDialogOpen(true);
    }

    async function handleDeleteCustomModel(key: string) {
        setLoading(true);
        const updated = { ...customModels };

        delete updated[key];
        await updateAIUserSettingsMutation({ customModels: updated });
        setLoading(false);
    }

    const customAIProviders = aiSettings?.customAIProviders || {};
    const providerOptions = Object.entries(customAIProviders).map(([key, provider]: [string, any]) => {
        return { id: key, name: provider.name };
    });

    // Merge default and custom models for display
    const mergedModels = [
        ...MODELS_SHARED.map((m) => {
            return {
                abilities: m.abilities,
                id: m.id,
                name: m.name,
                type: "default" as const,
            };
        }),
        ...Object.entries(customModels).map(([key, m]: [string, any]) => {
            return {
                abilities: Array.isArray(m?.abilities) ? m.abilities : [],
                enabled: m?.enabled,
                id: m?.modelId || key,
                key,
                name: m?.name || m?.modelId || key,
                providerId: m?.providerId,
                raw: m,
                type: "custom" as const,
            };
        }),
    ];

    return (
        <>
            {mergedModels.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">{t`No models.`}</div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mergedModels.map((model) => (
                        <div className="flex flex-col justify-between rounded-lg border bg-white p-4 shadow dark:bg-zinc-900" key={model.id}>
                            <div>
                                <div className="flex items-center gap-2 text-base font-medium">
                                    {model.name}
                                    <span className={`badge ${model.type === "default" ? "badge-info" : "badge-secondary"}`}>
                                        {model.type === "default" ? t`Default` : t`Custom`}
                                    </span>
                                    {model.type === "custom" && (
                                        <span className={`badge ${model.enabled ? "badge-success" : "badge-ghost"}`}>
                                            {model.enabled ? t`Enabled` : t`Disabled`}
                                        </span>
                                    )}
                                </div>
                                <div className="text-muted-foreground mt-1 text-xs">
                                    {model.id}
                                    {model.type === "custom" && model.providerId ? ` (${model.providerId})` : ""}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {Array.isArray(model.abilities) && model.abilities.length > 0
                                        ? model.abilities.map((ability: string) => {
                                            let variant: "default" | "destructive" | "secondary" | "outline" = "outline";

                                            switch (ability) {
                                                case "audio": {
                                                    variant = "destructive";
                                                    break;
                                                }
                                                case "code": {
                                                    variant = "secondary";
                                                    break;
                                                }
                                                case "document": {
                                                    variant = "secondary";
                                                    break;
                                                }
                                                case "function_calling": {
                                                    variant = "destructive";
                                                    break;
                                                }
                                                case "image": {
                                                    variant = "secondary";
                                                    break;
                                                }
                                                case "reasoning": {
                                                    variant = "default";
                                                    break;
                                                }
                                                case "text": {
                                                    variant = "default";
                                                    break;
                                                }
                                                case "video": {
                                                    variant = "default";
                                                    break;
                                                }
                                                  // no default
                                            }

                                            return (
                                                <Badge key={ability} variant={variant}>
                                                    {ability}
                                                </Badge>
                                            );
                                        })
                                        : undefined}
                                </div>
                            </div>
                            {model.type === "custom" && (
                                <div className="mt-4 flex gap-2">
                                    <Button aria-label={t`Edit custom model`} onClick={() => openEditCustomModel(model.key)} size="sm" variant="outline">
                                        {t`Edit`}
                                    </Button>
                                    <Button
                                        aria-label={t`Delete custom model`}
                                        onClick={() => handleDeleteCustomModel(model.key)}
                                        size="sm"
                                        variant="destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {" "}
                                        {t`Delete`}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}

                    <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 py-8 dark:border-zinc-700"
                                onClick={() => setDialogOpen(true)}
                                type="button"
                                variant="ghost"
                            >
                                <Plus className="mb-2 h-6 w-6" />
                                <span className="font-medium">{t`Add Custom Model`}</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{customModelEditKey ? t`Edit Custom Model` : t`Add Custom Model`}</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-4" onSubmit={customModelForm.handleSubmit}>
                                <customModelForm.AppField name="name">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Name`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="modelId">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Model ID`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="providerId">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Provider`}</field.FormLabel>
                                            <field.FormControl>
                                                <Select disabled={loading} onValueChange={field.handleChange} value={field.state.value}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder={t`Select a provider`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {providerOptions.length === 0
                                                            ? (
                                                                <SelectItem disabled value="">{t`No providers available`}</SelectItem>
                                                            )
                                                            : providerOptions.map((p) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="contextLength">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Context Length`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                                    type="number"
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="maxTokens">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Max Tokens`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                                    type="number"
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="abilities">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Abilities`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value.split(",").map((s) => s.trim()))}
                                                    value={field.state.value.join(", ")}
                                                />
                                            </field.FormControl>
                                            <field.FormDescription>{t`Comma-separated: text, image, audio, video, document, function_calling, code, reasoning`}</field.FormDescription>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                <customModelForm.AppField name="enabled">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel required>{t`Enabled`}</field.FormLabel>
                                            <field.FormControl>
                                                <Checkbox checked={field.state.value} onCheckedChange={(checked) => field.handleChange(checked === true)} />
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </customModelForm.AppField>
                                {customModelFormError && <div className="text-sm text-red-500">{customModelFormError}</div>}
                                <DialogFooter>
                                    <Button aria-busy={loading} disabled={loading} type="submit">{t`Save`}</Button>
                                    <Button disabled={loading} onClick={() => setDialogOpen(false)} type="button" variant="secondary">{t`Cancel`}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </>
    );
};

export default ModelSettingsCard;
