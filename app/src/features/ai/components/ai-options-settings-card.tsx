import { t } from "@lingui/core/macro";
import { Plus, X } from "lucide-react";
import type { FC, ReactNode } from "react";
import React from "react";

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
import { Input } from "@/components/ui/input";
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

const MCP_SERVERS = [{ name: "Default MCP Server", url: "https://mcp.example.com" }];

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

const AiOptionsSettingsCard: FC = () => {
    const [searchProvider, setSearchProvider] = React.useState("firecrawl");
    const [searchIncludeSourcesByDefault, setSearchIncludeSourcesByDefault] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [serverName, setServerName] = React.useState("");
    const [serverUrl, setServerUrl] = React.useState("");
    const [protocol, setProtocol] = React.useState("http");

    // Add a unique id to each header for stable React keys
    type Header = { id: string; key: string; value: string };
    const [headers, setHeaders] = React.useState<Header[]>([]);
    const [headerKey, setHeaderKey] = React.useState("");
    const [headerValue, setHeaderValue] = React.useState("");

    const handleAddHeader = React.useCallback(() => {
        if (headerKey && headerValue) {
            setHeaders((previous) => [...previous, { id: headerKey, key: headerKey, value: headerValue }]);
            setHeaderKey("");
            setHeaderValue("");
        }
    }, [headerKey, headerValue]);

    const handleDeleteHeader = React.useCallback((id: string) => {
        setHeaders((previous) => previous.filter((header) => header.id !== id));
    }, []);

    const handleHeaderKeyChange = React.useCallback((id: string, newKey: string) => {
        setHeaders((previous) => previous.map((header) => (header.id === id ? { ...header, key: newKey } : header)));
    }, []);

    const handleHeaderValueChange = React.useCallback((id: string, newValue: string) => {
        setHeaders((previous) => previous.map((header) => (header.id === id ? { ...header, value: newValue } : header)));
    }, []);

    const handleServerNameChange = React.useCallback((event_: React.ChangeEvent<HTMLInputElement>) => {
        setServerName(event_.target.value);
    }, []);

    const handleServerUrlChange = React.useCallback((event_: React.ChangeEvent<HTMLInputElement>) => {
        setServerUrl(event_.target.value);
    }, []);

    const handleHeaderKeyInputChange = React.useCallback((event_: React.ChangeEvent<HTMLInputElement>) => {
        setHeaderKey(event_.target.value);
    }, []);

    const handleHeaderValueInputChange = React.useCallback((event_: React.ChangeEvent<HTMLInputElement>) => {
        setHeaderValue(event_.target.value);
    }, []);

    const handleAddServer = React.useCallback(() => {
        // TODO: Implement server addition logic
        setDialogOpen(false);
        setServerName("");
        setServerUrl("");
        setProtocol("http");
        setHeaders([]);
    }, []);

    const handleFormSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            handleAddServer();
        },
        [handleAddServer],
    );

    // Stable handlers for header input fields
    const getHeaderKeyChangeHandler = React.useCallback(
        (id: string) => (event_: React.ChangeEvent<HTMLInputElement>) => handleHeaderKeyChange(id, event_.target.value),
        [handleHeaderKeyChange],
    );
    const getHeaderValueChangeHandler = React.useCallback(
        (id: string) => (event_: React.ChangeEvent<HTMLInputElement>) => handleHeaderValueChange(id, event_.target.value),
        [handleHeaderValueChange],
    );
    const getDeleteHeaderHandler = React.useCallback((id: string) => () => handleDeleteHeader(id), [handleDeleteHeader]);

    return (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <SettingsSection description={t`Store and retrieve information across conversations for enhanced AI context`} title={t`AI Memory`}>
                <div className="text-muted-foreground text-sm italic">{t`(Coming soon)`}</div>
            </SettingsSection>

            <SettingsSection description={t`Connect to Model Context Protocol servers for additional AI capabilities`} title={t`Setup`}>
                <div className="mb-2">
                    <div className="mb-1 font-medium">{t`MCP Servers`}</div>
                    <ul className="mb-2">
                        {MCP_SERVERS.map((server) => (
                            <li className="text-muted-foreground text-xs" key={server.url}>
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
                        <form className="space-y-4" onSubmit={handleFormSubmit}>
                            <Input onChange={handleServerNameChange} placeholder={t`my-server`} value={serverName} />
                            <Input onChange={handleServerUrlChange} placeholder={t`http://localhost:3000/mcp`} value={serverUrl} />
                            <Select onValueChange={setProtocol} value={protocol}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t`Protocol`} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="http">HTTP</SelectItem>
                                    <SelectItem value="sse">SSE</SelectItem>
                                </SelectContent>
                            </Select>
                            <div>
                                <div className="mb-2 flex flex-col gap-2">
                                    {headers.map((header) => (
                                        <div className="flex items-center gap-2" key={header.id}>
                                            <Input
                                                aria-label={t`Header Key`}
                                                className="w-1/3"
                                                onChange={getHeaderKeyChangeHandler(header.id)}
                                                value={header.key}
                                            />
                                            <Input
                                                aria-label={t`Header Value`}
                                                className="w-1/2"
                                                onChange={getHeaderValueChangeHandler(header.id)}
                                                value={header.value}
                                            />
                                            <button
                                                aria-label="Delete header"
                                                className="text-muted-foreground hover:text-destructive ml-1"
                                                onClick={getDeleteHeaderHandler(header.id)}
                                                style={deleteHeaderButtonStyle}
                                                type="button"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input className="w-1/3" onChange={handleHeaderKeyInputChange} placeholder={t`Header Key`} value={headerKey} />
                                    <Input className="w-1/2" onChange={handleHeaderValueInputChange} placeholder={t`Header Value`} value={headerValue} />
                                    <Button onClick={handleAddHeader} type="button" variant="secondary">
                                        <Plus className="h-4 w-4" />
                                        {t`Add Header`}
                                    </Button>
                                </div>
                            </div>
                            <DialogFooterUI>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        {t`Cancel`}
                                    </Button>
                                </DialogClose>
                                <Button type="submit">{t`Add Server`}</Button>
                            </DialogFooterUI>
                        </form>
                    </DialogContent>
                </div>
            </SettingsSection>

            <SettingsSection
                description={t`Choose which service to use for web searches. BYOK providers take priority over server providers.`}
                title={t`Web Search Provider`}
            >
                <RadioGroup className="mb-2" onValueChange={setSearchProvider} value={searchProvider}>
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
                    <Switch checked={searchIncludeSourcesByDefault} onCheckedChange={setSearchIncludeSourcesByDefault} />
                    <span className="text-muted-foreground text-sm">{t`Automatically include source links and citations in search responses`}</span>
                </div>
            </SettingsSection>
        </Dialog>
    );
};

export default AiOptionsSettingsCard;
