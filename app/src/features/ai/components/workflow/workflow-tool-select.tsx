import { Button } from "@anole/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@anole/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import MCPIcon from "@anole/ui/icons/mcp";
import { useLingui } from "@lingui/react/macro";
import { groupBy } from "lib/utils";
import { ChevronDownIcon, WrenchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { WorkflowToolKey } from "../../lib/workflow/workflow.interface";

export const WorkflowToolSelect = ({
    align,
    children,
    onChange,
    side,
    tool,
    tools,
}: {
    align?: "start" | "end" | "center";
    children?: ReactNode;
    onChange: (tool: WorkflowToolKey) => void;
    side?: "top" | "bottom" | "left" | "right";
    tool?: WorkflowToolKey;
    tools: WorkflowToolKey[];
}) => {
    const { t } = useLingui();
    const [open, setOpen] = useState(false);
    const mcpToolsByServerId = useMemo(() => {
        const mcpTools = tools.filter((tool) => tool.type === "mcp-tool");

        return Object.entries(groupBy(mcpTools, "serverId")).map(([serverId, tools]) => {
            return {
                serverId,
                serverName: tools[0].serverName,
                tools,
            };
        });
    }, [tools]);
    const defaultTools = useMemo(() => tools.filter((tool) => tool.type === "app-tool"), [tools]);

    const selectedToolLabel = useMemo(() => {
        if (!tool) {
            return (
                <>
                    <WrenchIcon className="size-3.5" />
                    <span className="text-muted-foreground">{t`Select Tool...`}</span>
                </>
            );
        }

        if (tool.type === "mcp-tool") {
            return (
                <>
                    <MCPIcon className="size-3.5" />
                    <span className="font-bold">{tool.serverName}</span>
                    <div className="bg-primary text-primary-foreground truncate rounded-md px-2">{tool.id}</div>
                </>
            );
        }

        return (
            <>
                <WrenchIcon className="size-3.5" />
                <span className="truncate font-semibold">{tool.id}</span>
            </>
        );
    }, [tool]);

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                {children || (
                    <Button className="data-[state=open]:bg-input! border" size="lg" variant="outline">
                        {selectedToolLabel}
                        <ChevronDownIcon className="ml-auto size-3.5" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent align={align} className="p-0" side={side}>
                <Command>
                    <CommandInput placeholder={t`Search...`} />
                    <CommandList>
                        <CommandEmpty>{t`No results.`}</CommandEmpty>
                        {mcpToolsByServerId.map((mcpTools) => (
                            <CommandGroup heading={mcpTools.serverName} key={mcpTools.serverId}>
                                {mcpTools.tools.map((tool) => (
                                    <CommandItem
                                        className="cursor-pointer"
                                        key={tool.id}
                                        onSelect={() => {
                                            onChange(tool);
                                            setOpen(false);
                                        }}
                                    >
                                        <WrenchIcon className="size-3.5" />
                                        <span className="truncate font-semibold">{tool.id}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                        <CommandGroup heading="App Default Tools">
                            {defaultTools.map((tool) => (
                                <CommandItem
                                    className="cursor-pointer"
                                    key={tool.id}
                                    onSelect={() => {
                                        onChange(tool);
                                        setOpen(false);
                                    }}
                                >
                                    <WrenchIcon className="size-3.5" />
                                    <span className="truncate font-semibold">{tool.id}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
