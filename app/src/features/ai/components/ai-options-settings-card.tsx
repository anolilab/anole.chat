import { api } from "@anole/convex/api";
import { t } from "@lingui/core/macro";
import { useMutation, useQuery } from "convex/react";
import { Plus, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    headers: z.array(headerSchema),
    protocol: z.string().min(1, t`Protocol is required`),
    serverName: z.string().min(1, t`Server name is required`),
    serverUrl: z.url(t`Must be a valid URL`).min(1, t`Server URL is required`),
}).strict();

const AiOptionsSettingsCard: FC = () => {
    const aiUserPreferences = useQuery(api.auth.functions.getAIUserPreferences, {});
    const [dialogOpen, setDialogOpen] = useState(false);
    const updateAIUserPreferences = useMutation(api.auth.functions.updateAIUserPreferences);

    // Handler for searchProvider change
    const handleSearchProviderChange = async (value: string) => {
        await updateAIUserPreferences({
            searchProvider: value,
        });
    };

    // Handler for searchIncludeSourcesByDefault change
    const handleSearchIncludeSourcesChange = async (value: boolean) => {
        await updateAIUserPreferences({
            searchIncludeSourcesByDefault: value,
        });
    };

    const defaultValues: {
        headers: { key: string; value: string }[];
        protocol: string;
        serverName: string;
        serverUrl: string;
    } = {
        headers: [],
        protocol: "http",
        serverName: "",
        serverUrl: "",
    };

    const form = useAppForm({
        defaultValues,
        onSubmit: async () => {
            const filteredHeaders = form.state.values.headers.filter((h) => h.key && h.value);
            const newServer = {
                headers: filteredHeaders.map(({ id, key, value }) => { return { id, key, value }; }),
                name: form.state.values.serverName,
                protocol: form.state.values.protocol,
                url: form.state.values.serverUrl,
            };
            const currentServers = Array.isArray(aiUserPreferences?.mcpServers) ? aiUserPreferences.mcpServers : [];
            const updatedServers = [
                ...currentServers,
                newServer,
            ];

            await updateAIUserPreferences({
                mcpServers: updatedServers,
            });
            setDialogOpen(false);
            form.reset();
        },
        validators: { onChange: mcpServerSchema },
    });

    const handleAddHeader = () => {
        form.setFieldValue("headers", [...form.state.values.headers, { key: "", value: "" }]);
    };

    const handleDeleteHeader = useCallback((key: string) => {
        form.setFieldValue(
            "headers",
            form.state.values.headers.filter((header) => header.key !== key),
        );
    }, [form]);

    const handleHeaderKeyChange = (key: string, newKey: string) => {
        form.setFieldValue(
            "headers",
            form.state.values.headers.map((header) =>
                (header.key === key ? { ...header, key: newKey } : header),
            ),
        );
    };
    const handleHeaderValueChange = (key: string, newValue: string) => {
        form.setFieldValue(
            "headers",
            form.state.values.headers.map((header) =>
                (header.key === key ? { ...header, value: newValue } : header),
            ),
        );
    };

    return (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <SettingsSection description={t`Store and retrieve information across conversations for enhanced AI context`} title={t`AI Memory`}>
                <div className="text-muted-foreground text-sm italic">{t`(Coming soon)`}</div>
            </SettingsSection>

            <SettingsSection description={t`Connect to Model Context Protocol servers for additional AI capabilities`} title={t`Setup`}>
                <div className="mb-2">
                    <div className="mb-1 font-medium">{t`MCP Servers`}</div>
                    <ul className="mb-2">
                        {(aiUserPreferences?.mcpServers || []).map((server: any, index: number) => (
                            <li className="text-muted-foreground text-xs" key={server.url + index}>
                                {server.name}
                                <span className="ml-2 text-[10px]">{server.url}</span>
                            </li>
                        ))}
                    </ul>
                    <DialogTrigger asChild>
                        <Button size="sm" type="button" variant="outline">
                            {t`Add MCP Server`}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitleUI>{t`Add New MCP Server`}</DialogTitleUI>
                            <DialogDescription>{t`Connect to Model Context Protocol servers for additional AI tools.`}</DialogDescription>
                        </DialogHeader>
                        <form.AppForm>
                            <form className="space-y-4" onSubmit={form.handleSubmit}>
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
                                                <Button onClick={handleAddHeader} size="sm" type="button" variant="secondary">
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
                                                                onChange={(event_) => handleHeaderKeyChange(header.key, event_.target.value)}
                                                                placeholder={t`Header Key`}
                                                                value={header.key}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <Input
                                                                aria-label={t`Header Value`}
                                                                onChange={(event_) => handleHeaderValueChange(header.key, event_.target.value)}
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
                                                            onClick={() => handleDeleteHeader(header.key)}
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
                                    <Button disabled={!form.state.isValid} type="submit">{t`Add Server`}</Button>
                                </DialogFooterUI>
                            </form>
                        </form.AppForm>
                    </DialogContent>
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
        </Dialog>
    );
};

export default AiOptionsSettingsCard;
