"use client";

import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@anole/ui/components/dialog";
import { ExamplePlaceholder } from "@anole/ui/components/example-placeholder";
import { Input } from "@anole/ui/components/input";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Skeleton } from "@anole/ui/components/skeleton";
import { Textarea } from "@anole/ui/components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { fetcher } from "lib/utils";
import { ArrowLeft, ChevronRight, Info, Loader, Trash2, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { z } from "zod/v4";
import { useShallow } from "zustand/shallow";

import type { McpServerCustomization, MCPServerInfo, McpToolCustomization, MCPToolInfo } from "@/types/mcp";

import { appStore } from "../store";
import { ToolDetailPopupContent } from "./tool-detail-popup";

export const McpCustomizationPopup = () => {
    const [mcpCustomizationPopup, appStoreMutate] = appStore(useShallow((state) => [state.mcpCustomizationPopup, state.mutate]));

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) {
                    appStoreMutate({ mcpCustomizationPopup: undefined });
                }
            }}
            open={!!mcpCustomizationPopup}
        >
            <DialogContent className="fixed overflow-hidden p-10 sm:max-w-[800px]">
                {mcpCustomizationPopup ? <McpServerCustomizationContent mcpServerInfo={mcpCustomizationPopup} /> : null}
            </DialogContent>
        </Dialog>
    );
};

export const McpServerCustomizationContent = ({
    mcpServerInfo: { error, id, name, toolInfo },
    title,
}: {
    mcpServerInfo: MCPServerInfo & { id: string };
    title?: ReactNode;
}) => {
    const { t } = useLingui();

    const [prompt, setPrompt] = useState("");
    const [search, setSearch] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedTool, setSelectedTool] = useState<MCPToolInfo | null>(null);

    const handleSave = () => {
        setIsProcessing(true);
        z.object({
            prompt: z.string().min(1).max(3000),
        })
            .parse({
                prompt,
            })
            .then((body) =>
                fetch(`/api/mcp/server-customizations/${id}`, {
                    body: JSON.stringify(body),
                    method: "POST",
                }),
            )
            .then(() => refreshMcpServerCustomization())
            .catch(handleErrorWithToast)
            .finally(() => {
                setIsProcessing(false);
            });
    };

    const handleDelete = () => {
        setIsProcessing(true);
        fetch(`/api/mcp/server-customizations/${id}`, {
            method: "DELETE",
        })
            .then(() => refreshMcpServerCustomization())
            .catch(handleErrorWithToast)
            .finally(() => {
                setIsProcessing(false);
            });
    };

    const {
        data: mcpServerCustomization,
        isLoading: isLoadingMcpServerCustomization,
        mutate: refreshMcpServerCustomization,
    } = useSWR<null | McpServerCustomization>(`/api/mcp/server-customizations/${id}`, fetcher, {
        onSuccess: (data) => {
            setPrompt(data?.prompt || "");
        },
        revalidateOnFocus: false,
    });

    const {
        data: mcpToolCustomizations,
        isLoading: isLoadingMcpToolCustomizations,
        mutate: refreshMcpToolCustomizations,
    } = useSWR<McpToolCustomization[]>(`/api/mcp/tool-customizations/${id}`, fetcher, {
        fallbackData: [],
    });

    const toolCustomizations = useMemo(() => {
        const mcpToolCustomizationsMap = new Map(mcpToolCustomizations?.map((tool) => [tool.toolName, tool]));

        return toolInfo
            .filter((tool) => tool.name.includes(search))
            .map((tool) => {
                return {
                    description: tool.description,
                    id: mcpToolCustomizationsMap.get(tool.name)?.id || null,
                    inputSchema: tool.inputSchema,
                    name: tool.name,
                    prompt: mcpToolCustomizationsMap.get(tool.name)?.prompt || "",
                };
            });
    }, [mcpToolCustomizations, toolInfo, search]);

    if (selectedTool) {
        return (
            <ToolDetailPopupContent
                onUpdate={refreshMcpToolCustomizations}
                serverId={id}
                title={(
                    <div className="flex flex-col">
                        <button
                            className="text-muted-foreground hover:text-foreground mb-8 flex items-center gap-2 text-sm transition-colors"
                            onClick={() => setSelectedTool(null)}
                        >
                            <ArrowLeft className="size-3" />
                            {t`Back`}
                        </button>
                        {selectedTool.name}
                    </div>
                )}
                tool={selectedTool}
            />
        );
    }

    return (
        <div className="flex h-[70vh] flex-col overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="mb-2 flex items-center gap-2">
                    {title || name}
                    {" "}
                    {error ? <p className="text-destructive text-xs">error</p> : null}
                </DialogTitle>
                <DialogDescription>{/*  */}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center">
                <h5 className="mr-auto flex items-center py-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-muted-foreground flex flex-1 items-center text-xs font-medium">
                                {t`MCP Customization`}
                                <Info className="text-muted-foreground ml-1 size-3" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="whitespace-pre-wrap">{t`MCP server customization instructions will be added to the system prompt when the MCP server is available.`}</p>
                        </TooltipContent>
                    </Tooltip>
                </h5>
                {isProcessing || isLoadingMcpServerCustomization
                    ? (
                        <Button size="icon" variant="ghost">
                            <Loader className="size-3 animate-spin" />
                        </Button>
                    )
                    : (
                        <>
                            {mcpServerCustomization?.id && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleDelete} size="icon" variant="ghost">
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t`Delete`}</TooltipContent>
                                </Tooltip>
                            )}
                            {prompt !== (mcpServerCustomization?.prompt || "") && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleSave} size="sm" variant="secondary">
                                            {t`Save`}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t`Edit`}</TooltipContent>
                                </Tooltip>
                            )}
                        </>
                    )}
            </div>
            <div className="relative">
                <Textarea
                    autoFocus
                    className="h-20 w-full resize-none overflow-y-auto"
                    onChange={(e) => setPrompt(e.target.value)}
                    readOnly={isProcessing || isLoadingMcpServerCustomization}
                    value={prompt}
                />
                {!prompt && (
                    <div className="pointer-events-none absolute top-0 left-0 w-full px-4 py-2">
                        <ExamplePlaceholder placeholder={[t`eg. If the input value is email, always enter the email in the format example@example.com.`]} />
                    </div>
                )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
                <div className="text-muted-foreground flex w-fit items-center text-xs">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-muted-foreground flex flex-1 items-center text-xs font-medium">
                                {t`Tool Customization Instructions`}
                                <Info className="text-muted-foreground ml-1 size-3" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="whitespace-pre-wrap">{t`Tool customization instructions will be added to the system prompt when the tool is available.\nexample) Always enter the email in the format example@example.com.`}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Input onChange={(e) => setSearch(e.target.value)} placeholder={t`Search tools`} value={search} />

                {isLoadingMcpToolCustomizations
                    ? Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-16 w-full" key={index} />)
                    : (
                        <div className="flex flex-col gap-2">
                            {toolCustomizations.length === 0
                                ? (
                                    <Alert className="cursor-pointer py-8">
                                        <Wrench className="size-3.5" />
                                        <div className="flex w-full items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <AlertTitle>{t`No tools available`}</AlertTitle>
                                            </div>
                                        </div>
                                    </Alert>
                                )
                                : toolCustomizations.map((tool) => (
                                    <Alert className="hover:bg-input cursor-pointer" key={tool.name} onClick={() => setSelectedTool(tool)}>
                                        <Wrench className="size-3.5" />
                                        <div className="flex w-full items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <AlertTitle>{tool.name}</AlertTitle>
                                                <AlertDescription className="flex w-full min-w-0 items-start gap-2">
                                                    <p
                                                        className={cn(
                                                            !tool.prompt && "italic",
                                                            "text-muted-foreground line-clamp-3 text-xs break-all whitespace-pre-wrap",
                                                        )}
                                                    >
                                                        {tool.prompt || "None"}
                                                    </p>
                                                </AlertDescription>
                                            </div>
                                            <ChevronRight className="size-3.5 flex-shrink-0" />
                                        </div>
                                    </Alert>
                                ))}
                        </div>
                    )}
            </div>
        </div>
    );
};
