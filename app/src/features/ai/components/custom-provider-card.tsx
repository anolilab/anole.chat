import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Server, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { z } from "zod/v4";

import CopyButton from "@/components/copy-button";
import { PasswordInput } from "@/components/form/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type CustomProvider = {
    enabled: boolean;
    encryptedKey: string;
    endpoint: string;
    name: string;
};

type CustomProviders = Record<string, CustomProvider>;

const initialForm: CustomProvider = {
    enabled: true,
    encryptedKey: "",
    endpoint: "",
    name: "",
};

const providerSchema = z.object({
    enabled: z.boolean(),
    encryptedKey: z.string().min(1, "API Key is required"),
    endpoint: z.url("Must be a valid URL"),
    name: z.string().min(2, "Name is required"),
}).strict();

const CustomProviderCard: FC = () => {
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettings = useMutation(api.auth.functions.updateAIUserPreferences);
    const [editingKey, setEditingKey] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const customProviders: CustomProviders = aiSettings?.customAIProviders || {};

    const form = useAppForm({
        defaultValues: initialForm,
        onSubmit: async ({ value }) => {
            setLoading(true);
            const key = editingKey || value.name;

            await updateAIUserSettings({
                customAIProviders: {
                    ...customProviders,
                    [key]: { ...value },
                },
            });
            setEditingKey(undefined);
            form.reset();
            setLoading(false);
        },
        validators: {
            onChange: providerSchema,
        },
        values: editingKey ? customProviders[editingKey] ?? initialForm : initialForm,
    });

    const handleEdit = (key: string) => {
        setEditingKey(key);
        form.setValues(customProviders[key] ?? initialForm);
    };

    const handleDelete = async (key: string) => {
        setLoading(true);
        const updated = { ...customProviders };

        delete updated[key];
        await updateAIUserSettings({ customAIProviders: updated });
        setLoading(false);

        if (editingKey === key)
            setEditingKey(undefined);
    };

    const handleCancel = () => {
        setEditingKey(undefined);
        form.reset();
    };

    return (
        <div className="space-y-8">
            {/* Add/Edit Form */}
            <form.AppForm>
                <form
                    aria-label={editingKey ? "Edit Provider" : "Add Provider"}
                    className="rounded-lg border bg-white dark:bg-zinc-900 p-6 shadow flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Server className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-lg">
                            {editingKey ? "Edit Provider" : "Add Custom Provider"}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form.AppField name="name">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>Provider Name</field.FormLabel>
                                    <field.FormControl>
                                        <Input
                                            autoComplete="off"
                                            className="input input-bordered"
                                            disabled={loading}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Provider Name"
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="endpoint">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>API Endpoint</field.FormLabel>
                                    <field.FormControl>
                                        <Input
                                            autoComplete="off"
                                            className="input input-bordered"
                                            disabled={loading}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="API Endpoint"
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="encryptedKey">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>Encrypted API Key</field.FormLabel>
                                    <field.FormControl>
                                        <PasswordInput
                                            aria-describedby="key-help"
                                            autoComplete="off"
                                            disabled={loading}
                                            enableToggle
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Encrypted API Key"
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormDescription id="key-help">Key is hidden for security. Click copy to use.</field.FormDescription>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="enabled">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel>Status</field.FormLabel>
                                    <field.FormControl>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                aria-checked={field.state.value}
                                                checked={field.state.value}
                                                disabled={loading}
                                                onCheckedChange={field.handleChange}
                                            />
                                            <span className={`badge ${field.state.value ? "badge-success" : "badge-ghost"}`}>{field.state.value ? "Enabled" : "Disabled"}</span>
                                        </div>
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Button
                            aria-busy={loading}
                            disabled={loading}
                            type="submit"
                        >
                            {editingKey ? "Update Provider" : "Add Provider"}
                        </Button>
                        {editingKey && (
                            <Button
                                disabled={loading}
                                onClick={handleCancel}
                                type="button"
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </form.AppForm>
            <hr className="border-zinc-200 dark:border-zinc-700" />

            <div>
                <h3 className="mb-4 font-semibold text-lg flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    {" "}
                    Custom Providers
                </h3>
                {Object.entries(customProviders).length === 0
                    ? (
                        <div className="text-zinc-500 text-center py-8">No custom providers.</div>
                    )
                    : (
                        <ul className="grid gap-4">
                            {Object.entries(customProviders).map(([key, provider]) => (
                                <li
                                    className="rounded-lg border bg-white dark:bg-zinc-900 p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:shadow-lg transition-shadow group"
                                    key={key}
                                >
                                    <div className="flex items-center gap-3">
                                        <Server className="w-6 h-6 text-primary" />
                                        <div>
                                            <div className="font-medium text-base flex items-center gap-2">
                                                {provider.name}
                                                <span className={`badge ${provider.enabled ? "badge-success" : "badge-ghost"}`}>{provider.enabled ? "Enabled" : "Disabled"}</span>
                                            </div>
                                            <div className="text-xs text-zinc-500">{provider.endpoint}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                                                Key:
                                                {" "}
                                                {provider.encryptedKey.slice(0, 6)}
                                                ***
                                                <CopyButton textToCopy={provider.encryptedKey} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 md:mt-0">
                                        <Button
                                            aria-label="Edit provider"
                                            className="btn btn-sm btn-outline flex items-center gap-1"
                                            disabled={loading}
                                            onClick={() => handleEdit(key)}
                                            type="button"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            {" "}
                                            Edit
                                        </Button>
                                        <Button
                                            aria-label="Delete provider"
                                            className="btn btn-sm btn-error flex items-center gap-1"
                                            disabled={loading}
                                            onClick={() => handleDelete(key)}
                                            type="button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {" "}
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
            </div>
        </div>
    );
};

export default CustomProviderCard;
