"use client";

import { Alert, AlertDescription, AlertTitle } from "@anole/ui/components/alert";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardHeader } from "@anole/ui/components/card";
import JsonView from "@anole/ui/components/json-view";
import { Separator } from "@anole/ui/components/separator";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import { ChevronRight, FlaskConical, Loader, Pencil, RotateCw, Settings, Settings2, Trash, Wrench } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";
import { mutate } from "swr";
import { safe } from "ts-safe";

import { refreshMcpClientAction, removeMcpClientAction } from "@/app/api/mcp/actions";
import type { MCPServerInfo, MCPToolInfo } from "@/types/mcp";

import { appStore } from "../store";
import { ToolDetailPopup } from "./tool-detail-popup";

// Main MCPCard component
export const MCPCard = memo(({ config, error, id, name, status, toolInfo }: MCPServerInfo & { id: string }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { t } = useLingui();
    const appStoreMutate = appStore((state) => state.mutate);

    const isLoading = useMemo(() => isProcessing || status === "loading", [isProcessing, status]);

    const errorMessage = useMemo(() => {
        if (error) {
            return JSON.stringify(error);
        }

        return null;
    }, [error]);

    const pipeProcessing = useCallback(
        async (function_: () => Promise<any>) =>
            safe(() => setIsProcessing(true))
                .ifOk(function_)
                .ifOk(() => mutate("/api/mcp/list"))
                .ifFail(handleErrorWithToast)
                .watch(() => setIsProcessing(false)),
        [],
    );

    const handleRefresh = useCallback(() => pipeProcessing(() => refreshMcpClientAction(id)), [id]);

    const handleDelete = useCallback(async () => {
        await pipeProcessing(() => removeMcpClientAction(id));
    }, [id]);

    return (
        <Card className="hover:border-foreground/20 bg-secondary/40 relative transition-colors">
            {isLoading && <div className="bg-background/50 absolute inset-0 z-10 flex h-full w-full animate-pulse items-center justify-center" />}
            <CardHeader className="mb-2 flex items-center gap-1">
                {isLoading && <Loader className="z-20 mr-1 size-4 animate-spin" />}

                <h4 className="flex items-center gap-1 text-xs font-bold sm:text-lg">{name}</h4>
                <div className="flex-1" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={() =>
                                appStoreMutate({
                                    mcpCustomizationPopup: {
                                        config,
                                        error,
                                        id,
                                        name,
                                        status,
                                        toolInfo,
                                    },
                                })}
                            size="icon"
                            variant="ghost"
                        >
                            <Settings2 className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t`mcpServerCustomization`}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link className="hidden cursor-pointer sm:block" href={`/mcp/test/${encodeURIComponent(id)}`}>
                            <Button size="icon" variant="ghost">
                                <FlaskConical className="size-3.5" />
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t`toolsTest`}</p>
                    </TooltipContent>
                </Tooltip>
                <div className="h-4">
                    <Separator orientation="vertical" />
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleRefresh} size="icon" variant="ghost">
                            <RotateCw className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t`refresh`}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleDelete} size="icon" variant="ghost">
                            <Trash className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t`delete`}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link className="cursor-pointer" href={`/mcp/modify/${encodeURIComponent(id)}`}>
                            <Button size="icon" variant="ghost">
                                <Pencil className="size-3.5" />
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t`edit`}</p>
                    </TooltipContent>
                </Tooltip>
            </CardHeader>

            {errorMessage && <ErrorAlert error={errorMessage} />}

            <div className="relative hidden w-full sm:flex">
                <CardContent className="flex h-full max-h-[240px] w-full min-w-0 flex-row gap-4 overflow-y-auto text-sm">
                    <div className="flex h-full w-1/2 min-w-0 flex-col border-r pr-2">
                        <div className="z-10 mb-2 flex items-center gap-2 pt-2 pb-1">
                            <Settings className="text-muted-foreground" size={14} />
                            <h5 className="text-muted-foreground text-sm font-medium">{t`configuration`}</h5>
                        </div>
                        <JsonView data={config} />
                    </div>

                    <div className="flex h-full w-1/2 min-w-0 flex-col">
                        <div className="z-10 mb-4 flex items-center gap-2 pt-2 pb-1">
                            <Wrench className="text-muted-foreground" size={14} />
                            <h5 className="text-muted-foreground text-sm font-medium">{t`availableTools`}</h5>
                        </div>

                        {toolInfo.length > 0
                            ? (
                                <ToolsList serverId={id} tools={toolInfo} />
                            )
                            : (
                                <div className="bg-secondary/30 rounded-md p-3 text-center">
                                    <p className="text-muted-foreground text-sm">{t`noToolsAvailable`}</p>
                                </div>
                            )}
                    </div>
                </CardContent>
            </div>
        </Card>
    );
});

// Tools list component
const ToolsList = memo(({ serverId, tools }: { serverId: string; tools: MCPToolInfo[] }) => (
    <div className="space-y-2 pr-2">
        {tools.map((tool) => (
            <div className="bg-secondary hover:bg-input flex items-start gap-2 rounded-md p-2 transition-colors" key={tool.name}>
                <ToolDetailPopup serverId={serverId} tool={tool}>
                    <div className="min-w-0 flex-1 cursor-pointer">
                        <p className="mb-1 truncate text-sm font-medium">{tool.name}</p>
                        <p className="text-muted-foreground line-clamp-1 text-xs">{tool.description}</p>
                    </div>
                </ToolDetailPopup>

                <div className="flex items-center justify-center self-stretch px-1">
                    <ChevronRight size={16} />
                </div>
            </div>
        ))}
    </div>
));

ToolsList.displayName = "ToolsList";

// Error alert component
const ErrorAlert = memo(({ error }: { error: string }) => (
    <div className="px-6 pb-2">
        <Alert className="border-destructive" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    </div>
));

ErrorAlert.displayName = "ErrorAlert";
