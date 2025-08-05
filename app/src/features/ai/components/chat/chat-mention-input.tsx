"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@anole/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import MCPIcon from "@anole/ui/icons/mcp";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import type { Editor } from "@tiptap/react";
import { HammerIcon } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/shallow";

import type { ChatMention } from "@/types/chat";

import { DefaultToolName } from "../../lib/tools";
import { appStore } from "../../store";
import { DefaultToolIcon } from "../default-tool-icon";
import MentionInput from "../mention-input";

interface ChatMentionInputProperties {
    input: string;
    onChange: (text: string) => void;
    onChangeMention: (mentions: ChatMention[]) => void;
    onEnter?: () => void;
    placeholder?: string;
    ref?: RefObject<Editor | null>;
}

const ChatMentionInputSuggestion = ({
    left,
    onClose,
    onSelectMention,
    top,
}: {
    left: number;
    onClose: () => void;
    onSelectMention: (item: { id: string; label: string }) => void;
    top: number;
}) => {
    const { t } = useLingui();
    const [mcpList, workflowList] = appStore(useShallow((state) => [state.mcpList, state.workflowToolList]));

    const mcpMentions = useMemo(
        () =>
            mcpList
                ?.filter((mcp) => mcp.toolInfo?.length)
                .map((mcp) => (
                    <CommandGroup heading={mcp.name} key={mcp.id}>
                        <CommandItem
                            className="text-foreground cursor-pointer"
                            key={`${mcp.id}-mcp`}
                            onSelect={() =>
                                onSelectMention({
                                    id: JSON.stringify({
                                        description: `${mcp.name} is an MCP server that includes ${mcp.toolInfo?.length ?? 0} tool(s).`,
                                        name: mcp.name,
                                        serverId: mcp.id,
                                        toolCount: mcp.toolInfo?.length ?? 0,
                                        type: "mcpServer",
                                    }),
                                    label: `mcp("${mcp.name}")`,
                                })}
                        >
                            <MCPIcon className="text-foreground size-3.5" />
                            <span className="min-w-0 truncate">{mcp.name}</span>
                            <span className="text-muted-foreground ml-auto text-xs">
                                {mcp.toolInfo?.length}
                                {" "}
                                tools
                            </span>
                        </CommandItem>
                        {mcp.toolInfo?.map((tool) => (
                            <CommandItem
                                className="text-foreground cursor-pointer"
                                key={`${mcp.id}-${tool.name}`}
                                onSelect={() =>
                                    onSelectMention({
                                        id: JSON.stringify({
                                            description: tool.description,
                                            name: tool.name,
                                            serverId: mcp.id,
                                            serverName: mcp.name,
                                            type: "mcpTool",
                                        }),
                                        label: `tool("${tool.name}") `,
                                    })}
                            >
                                <HammerIcon className="size-3.5" />
                                <span className="min-w-0 truncate">{tool.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )),
        [mcpList],
    );

    const workflowMentions = useMemo(() => {
        if (workflowList.length === 0)
            return;

        return (
            <CommandGroup heading="Workflows" key="workflows">
                {workflowList.map((workflow) => (
                    <CommandItem
                        className="text-foreground cursor-pointer"
                        key={workflow.id}
                        onSelect={() =>
                            onSelectMention({
                                id: JSON.stringify({
                                    description: workflow.description,
                                    icon: workflow.icon,
                                    name: workflow.name,
                                    type: "workflow",
                                    workflowId: workflow.id,
                                }),
                                label: `tool("${workflow.name}")`,
                            })}
                    >
                        <Avatar className="ring-input size-3.5 rounded-full ring-[1px]" style={workflow.icon?.style}>
                            <AvatarImage src={workflow.icon?.value} />
                            <AvatarFallback>{workflow.name.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 truncate">{workflow.name}</span>
                    </CommandItem>
                ))}
            </CommandGroup>
        );
    }, [workflowList]);

    const defaultToolMentions = useMemo(() => {
        const items = Object.values(DefaultToolName).map((toolName) => {
            let label = toolName as string;
            const icon = <DefaultToolIcon name={toolName} />;
            let description = "";

            switch (toolName) {
                case DefaultToolName.CreateBarChart: {
                    label = "bar-chart";
                    description = "Create a bar chart";
                    break;
                }
                case DefaultToolName.CreateLineChart: {
                    label = "line-chart";
                    description = "Create a line chart";
                    break;
                }
                case DefaultToolName.CreatePieChart: {
                    label = "pie-chart";
                    description = "Create a pie chart";
                    break;
                }
                case DefaultToolName.Http: {
                    label = "HTTP";
                    description = "Send an http request";
                    break;
                }
                case DefaultToolName.JavascriptExecution: {
                    label = "js-execution";
                    description = "Execute simple javascript code";
                    break;
                }
                case DefaultToolName.PythonExecution: {
                    label = "python-execution";
                    description = "Execute simple python code";
                    break;
                }
                case DefaultToolName.WebContent: {
                    label = "web-content";
                    description = "Get the content of a web page";
                    break;
                }
                case DefaultToolName.WebSearch: {
                    label = "web-search";
                    description = "Search the web";
                    break;
                }
            }

            return {
                description,
                icon,
                id: toolName,
                label,
            };
        });

        return (
            <>
                <CommandGroup heading="App Tools" key="default-tool">
                    {items.map((item) => (
                        <CommandItem
                            key={item.id}
                            onSelect={() =>
                                onSelectMention({
                                    id: JSON.stringify({
                                        description: item.description,
                                        label: item.label,
                                        name: item.id,
                                        type: "defaultTool",
                                    }),
                                    label: `tool('${item.label}')`,
                                })}
                        >
                            {item.icon}
                            <span className="min-w-0 truncate">{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </>
        );
    }, []);

    return createPortal(
        <Popover onOpenChange={(f) => !f && onClose()} open>
            <PopoverTrigger asChild>
                <span
                    className="fixed z-50"
                    style={{
                        left,
                        top,
                    }}
                />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-xs p-0" side="top">
                <Command>
                    <CommandInput
                        onKeyDown={(e) => {
                            if (e.key === "Backspace" && !e.currentTarget.value) {
                                onClose();
                            }
                        }}
                        placeholder={t`Search...`}
                    />
                    <CommandList className="p-2">
                        <CommandEmpty>{t`No results.`}</CommandEmpty>
                        {workflowMentions}
                        {defaultToolMentions}
                        {mcpMentions}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>,
        document.body,
    );
}

const ChatMentionInputMentionItem = ({ className, id }: { className?: string; id: string }) => {
    const item = useMemo(() => JSON.parse(id) as ChatMention, [id]);
    const label = useMemo(
        () => <div className={cn("flex items-center px-1 text-sm font-semibold transition-colors", "text-blue-500", className)}>{item.label || item.name}</div>,
        [item],
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>{label}</TooltipTrigger>
            <TooltipContent className="max-w-xs p-4 whitespace-pre-wrap">{item.description || "mention"}</TooltipContent>
        </Tooltip>
    );
};

const ChatMentionInput = ({ input, onChange, onChangeMention, onEnter, placeholder, ref }: ChatMentionInputProperties) => {
    const handleChange = useCallback(
        ({ mentions, text }: { mentions: { id: string; label: string }[]; text: string }) => {
            onChange(text);
            onChangeMention(mentions.map((mention) => JSON.parse(mention.id) as ChatMention));
        },
        [onChange, onChangeMention],
    );

    return (
        <MentionInput
            content={input}
            editorRef={ref}
            MentionItem={ChatMentionInputMentionItem}
            onChange={handleChange}
            onEnter={onEnter}
            placeholder={placeholder}
            Suggestion={ChatMentionInputSuggestion}
            suggestionChar="@"
        />
    );
}

export default ChatMentionInput;