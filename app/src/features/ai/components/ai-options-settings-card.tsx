import { t } from "@lingui/core/macro";
import { Plus, X } from "lucide-react";
import type { FC } from "react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const Section: FC<{ children: React.ReactNode; description?: string; title: string }> = ({ children, description, title }) => (
    <section className="mb-6">
        <div className="mb-1 text-base font-semibold">{title}</div>
        {description && <div className="text-muted-foreground mb-2 text-sm">{description}</div>}
        {children}
    </section>
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

    const generateHeaderId = () => Math.random().toString(36).slice(2) + Date.now();

    const handleAddHeader = () => {
        if (headerKey && headerValue) {
            setHeaders([...headers, { id: generateHeaderId(), key: headerKey, value: headerValue }]);
            setHeaderKey("");
            setHeaderValue("");
        }
    };
    const handleDeleteHeader = (id: string) => {
        setHeaders(headers.filter((header) => header.id !== id));
    };
    const handleHeaderKeyChange = (id: string, newKey: string) => {
        setHeaders(headers.map((header) => (header.id === id ? { ...header, key: newKey } : header)));
    };
    const handleHeaderValueChange = (id: string, newValue: string) => {
        setHeaders(headers.map((header) => (header.id === id ? { ...header, value: newValue } : header)));
    };

    const handleAddServer = () => {
        // TODO: Implement server addition logic
        setDialogOpen(false);
        setServerName("");
        setServerUrl("");
        setProtocol("http");
        setHeaders([]);
    };

    return (
        <div className="space-y-6">
            <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
                <Section description={t`Store and retrieve information across conversations for enhanced AI context`} title={t`AI Memory`}>
                    <></>
                </Section>
                <Section title={t`Setup`}>
                    <div className="mb-2">
                        <div className="font-medium">{t`MCP Servers`}</div>
                        <div className="text-muted-foreground mb-2 text-sm">{t`Connect to Model Context Protocol servers for additional AI capabilities`}</div>
                        <ul className="mb-2">
                            {MCP_SERVERS.map((server) => (
                                <li className="text-muted-foreground text-xs" key={server.url}>
                                    {server.name}
                                    {" "}
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
                                <DialogTitle>{t`Add New MCP Server`}</DialogTitle>
                                <DialogDescription>{t`Connect to Model Context Protocol servers for additional AI tools.`}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input onChange={(e) => setServerName(e.target.value)} placeholder={t`my-server`} value={serverName} />
                                <Input onChange={(e) => setServerUrl(e.target.value)} placeholder={t`http://localhost:3000/mcp`} value={serverUrl} />
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
                                                    onChange={(e) => handleHeaderKeyChange(header.id, e.target.value)}
                                                    value={header.key}
                                                />
                                                <Input
                                                    aria-label={t`Header Value`}
                                                    className="w-1/2"
                                                    onChange={(e) => handleHeaderValueChange(header.id, e.target.value)}
                                                    value={header.value}
                                                />
                                                <button
                                                    aria-label="Delete header"
                                                    className="text-muted-foreground hover:text-destructive ml-1"
                                                    onClick={() => handleDeleteHeader(header.id)}
                                                    style={{ lineHeight: 0 }}
                                                    type="button"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input className="w-1/3" onChange={(e) => setHeaderKey(e.target.value)} placeholder={t`Header Key`} value={headerKey} />
                                        <Input
                                            className="w-1/2"
                                            onChange={(e) => setHeaderValue(e.target.value)}
                                            placeholder={t`Header Value`}
                                            value={headerValue}
                                        />
                                        <Button onClick={handleAddHeader} type="button" variant="secondary">
                                            <Plus className="h-4 w-4" />
                                            {t`Add Header`}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        {t`Cancel`}
                                    </Button>
                                </DialogClose>
                                <Button onClick={handleAddServer} type="button">
                                    {t`Add Server`}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </div>
                </Section>
                <Section
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
                </Section>
                <Section title={t`Search Sources`}>
                    <div className="flex items-center gap-4">
                        <Switch checked={searchIncludeSourcesByDefault} onCheckedChange={setSearchIncludeSourcesByDefault} />
                        <span className="text-muted-foreground text-sm">{t`Automatically include source links and citations in search responses`}</span>
                    </div>
                </Section>
            </Dialog>
        </div>
    );
};

export default AiOptionsSettingsCard;
