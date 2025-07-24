"use client";

import { Textarea } from "@anole/ui/components/textarea";
import cn from "@anole/ui/utils/cn";
import { useReactFlow } from "@xyflow/react";
import { Link, Plus, TriangleAlertIcon, VariableIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { findAvailableSchemaBySource } from "../../lib/workflow/shared.workflow";
import type { HttpMethod, HttpNodeData, OutputSchemaSourceKey, UINode } from "../../lib/workflow/workflow.interface";
import { HttpValueInput } from "../http-value-input";
import { VariableMentionItem } from "../variable-mention-item";
import { VariableSelect } from "../variable-select";

const capitalizeFirstLetter = (string_: string): string => string_.charAt(0).toUpperCase() + string_.slice(1);

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

const tabs = ["basic", "headers", "query", "body"] as const;

const headerExample = [
    {
        key: "Content-Type",
        value: "application/json",
    },
    {
        key: "Authorization",
        value: "Bearer <token>",
    },
    {
        key: "X-API-Key",
        value: "1234567890",
    },
];

const queryExample = [
    {
        key: "page",
        value: "1",
    },
    {
        key: "limit",
        value: "10",
    },
    {
        key: "sort",
        value: "created_at",
    },
];

export const HttpNodeConfig = ({ node }: { node: UINode<any> }) => {
    const httpNode = node.data as HttpNodeData;
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("basic");

    const { getEdges, getNodes, updateNodeData } = useReactFlow<UINode>();

    const handleUpdateNode = (updates: Partial<HttpNodeData>) => {
        updateNodeData(node.id, updates);
    };

    const addHeader = () => {
        const currentHeaders = httpNode.headers || [];

        handleUpdateNode({
            headers: [...currentHeaders, { key: "", value: undefined }],
        });
    };

    const updateHeader = (index: number, key: string, value?: any) => {
        const currentHeaders = httpNode.headers || [];
        const newHeaders = [...currentHeaders];

        newHeaders[index] = { key, value };
        handleUpdateNode({ headers: newHeaders });
    };

    const removeHeader = (index: number) => {
        const currentHeaders = httpNode.headers || [];
        const newHeaders = currentHeaders.filter((_, index_) => index_ !== index);

        handleUpdateNode({ headers: newHeaders });
    };

    const addQueryParameter = () => {
        const currentQuery = httpNode.query || [];

        handleUpdateNode({
            query: [...currentQuery, { key: "", value: undefined }],
        });
    };

    const updateQueryParameter = (index: number, key: string, value?: any) => {
        const currentQuery = httpNode.query || [];
        const newQuery = [...currentQuery];

        newQuery[index] = { key, value };
        handleUpdateNode({ query: newQuery });
    };

    const removeQueryParameter = (index: number) => {
        const currentQuery = httpNode.query || [];
        const newQuery = currentQuery.filter((_, index_) => index_ !== index);

        handleUpdateNode({ query: newQuery });
    };

    const isBodyVariable = httpNode.body && typeof httpNode.body === "object" && "nodeId" in httpNode.body;

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="relative flex">
                <div className="pointer-events-none absolute inset-0 w-full border-b" />
                {tabs.map((tab) => (
                    <Button
                        className={cn("rounded-none border-b", tab === activeTab && "border-primary")}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        variant="ghost"
                    >
                        {capitalizeFirstLetter(tab)}
                    </Button>
                ))}
            </div>

            <Card className="border-none">
                <CardHeader className="sr-only">
                    <CardTitle>
                        {activeTab === "basic"
                            ? "HTTP Request Configuration"
                            : activeTab === "headers"
                                ? "Request Headers"
                                : activeTab === "query"
                                    ? "Query Parameters"
                                    : "Request Body"}
                    </CardTitle>
                </CardHeader>

                {activeTab === "basic" && (
                    <CardContent className="space-y-4">
                        {/* HTTP Method */}
                        <div className="space-y-2">
                            <Label htmlFor="method">Method</Label>
                            <Select
                                onValueChange={(value) =>
                                    handleUpdateNode({
                                        method: value as HttpMethod,
                                    })}
                                value={httpNode.method}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select HTTP method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {HTTP_METHODS.map((method) => (
                                        <SelectItem key={method} value={method}>
                                            {method}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* URL */}
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <HttpValueInput
                                allowedTypes={["string"]}
                                currentNodeId={httpNode.id}
                                onChange={(value) => handleUpdateNode({ url: value })}
                                placeholder="https://api.example.com/endpoint"
                                value={httpNode.url}
                            />
                        </div>

                        {/* Timeout */}
                        <div className="space-y-2">
                            <Label htmlFor="timeout">Timeout (ms)</Label>
                            <Input
                                id="timeout"
                                max={300_000}
                                min={1000}
                                onChange={(e) =>
                                    handleUpdateNode({
                                        timeout: Number.parseInt(e.target.value) || 30_000,
                                    })}
                                step={1000}
                                type="number"
                                value={httpNode.timeout || 30_000}
                            />
                            <p className="text-xs text-gray-500">Request timeout in milliseconds (1s - 5min)</p>
                        </div>
                    </CardContent>
                )}

                {/* Headers Configuration */}
                {activeTab === "headers" && (
                    <CardContent className="space-y-4">
                        {(httpNode.headers || []).map((header, index) => (
                            <div className="flex items-end gap-2" key={index}>
                                <div>
                                    <Label className="mb-1 ml-1 text-xs">Key</Label>
                                    <Input
                                        className="w-24 placeholder:text-xs"
                                        onChange={(e) => updateHeader(index, e.target.value, header.value)}
                                        placeholder={headerExample[index]?.key}
                                        value={header.key}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="mb-1 ml-1 text-xs">Value</Label>
                                    <HttpValueInput
                                        allowedTypes={["string", "number"]}
                                        className="max-w-[230px]"
                                        currentNodeId={httpNode.id}
                                        onChange={(value) => updateHeader(index, header.key, value)}
                                        onDelete={() => removeHeader(index)}
                                        placeholder={headerExample[index]?.value}
                                        value={header.value}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button className="w-full" onClick={addHeader} variant="outline">
                            <Plus className="size-3.5" />
                            Add Header
                        </Button>
                    </CardContent>
                )}

                {/* Query Parameters Configuration */}
                {activeTab === "query" && (
                    <CardContent className="space-y-4">
                        {(httpNode.query || []).map((parameter, index) => (
                            <div className="flex items-end gap-2" key={index}>
                                <div>
                                    <Label className="text-muted-foreground mb-1 ml-1 text-xs">Key</Label>
                                    <Input
                                        className="w-24 placeholder:text-xs"
                                        onChange={(e) => updateQueryParameter(index, e.target.value, parameter.value)}
                                        placeholder={queryExample[index]?.key}
                                        value={parameter.key}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-muted-foreground mb-1 ml-1 text-xs">Value</Label>
                                    <HttpValueInput
                                        allowedTypes={["string", "number"]}
                                        currentNodeId={httpNode.id}
                                        onChange={(value) => updateQueryParameter(index, parameter.key, value)}
                                        onDelete={() => removeQueryParameter(index)}
                                        placeholder={queryExample[index]?.value}
                                        value={parameter.value}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button className="w-full" onClick={addQueryParameter} variant="outline">
                            <Plus className="size-3.5" />
                            Add Query Parameter
                        </Button>
                    </CardContent>
                )}

                {/* Body Configuration */}
                {activeTab === "body" && (
                    <CardContent className="space-y-4">
                        {["PATCH", "POST", "PUT"].includes(httpNode.method)
                            ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Body</Label>
                                        <VariableSelect currentNodeId={httpNode.id} onChange={(value) => handleUpdateNode({ body: value })}>
                                            <Button className="data-[state=open]:bg-secondary ml-auto" size="sm" variant={isBodyVariable ? "secondary" : "ghost"}>
                                                <VariableIcon className="size-3" />
                                            </Button>
                                        </VariableSelect>
                                    </div>
                                    {isBodyVariable
                                        ? (
                                            <VariableMentionItem
                                                className="truncate py-[7px] text-sm"
                                                {...findAvailableSchemaBySource({
                                                    edges: getEdges(),
                                                    nodeId: httpNode.id,
                                                    nodes: getNodes().map((node) => node.data),
                                                    source: httpNode.body as OutputSchemaSourceKey,
                                                })}
                                                onRemove={() => handleUpdateNode({ body: undefined })}
                                            />
                                        )
                                        : (
                                            <Textarea
                                                className="h-48 resize-none"
                                                onChange={(e) => handleUpdateNode({ body: e.target.value })}
                                                placeholder={`{
  "name": "example",
  "value": 123
}`}
                                                value={httpNode.body?.toString() || ""}
                                            />
                                        )}
                                    <p className="text-muted-foreground mt-4 px-4 text-xs">
                                        Request body content. JSON format will be auto-detected and Content-Type header will be set automatically if not specified.
                                    </p>
                                </div>
                            )
                            : (
                                <div className="text-muted-foreground py-8 text-center">
                                    <p>
                                        Request body is not available for
                                        {httpNode.method}
                                        {" "}
                                        requests.
                                    </p>
                                    <p className="mt-1 text-xs">Only POST, PUT, and PATCH requests can have a body.</p>
                                </div>
                            )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export const HttpNodeDataStack = ({ data }: { data: HttpNodeData }) => {
    const { getNodes } = useReactFlow();

    const urlDisplay = (() => {
        if (!data.url)
            return "No URL";

        if (typeof data.url === "string") {
            const isUrl = data.url.startsWith("http");

            return (
                <div className="bg-background flex w-48 items-center gap-1 rounded-sm px-2 py-1">
                    {isUrl ? <Link className="size-3 text-blue-500" /> : <TriangleAlertIcon className="text-destructive size-3" />}

                    <span className="text-foreground flex-1 truncate">{data.url}</span>
                </div>
            );
        }

        if (typeof data.url === "object" && "nodeId" in data.url) {
            const nodes = getNodes() as UINode[];
            const urlAsSource = data.url as OutputSchemaSourceKey;
            const sourceNode = nodes.find((node) => node.data.id === urlAsSource.nodeId);

            return (
                <VariableMentionItem
                    className="w-full text-[10px] ring-0"
                    nodeName={sourceNode?.data.name || "ERROR"}
                    notFound={!sourceNode}
                    path={urlAsSource.path}
                />
            );
        }

        return "Unknown source";
    })();

    return (
        <div className="mt-4 flex flex-col gap-1 px-4">
            <div className="gap-2s flex items-center px-2 py-1 text-[10px]">
                <span className="text-muted-foreground rounded-lg px-1.5 py-0.5 font-semibold">{data.method}</span>
                <div className="text-muted-foreground flex flex-1 items-center truncate font-bold">{urlDisplay}</div>
            </div>
        </div>
    );
};
