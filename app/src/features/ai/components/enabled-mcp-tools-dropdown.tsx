import { Button } from "@anole/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@anole/ui/components/dropdown-menu";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { appStore } from "../store";

export const EnabledMcpToolsDropdown = ({
    align,
    children,
    prependTools = [],
    side,
}: PropsWithChildren<{
    align?: "start" | "end";
    prependTools?: {
        id: string;
        name: string;
        tools: {
            description: string;
            name: string;
        }[];
    }[];
    side?: "left" | "right" | "top" | "bottom";
}>) => {
    const [allowedMcpServers, mcpList, noToolChoice] = appStore(useShallow((state) => [state.allowedMcpServers, state.mcpList, state.toolChoice === "none"]));

    const EnabledMcpToolsDropdown = useMemo(() => {
        const mcpTools = mcpList
            .map((mcp) => {
                const allowedMcpServerTools = allowedMcpServers?.[mcp.id]?.tools;
                const tools = mcp.toolInfo.map((tool) => {
                    return {
                        description: tool.description,
                        name: tool.name,
                    };
                });

                return {
                    id: mcp.id,
                    name: mcp.name,
                    tools: allowedMcpServerTools ? tools.filter((tool) => allowedMcpServerTools.includes(tool.name)) : tools,
                };
            })
            .filter((v) => v.tools.length);

        return [...prependTools, ...mcpTools];
    }, [allowedMcpServers, mcpList]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children || (
                    <Button variant="secondary">
                        Tool
                        {" "}
                        <ChevronDownIcon />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="min-w-40" side={side}>
                <DropdownMenuGroup className="cursor-pointer">
                    {!noToolChoice && EnabledMcpToolsDropdown.length > 0
                        ? EnabledMcpToolsDropdown.map((mcp) => (
                            <DropdownMenuSub key={mcp.id}>
                                <DropdownMenuSubTrigger>
                                    <p className="flex min-w-32 items-center gap-2 text-sm font-medium">
                                        <WrenchIcon className="size-3.5" />
                                        <span className="truncate">{mcp.name}</span>
                                    </p>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        {mcp.tools.map((tool) => (
                                            <DropdownMenuItem key={tool.name}>
                                                <div className="flex w-40 flex-col text-xs">
                                                    <p className="truncate">{tool.name}</p>
                                                    <p className="text-muted-foreground truncate">{tool.description}</p>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        ))
                        : (
                            <DropdownMenuItem>
                                <div className="flex h-full flex-col items-center justify-center">
                                    <p className="text-muted-foreground text-sm">No tools available</p>
                                </div>
                            </DropdownMenuItem>
                        )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
