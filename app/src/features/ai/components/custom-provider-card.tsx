import { api } from "@anole/convex/api";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Server, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod/v4";
import { useLingui } from "@lingui/react/macro";

import CopyButton from "@/components/copy-button";
import { PasswordInput } from "@/components/form/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const CustomProviderCard: FC = () => {
    const { t } = useLingui();
    const aiSettings = useQuery(api.auth.functions.getAIUserPreferences, {});
    const updateAIUserSettingsMutation = useMutation(api.auth.functions.updateAIUserPreferences);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteKey, setPendingDeleteKey] = useState<string | undefined>(undefined);

    const customAIProviders = aiSettings?.customAIProviders;
    const customProviders: CustomProviders = useMemo(() => customAIProviders || {}, [customAIProviders]);

    const providerSchema = z.object({
        enabled: z.boolean(),
        encryptedKey: z.string().min(1, t`API Key is required`),
        endpoint: z.url(t`Must be a valid URL`),
        name: z.string().min(2, t`Name is required`),
    }).strict();

    const form = useAppForm({
        defaultValues: initialForm,
        onSubmit: async ({ value }) => {
            setLoading(true);
            const key = editingKey || value.name;

            await updateAIUserSettingsMutation({
                customAIProviders: {
                    ...customProviders,
                    [key]: { ...value },
                },
            });
            setEditingKey(undefined);
            setDialogOpen(false);
            form.reset();
            setLoading(false);
        },
        validators: {
            onChange: providerSchema,
        },
    });

    const openCreateDialog = useCallback(() => {
        setEditingKey(undefined);
        setDialogOpen(true);
    }, []);

    const openEditDialog = useCallback((key: string) => {
        setEditingKey(key);
        setDialogOpen(true);
    }, []);

    useEffect(() => {
        if (dialogOpen && editingKey) {
            form.reset(customProviders[editingKey] ?? initialForm);
        } else if (dialogOpen && !editingKey) {
            form.reset(initialForm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogOpen, editingKey, customProviders]);

    const handleDelete = useCallback(async (key: string) => {
        setLoading(true);
        const updated = { ...customProviders };

        delete updated[key];
        await updateAIUserSettingsMutation({ customAIProviders: updated });
        setLoading(false);

        if (editingKey === key) {
            setEditingKey(undefined);
            setDialogOpen(false);
        }
    }, [customProviders, editingKey, updateAIUserSettingsMutation]);

    const handleCancel = useCallback(() => {
        setEditingKey(undefined);
        setDialogOpen(false);
        form.reset();
    }, [form]);

    // Checkbox handler: convert CheckedState to boolean
    const handleCheckboxChange = useCallback((checked: boolean | "indeterminate") => {
        form.setFieldValue("enabled", checked === true);
    }, [form]);

    const handleDialogOpenAutoFocus = useCallback((event: Event) => {
        event.preventDefault();
    }, []);

    const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
    }, [form]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>, field: { handleChange: (value: string) => void }) =>
        field.handleChange(event.target.value);

    const handleEndpointChange = (event: React.ChangeEvent<HTMLInputElement>, field: { handleChange: (value: string) => void }) =>
        field.handleChange(event.target.value);

    const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>, field: { handleChange: (value: string) => void }) =>
        field.handleChange(event.target.value);

    // Stable handlers for edit/delete buttons
    const getEditButtonHandler = useCallback((key: string) => () => openEditDialog(key), [openEditDialog]);

    const openDeleteDialog = useCallback((key: string) => {
        setPendingDeleteKey(key);
        setConfirmOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!pendingDeleteKey)
            return;

        await handleDelete(pendingDeleteKey);
        setConfirmOpen(false);
        setPendingDeleteKey(undefined);
    }, [pendingDeleteKey, handleDelete]);

    const handleConfirmDialogOpenChange = useCallback((open: boolean) => {
        setConfirmOpen(open);

        if (!open)
            setPendingDeleteKey(undefined);
    }, []);

    return (
        <div className="space-y-8">
            <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
                <div className="flex justify-end mb-4">
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} type="button" variant="default">
                            {t`Add Provider`}
                        </Button>
                    </DialogTrigger>
                </div>
                <DialogContent onOpenAutoFocus={handleDialogOpenAutoFocus}>
                    <DialogHeader>
                        <DialogTitle>{editingKey ? t`Edit Provider` : t`Add Custom Provider`}</DialogTitle>
                        <DialogDescription>
                            {editingKey ? t`Update your custom AI provider details.` : t`Add a new custom AI provider for your workspace.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form.AppForm>
                        <form
                            className="space-y-6"
                            onSubmit={handleFormSubmit}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <form.AppField name="name">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`Provider Name`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    autoComplete="off"
                                                    className="input input-bordered"
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) => handleNameChange(event, field)}
                                                    placeholder={t`Provider Name`}
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
                                            <field.FormLabel>{t`API Endpoint`}</field.FormLabel>
                                            <field.FormControl>
                                                <Input
                                                    autoComplete="off"
                                                    className="input input-bordered"
                                                    disabled={loading}
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) => handleEndpointChange(event, field)}
                                                    placeholder={t`API Endpoint`}
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
                                            <field.FormLabel>{t`Encrypted API Key`}</field.FormLabel>
                                            <field.FormControl>
                                                <PasswordInput
                                                    aria-describedby="key-help"
                                                    autoComplete="off"
                                                    disabled={loading}
                                                    enableToggle
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) => handleKeyChange(event, field)}
                                                    placeholder={t`Encrypted API Key`}
                                                    value={field.state.value}
                                                />
                                            </field.FormControl>
                                            <field.FormDescription id="key-help">{t`Key is hidden for security.`}</field.FormDescription>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </form.AppField>
                                <form.AppField name="enabled">
                                    {(field) => (
                                        <field.FormItem>
                                            <field.FormLabel>{t`Status`}</field.FormLabel>
                                            <field.FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        aria-checked={field.state.value}
                                                        checked={field.state.value}
                                                        disabled={loading}
                                                        onCheckedChange={handleCheckboxChange}
                                                    />
                                                    <span className={`badge ${field.state.value ? "badge-success" : "badge-ghost"}`}>{field.state.value ? t`Enabled` : t`Disabled`}</span>
                                                </div>
                                            </field.FormControl>
                                            <field.FormMessage />
                                        </field.FormItem>
                                    )}
                                </form.AppField>
                            </div>
                            <DialogFooter>
                                <Button aria-busy={loading} disabled={loading} type="submit">
                                    {editingKey ? t`Update Provider` : t`Add Provider`}
                                </Button>
                                <Button disabled={loading} onClick={handleCancel} type="button" variant="secondary">
                                    {t`Cancel`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </form.AppForm>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                cancelLabel={t`Cancel`}
                confirmLabel={t`Delete`}
                description={t`Are you sure you want to delete this provider? This action cannot be undone.`}
                loading={loading}
                onConfirm={handleConfirmDelete}
                onOpenChange={handleConfirmDialogOpenChange}
                open={confirmOpen}
                title={t`Delete Provider`}
            />

            <div>
                {Object.entries(customProviders).length === 0
                    ? (
                        <div className="text-zinc-500 text-center py-8">{t`No custom providers.`}</div>
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
                                                <span className={`badge ${provider.enabled ? "badge-success" : "badge-ghost"}`}>{provider.enabled ? t`Enabled` : t`Disabled`}</span>
                                            </div>
                                            <div className="text-xs text-zinc-500">{provider.endpoint}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                                                {t`Key:`}
                                                {" "}
                                                {provider.encryptedKey.slice(0, 6)}
                                                ***
                                                <CopyButton textToCopy={provider.encryptedKey} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 md:mt-0">
                                        <Button
                                            aria-label={t`Edit provider`}
                                            className="btn btn-sm btn-outline flex items-center gap-1"
                                            disabled={loading}
                                            onClick={getEditButtonHandler(key)}
                                            type="button"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            {" "}
                                            {t`Edit`}
                                        </Button>
                                        <Button
                                            aria-label={t`Delete provider`}
                                            className="btn btn-sm btn-error flex items-center gap-1"
                                            disabled={loading}
                                            onClick={() => openDeleteDialog(key)}
                                            type="button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {" "}
                                            {t`Delete`}
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