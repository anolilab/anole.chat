import { api } from "@anole/convex/api";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter as DialogFooterUI,
    DialogHeader,
    DialogTitle as DialogTitleUI,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useAppForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const WEB_SEARCH_PROVIDERS = [
    {
        description: "🔥 Advanced web scraping with content extraction and markdown support",
        id: "firecrawl",
        name: "Firecrawl",
    },
    {
        description: "Fast, privacy-focused search results from Brave's independent index",
        id: "brave",
        name: "Brave",
    },
    {
        description: "AI-powered search with advanced content chunking and source analysis",
        id: "tavily",
        name: "Tavily",
    },
    {
        description: "Google-powered search with smart content scraping and context management",
        id: "serper",
        name: "Serper",
    },
];

// For style prop reuse
const deleteHeaderButtonStyle = { lineHeight: 0 };

// Reusable section card
const SettingsSection: FC<{
    children: ReactNode;
    className?: string;
    description?: string;
    title: string;
}> = ({ children, className, description, title }) => (
    <Card className={className || "mb-6"}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const headerSchema = z.object({
    key: z.string(),
    value: z.string(),
}).strict().superRefine((data, context) => {
    if (data.key && !data.value) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: t`Value is required if key is set`,
            path: ["value"],
        });
    }
});

const mcpServerSchema = z.object({
    enabled: z.boolean(),
    headers: z.array(headerSchema),
    protocol: z.string().min(1, t`Protocol is required`),
    serverName: z.string().min(1, t`Server name is required`),
    serverUrl: z.url(t`Must be a valid URL`).min(1, t`Server URL is required`),
}).strict();

const AiOptionsSettingsCard: FC = () => {
    const aiUserPreferences = useQuery(api.auth.functions.getAIUserPreferences, {});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editServerIndex, setEditServerIndex] = useState<number | undefined>(undefined);
    const [deleteServerIndex, setDeleteServerIndex] = useState<number | undefined>(undefined);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const updateAIUserPreferences = useMutation(api.auth.functions.updateAIUserPreferences);

    const handleSearchProviderChange = async (value: string) => {
        await updateAIUserPreferences({
            ...aiUserPreferences,
            searchProvider: value,
        });
    };

    const handleSearchIncludeSourcesChange = async (value: boolean) => {
        await updateAIUserPreferences({
            ...aiUserPreferences,
            searchIncludeSourcesByDefault: value,
        });
    };

    const handleEditServer = (index: number) => {
        setEditServerIndex(index);
        setDialogOpen(true);
    };

    const handleDeleteServer = (index: number) => {
        setDeleteServerIndex(index);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteServerIndex !== null && aiUserPreferences?.mcpServers) {
            const updatedServers = aiUserPreferences.mcpServers.filter((_, index) => index !== deleteServerIndex);

            await updateAIUserPreferences({
                ...aiUserPreferences,
                mcpServers: updatedServers,
            });
        }

        setConfirmDeleteOpen(false);
        setDeleteServerIndex(undefined);
    };

    return (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <SettingsSection description={t`Store and retrieve information across conversations for enhanced AI context`} title={t`AI Memory`}>
                <div className="text-muted-foreground text-sm italic">{t`(Coming soon)`}</div>
            </SettingsSection>

            <SettingsSection description={t`Connect to Model Context Protocol servers for additional AI capabilities`} title={t`MCP Servers`}>
                <div className="mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        {(aiUserPreferences?.mcpServers || []).map((server: any, index: number) => (
                            <Card className="flex flex-col gap-2 p-4" key={server.url + index}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">{server.name}</div>
                                        <div className="text-xs break-all">Url: <span className="text-muted-foreground">{server.url}</span></div>
                                        <div className="text-xs break-all">Protocol: <span className="text-muted-foreground">{server.protocol}</span></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {server.enabled
                                            ? (
                                                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">{t`Active`}</span>
                                            )
                                            : (
                                                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{t`Inactive`}</span>
                                            )}
                                        <Button aria-label={t`Edit`} onClick={() => handleEditServer(index)} size="icon" variant="ghost">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button aria-label={t`Delete`} onClick={() => handleDeleteServer(index)} size="icon" variant="ghost">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <Button onClick={() => { setEditServerIndex(undefined); setDialogOpen(true); }} size="sm" type="button" variant="outline">
                        {t`Add MCP Server`}
                    </Button>
                    <McpServerDialog
                        aiUserPreferences={aiUserPreferences}
                        editServerIndex={editServerIndex === undefined ? undefined : editServerIndex}
                        onOpenChange={(open) => {
                            setDialogOpen(open);

                            if (!open)
                                setEditServerIndex(undefined);
                        }}
                        onSubmit={async (newServer) => {
                            let updatedServers;

                            updatedServers = editServerIndex !== undefined && aiUserPreferences?.mcpServers
                                ? aiUserPreferences.mcpServers.map((srv, index) => (index === editServerIndex ? newServer : srv))
                                : [...aiUserPreferences?.mcpServers ?? [], newServer];

                            await updateAIUserPreferences({
                                mcpServers: updatedServers,
                            });
                        }}
                        open={dialogOpen}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                description={t`Choose which service to use for web searches. BYOK providers take priority over server providers.`}
                title={t`Web Search Provider`}
            >
                <RadioGroup
                    className="mb-2"
                    onValueChange={handleSearchProviderChange}
                    value={aiUserPreferences?.searchProvider ?? "firecrawl"}
                >
                    {WEB_SEARCH_PROVIDERS.map((provider) => (
                        <div className="mb-2 flex items-start gap-2" key={provider.id}>
                            <RadioGroupItem id={provider.id} value={provider.id} />
                            <label className="flex cursor-pointer flex-col" htmlFor={provider.id}>
                                <span className="font-medium">{provider.name}</span>
                                <span className="text-muted-foreground text-xs">{provider.description}</span>
                            </label>
                        </div>
                    ))}
                </RadioGroup>
            </SettingsSection>

            <SettingsSection title={t`Search Sources`}>
                <div className="flex items-center gap-4">
                    <Switch
                        checked={aiUserPreferences?.searchIncludeSourcesByDefault ?? false}
                        onCheckedChange={handleSearchIncludeSourcesChange}
                    />
                    <span className="text-muted-foreground text-sm">{t`Automatically include source links and citations in search responses`}</span>
                </div>
            </SettingsSection>
            <ConfirmDialog
                description={t`Are you sure you want to delete this MCP server? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onOpenChange={setConfirmDeleteOpen}
                open={confirmDeleteOpen}
                title={t`Delete MCP Server`}
            />
        </Dialog>
    );
};

// New component for MCP Server Add/Edit Dialog
const McpServerDialog = ({
    aiUserPreferences,
    editServerIndex,
    onOpenChange,
    onSubmit,
    open,
}: {
    aiUserPreferences: any;
    editServerIndex: number | undefined;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: any) => Promise<void>;
    open: boolean;
}) => {
    const getDialogDefaultValues = () => {
        if (editServerIndex !== undefined && aiUserPreferences?.mcpServers) {
            const editDefaults = aiUserPreferences.mcpServers[editServerIndex];

            return {
                enabled: editDefaults.enabled ?? true,
                headers: editDefaults.headers ?? [],
                protocol: editDefaults.protocol ?? "http",
                serverName: editDefaults.name ?? "",
                serverUrl: editDefaults.url ?? "",
            };
        }

        return {
            enabled: true,
            headers: [],
            protocol: "http",
            serverName: "",
            serverUrl: "",
        };
    };
    const form = useAppForm({
        defaultValues: getDialogDefaultValues(),
        onSubmit: async () => {
            const filteredHeaders = form.state.values.headers.filter((h) => h.key && h.value);
            const newServer = {
                enabled: form.state.values.enabled,
                headers: filteredHeaders.map(({ key, value }) => { return { key, value }; }),
                name: form.state.values.serverName,
                protocol: form.state.values.protocol,
                url: form.state.values.serverUrl,
            };

            await onSubmit(newServer);
            onOpenChange(false);
        },
        validators: { onChange: mcpServerSchema },
    });

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitleUI>{editServerIndex === undefined ? t`Add New MCP Server` : t`Edit MCP Server`}</DialogTitleUI>
                    <DialogDescription>{t`Connect to Model Context Protocol servers for additional AI tools.`}</DialogDescription>
                </DialogHeader>
                <form.AppForm>
                    <form className="space-y-4" onSubmit={form.handleSubmit}>
                        <form.AppField name="enabled">
                            {(field) => (
                                <div className="flex items-center gap-2 mb-2">
                                    <Label htmlFor="mcp-enabled">{t`Enabled`}</Label>
                                    <Switch
                                        checked={field.state.value}
                                        id="mcp-enabled"
                                        onCheckedChange={field.handleChange}
                                    />
                                </div>
                            )}
                        </form.AppField>
                        <form.AppField name="serverName">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel required>{t`Server Name`}</field.FormLabel>
                                    <field.FormControl>
                                        <Input
                                            onBlur={field.handleBlur}
                                            onChange={(event_) => field.handleChange(event_.target.value)}
                                            placeholder={t`my-server`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="serverUrl">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel required>{t`Server URL`}</field.FormLabel>
                                    <field.FormControl>
                                        <Input
                                            onBlur={field.handleBlur}
                                            onChange={(event_) => field.handleChange(event_.target.value)}
                                            placeholder={t`http://example:3000/mcp`}
                                            value={field.state.value}
                                        />
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="protocol">
                            {(field) => (
                                <field.FormItem>
                                    <field.FormLabel required>{t`Protocol`}</field.FormLabel>
                                    <field.FormControl>
                                        <Select onValueChange={field.handleChange} value={field.state.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t`Protocol`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="http">HTTP</SelectItem>
                                                <SelectItem value="sse">SSE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </field.FormControl>
                                    <field.FormMessage />
                                </field.FormItem>
                            )}
                        </form.AppField>
                        <form.AppField name="headers">
                            {(field) => (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>{t`Headers`}</Label>
                                        <Button onClick={() => form.setFieldValue("headers", [...form.state.values.headers, { key: "", value: "" }])} size="sm" type="button" variant="secondary">
                                            <Plus className="h-4 w-4 mr-1" />
                                            {t`Add Header`}
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-2 my-2">
                                        {field.state.value.map((header, index) => (
                                            <div className="flex items-center gap-2" key={`empty-${index}`}>
                                                <div className="flex flex-col">
                                                    <Input
                                                        aria-label={t`Header Key`}
                                                        onChange={(event_) => form.setFieldValue(
                                                            "headers",
                                                            form.state.values.headers.map((h) => (h.key === header.key ? { ...h, key: event_.target.value } : h)),
                                                        )}
                                                        placeholder={t`Header Key`}
                                                        value={header.key}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <Input
                                                        aria-label={t`Header Value`}
                                                        onChange={(event_) => form.setFieldValue(
                                                            "headers",
                                                            form.state.values.headers.map((h) => (h.key === header.key ? { ...h, value: event_.target.value } : h)),
                                                        )}
                                                        placeholder={t`Header Value`}
                                                        value={header.value}
                                                    />
                                                    {/* Show error if key is set and value is empty */}
                                                    {header.key && !header.value && (
                                                        <span className="text-xs text-destructive mt-1">{t`Value is required if key is set`}</span>
                                                    )}
                                                </div>
                                                <button
                                                    aria-label="Delete header"
                                                    className="text-muted-foreground hover:text-destructive ml-1"
                                                    onClick={() => form.setFieldValue(
                                                        "headers",
                                                        form.state.values.headers.filter((h) => h.key !== header.key),
                                                    )}
                                                    style={deleteHeaderButtonStyle}
                                                    type="button"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form.AppField>
                        <DialogFooterUI>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {t`Cancel`}
                                </Button>
                            </DialogClose>
                            <Button disabled={!form.state.isValid} type="submit">{editServerIndex === undefined ? t`Add Server` : t`Save Changes`}</Button>
                        </DialogFooterUI>
                    </form>
                </form.AppForm>
            </DialogContent>
        </Dialog>
    );
};

export default AiOptionsSettingsCard;
