"use client";

import { Button } from "@anole/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogPortal, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import { Separator } from "@anole/ui/components/separator";
import { handleErrorWithToast } from "@anole/ui/components/shared-toast";
import { Skeleton } from "@anole/ui/components/skeleton";
import { Textarea } from "@anole/ui/components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { fetcher } from "lib/utils";
import { Info, Loader, Pencil, Trash2 } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { JsonView } from "react-json-view-lite";
import useSWR from "swr";
import { z } from "zod/v4";

import type { McpToolCustomization, MCPToolInfo } from "@/types/mcp";

// Helper function to check if schema is empty
const isEmptySchema = (schema: any): boolean => {
    if (!schema)
        return true;

    // Check properties first if available, otherwise check the schema itself
    const dataToCheck = schema.properties || schema;

    return Object.keys(dataToCheck).length === 0;
};

export const ToolDetailPopup = ({
    children,
    onUpdate,
    serverId,
    tool,
}: PropsWithChildren<{
    onUpdate?: () => void;
    serverId: string;
    tool: MCPToolInfo;
}>) => (
    <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogPortal>
            <DialogContent className="fixed overflow-hidden p-10 sm:max-w-[800px]">
                <ToolDetailPopupContent onUpdate={onUpdate} serverId={serverId} tool={tool} />
            </DialogContent>
        </DialogPortal>
    </Dialog>
);

const createApiUrl = (serverId: string, toolName: string) => `/api/mcp/tool-customizations/${serverId}/${toolName}`;

export const ToolDetailPopupContent = ({
    onUpdate,
    serverId,
    title,
    tool,
}: {
    onUpdate?: () => void;
    serverId: string;
    title?: ReactNode;
    tool: MCPToolInfo;
}) => {
    const { t } = useLingui();

    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>("");
    const [processing, setProcessing] = useState(false);

    const { data, isLoading, mutate } = useSWR<McpToolCustomization | null>(createApiUrl(serverId, tool.name), fetcher);

    const startEdit = (e: any) => {
        e.stopPropagation();
        setValue(data?.prompt ?? "");
        setEditing(true);
    };

    const handleSave = () => {
        setProcessing(true);
        z.object({
            prompt: z.string().min(1).max(1000),
        })
            .parse({
                prompt: value,
            })
            .then((body) =>
                fetch(createApiUrl(serverId, tool.name), {
                    body: JSON.stringify(body),
                    method: "POST",
                }),
            )
            .then(() => {
                mutate();
                onUpdate?.();
            })
            .catch(handleErrorWithToast)
            .finally(() => {
                setEditing(false);
                setProcessing(false);
            });
    };

    const handleDelete = () => {
        setProcessing(true);
        fetch(createApiUrl(serverId, tool.name), {
            method: "DELETE",
        })
            .then(() => {
                mutate();
                onUpdate?.();
            })
            .catch(handleErrorWithToast)
            .finally(() => {
                setEditing(false);
                setProcessing(false);
            });
    };

    return (
        <div className="flex h-[70vh] flex-col overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{title || tool.name}</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-4 text-xs">{tool.description}</DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div>
                <div className="mb-1 flex items-center">
                    <h5 className="mr-auto">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex flex-1 items-center text-xs font-medium">
                                    {t`MCP.additionalInstructions`}
                                    <Info className="text-muted-foreground ml-1 size-3" />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="whitespace-pre-wrap">{t`MCP.toolCustomizationInstructions`}</p>
                            </TooltipContent>
                        </Tooltip>
                    </h5>
                    {processing || isLoading
                        ? (
                            <Button size="icon" variant="ghost">
                                <Loader className="size-3 animate-spin" />
                            </Button>
                        )
                        : (
                            <>
                                {data?.id && !editing && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button onClick={handleDelete} size="icon" variant="ghost">
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t`Common.delete`}</TooltipContent>
                                    </Tooltip>
                                )}
                                {!editing && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button aria-label="Edit instructions" onClick={startEdit} size="icon" variant="ghost">
                                                <span className="sr-only">Edit</span>
                                                <Pencil className="size-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t`Common.edit`}</TooltipContent>
                                    </Tooltip>
                                )}
                            </>
                        )}
                </div>

                {isLoading
                    ? (
                        <Skeleton className="h-4 w-full" />
                    )
                    : editing
                        ? (
                            <div className="my-2">
                                <Textarea autoFocus className="h-full max-h-[120px] resize-none" onChange={(e) => setValue(e.target.value)} value={value} />
                                <div className="mt-2 flex justify-end gap-2">
                                    <Button onClick={() => setEditing(false)} size="sm" variant="ghost">
                                        {t`Common.cancel`}
                                    </Button>

                                    <Button onClick={handleSave} size="sm">
                                        {t`Common.save`}
                                    </Button>
                                </div>
                            </div>
                        )
                        : (
                            <p className={cn(!data?.prompt && "italic", "text-muted-foreground max-h-[120px] overflow-y-auto text-xs break-words whitespace-pre-wrap")}>
                                {data?.prompt || "None"}
                            </p>
                        )}
            </div>

            <div className="my-4 flex items-center gap-2">
                <h5 className="text-xs font-medium">{t`MCP.inputSchema`}</h5>
            </div>
            {tool.inputSchema
                ? (
                    <div className="bg-card card max-h-[40vh] overflow-y-auto rounded p-4">
                        {isEmptySchema(tool.inputSchema)
                            ? (
                                <p className="text-muted-foreground text-xs italic">{t`MCP.noSchemaPropertiesAvailable`}</p>
                            )
                            : (
                                <JsonView data={tool.inputSchema?.properties || tool.inputSchema} />
                            )}
                    </div>
                )
                : (
                    <p className="text-muted-foreground text-xs italic">{t`MCP.noSchemaPropertiesAvailable`}</p>
                )}

            <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-gradient-to-t to-transparent" />
        </div>
    );
};
