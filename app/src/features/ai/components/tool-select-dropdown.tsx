import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Checkbox } from "@anole/ui/components/checkbox";
import { CountAnimation } from "@anole/ui/components/count-animation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@anole/ui/components/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@anole/ui/components/dropdown-menu";
import { Input } from "@anole/ui/components/input";
import { MCPIcon } from "@anole/ui/components/mcp-icon";
import { Separator } from "@anole/ui/components/separator";
import { Switch } from "@anole/ui/components/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { objectFlow } from "lib/utils";
import {
    AtSign,
    ChartColumn,
    ChevronRight,
    CodeIcon,
    GlobeIcon,
    HardDriveUploadIcon,
    InfoIcon,
    Loader,
    MousePointer2,
    Package,
    Plus,
    Waypoints,
    Wrench,
    WrenchIcon,
    X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { useWorkflowToolList } from "@/hooks/queries/use-workflow-tool-list";
import type { ChatMention } from "@/types/chat";
import type { AllowedMCPServer, MCPServerInfo } from "@/types/mcp";
import type { WorkflowSummary } from "@/types/workflow";

import { AppDefaultToolkit } from "../../lib/tools";
import { appStore } from "../store";
import { WorkflowGreeting } from "./workflow/workflow-greeting";

interface ToolSelectDropdownProperties {
    align?: "start" | "end" | "center";
    className?: string;
    disabled?: boolean;
    mentions?: ChatMention[];
    onSelectWorkflow?: (workflow: WorkflowSummary) => void;
    side?: "left" | "right" | "top" | "bottom";
}

const calculateToolCount = (allowedMcpServers: Record<string, AllowedMCPServer>, mcpList: (MCPServerInfo & { id: string })[]) =>
    mcpList.reduce((accumulator, server) => {
        const count = allowedMcpServers[server.id]?.tools?.length ?? server.toolInfo.length;

        return accumulator + count;
    }, 0);

export const ToolSelectDropdown = ({ align, className, mentions, onSelectWorkflow, side }: ToolSelectDropdownProperties) => {
    const [open, setOpen] = useState(false);
    const [toolChoice, allowedAppDefaultToolkit, allowedMcpServers, mcpList] = appStore(
        useShallow((state) => [state.toolChoice, state.allowedAppDefaultToolkit, state.allowedMcpServers, state.mcpList]),
    );
    const { t } = useLingui();
    const { isLoading } = useMcpList({
        refreshInterval: 1000 * 30,
    });

    useWorkflowToolList({
        refreshInterval: 1000 * 60 * 5,
    });

    const bindingTools = useMemo<string[]>(() => {
        if (mentions?.length) {
            return mentions.map((m) => m.name);
        }

        if (toolChoice == "none")
            return [];

        const translate = t.raw("defaultToolKit");
        const defaultTools = Object.values(AppDefaultToolkit)
            .filter((t) => allowedAppDefaultToolkit?.includes(t))
            .map((t) => translate[t]);
        const mcpIds = new Set(mcpList.map((v) => v.id));
        const mcpTools = Object.values(objectFlow(allowedMcpServers ?? {}).filter((_, id) => mcpIds.has(id))).flatMap((v) => v.tools);

        return [...defaultTools, ...mcpTools];
    }, [mentions, allowedAppDefaultToolkit, allowedMcpServers, toolChoice, mcpList]);

    const triggerButton = useMemo(
        () => (
            <Button
                className={cn(
                    "bg-input/60 data-[state=open]:bg-input! hover:bg-input! gap-0.5 rounded-full border",
                    bindingTools.length === 0 && !isLoading && "text-muted-foreground border-transparent bg-transparent",
                    isLoading && "bg-input/60",
                    open && "bg-input!",
                    className,
                )}
                size="sm"
                variant="ghost"
            >
                <span className={mentions?.length ?? 0 > 0 ? "text-muted-foreground" : ""}>{mentions?.length ?? 0 > 0 ? "Mention" : "Tools"}</span>
                {(bindingTools.length > 0 || isLoading) && (
                    <>
                        <div className="mx-1 hidden h-4 sm:block">
                            <Separator orientation="vertical" />
                        </div>

                        <div className="flex min-w-5 justify-center">
                            {isLoading
                                ? (
                                    <Loader className="size-3.5 animate-spin" />
                                )
                                : (mentions?.length ?? 0) > 0
                                    ? (
                                        <AtSign className="size-3.5" />
                                    )
                                    : (
                                        <CountAnimation className="text-xs" number={bindingTools.length} />
                                    )}
                        </div>
                    </>
                )}
            </Button>
        ),
        [mentions?.length, bindingTools.length, isLoading, open],
    );

    return (
        <DropdownMenu onOpenChange={setOpen} open={open}>
            <DropdownMenuTrigger asChild>
                <div>
                    <Tooltip>
                        <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
                        <TooltipContent align={align} className="p-4 text-xs" side={side}>
                            <div className="flex items-center gap-2">
                                <WrenchIcon className="size-3.5" />
                                <span className="text-sm">{t`toolsSetup`}</span>
                            </div>

                            <p className="text-muted-foreground mt-4 whitespace-pre-wrap">{t`toolsSetupDescription`}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="md:w-72" side={side}>
                <WorkflowToolSelector onSelectWorkflow={onSelectWorkflow} />
                <div className="py-1">
                    <DropdownMenuSeparator />
                </div>
                <div className="py-2">
                    <ToolPresets />
                    <div className="py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <AppDefaultToolKitSelector />
                    <div className="py-1">
                        <DropdownMenuSeparator />
                    </div>
                    <McpServerSelector />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ToolPresets = () => {
    const [appStoreMutate, presets, allowedMcpServers, allowedAppDefaultToolkit, mcpList] = appStore(
        useShallow((state) => [state.mutate, state.toolPresets, state.allowedMcpServers, state.allowedAppDefaultToolkit, state.mcpList]),
    );
    const [open, setOpen] = useState(false);
    const [presetName, setPresetName] = useState("");
    const { t } = useLingui();

    const presetWithToolCount = useMemo(
        () =>
            presets.map((preset) => {
                return {
                    ...preset,
                    toolCount: calculateToolCount(preset.allowedMcpServers ?? {}, mcpList),
                };
            }),
        [presets, mcpList],
    );

    const addPreset = useCallback(
        (name: string) => {
            if (name.trim() === "") {
                toast.error(t`Chat.Tool.presetNameCannotBeEmpty`);

                return;
            }

            if (presets.find((p) => p.name === name)) {
                toast.error(t`Chat.Tool.presetNameAlreadyExists`);

                return;
            }

            appStoreMutate((previous) => {
                return {
                    toolPresets: [...previous.toolPresets, { allowedAppDefaultToolkit, allowedMcpServers, name }],
                };
            });
            setPresetName("");
            setOpen(false);
            toast.success(t`Chat.Tool.presetSaved`);
        },
        [allowedMcpServers, allowedAppDefaultToolkit, presets],
    );

    const deletePreset = useCallback((index: number) => {
        appStoreMutate((previous) => {
            return {
                toolPresets: previous.toolPresets.filter((_, index_) => index_ !== index),
            };
        });
    }, []);

    const applyPreset = useCallback((preset: (typeof presets)[number]) => {
        appStoreMutate({
            allowedAppDefaultToolkit: preset.allowedAppDefaultToolkit,
            allowedMcpServers: preset.allowedMcpServers,
        });
    }, []);

    return (
        <DropdownMenuGroup className="cursor-pointer">
            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <Package className="size-3.5" />
                    {t`Chat.Tool.preset`}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="overflow-y-auto md:max-h-96 md:w-80">
                        <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2">
                            {t`Chat.Tool.toolPresets`}
                            <div className="flex-1" />
                            <Dialog onOpenChange={setOpen} open={open}>
                                <DialogTrigger asChild>
                                    <Button className="border" size="sm" variant="secondary">
                                        {t`Chat.Tool.saveAsPreset`}
                                        <Plus className="size-3.5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t`Chat.Tool.saveAsPreset`}</DialogTitle>
                                    </DialogHeader>
                                    <DialogDescription>{t`Chat.Tool.saveAsPresetDescription`}</DialogDescription>
                                    <Input
                                        onChange={(e) => setPresetName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                                addPreset(presetName);
                                            }
                                        }}
                                        placeholder="Preset Name"
                                        value={presetName}
                                    />
                                    <Button
                                        className="border"
                                        onClick={() => {
                                            addPreset(presetName);
                                        }}
                                        size="sm"
                                        variant="secondary"
                                    >
                                        {t`Common.save`}
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {presets.length === 0
                            ? (
                                <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 py-6 text-sm">
                                    <p>{t`Chat.Tool.noPresetsAvailableYet`}</p>
                                    <p className="px-4 text-xs">{t`Chat.Tool.clickSaveAsPresetToGetStarted`}</p>
                                </div>
                            )
                            : presetWithToolCount.map((preset, index) => (
                                <DropdownMenuItem
                                    className="flex cursor-pointer items-center gap-2"
                                    key={preset.name}
                                    onClick={() => {
                                        applyPreset(preset);
                                    }}
                                >
                                    <Badge className="border-input rounded-full" variant="secondary">
                                        <Wrench className="size-3.5" />
                                        <span className="min-w-6 text-center">{preset.toolCount}</span>
                                    </Badge>
                                    <span className="truncate font-semibold">{preset.name}</span>

                                    <div className="flex-1" />
                                    <div
                                        className="hover:bg-input cursor-pointer rounded-full p-1"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            deletePreset(index);
                                        }}
                                    >
                                        <X className="size-3.5" />
                                    </div>
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
        </DropdownMenuGroup>
    );
};

const WorkflowToolSelector = ({ onSelectWorkflow }: { onSelectWorkflow?: (workflow: WorkflowSummary) => void }) => {
    const { t } = useLingui();
    const workflowToolList = appStore((state) => state.workflowToolList);

    return (
        <DropdownMenuGroup>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <Waypoints className="size-3.5" />
                    {t`Workflow.title`}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="relative w-80">
                        {workflowToolList.length === 0
                            ? (
                                <div className="text-muted-foreground flex flex-col items-center gap-4 px-6 py-6 text-sm">
                                    <InfoIcon className="size-4" />
                                    <p className="whitespace-pre-wrap">{t`Workflow.noTools`}</p>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="group relative" variant="ghost">
                                                What is Workflow?
                                                <div className="absolute -top-1.5 left-0 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
                                                    <MousePointer2 className="wiggle size-3 rotate-180 fill-blue-500 text-blue-500" />
                                                </div>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="md:max-w-3xl!">
                                            <DialogTitle className="sr-only">workflow greeting</DialogTitle>
                                            <WorkflowGreeting />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )
                            : workflowToolList.map((workflow) => (
                                <DropdownMenuItem className="cursor-pointer" key={workflow.id} onClick={() => onSelectWorkflow?.(workflow)}>
                                    {workflow.icon && workflow.icon.type === "emoji"
                                        ? (
                                            <div
                                                className="ring-background flex items-center justify-center rounded border p-1 ring"
                                                style={{
                                                    backgroundColor: workflow.icon?.style?.backgroundColor,
                                                }}
                                            >
                                                <Avatar className="size-3">
                                                    <AvatarImage src={workflow.icon?.value} />
                                                    <AvatarFallback>{workflow.name.slice(0, 1)}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        )
                                        : null}
                                    <span className="min-w-0 truncate">{workflow.name}</span>
                                    <div className="ml-auto flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">by</span>
                                        <span className="">{workflow.userName}</span>
                                        <Avatar className="size-3 rounded-full ring">
                                            <AvatarImage src={workflow.userAvatar} />
                                            <AvatarFallback>{workflow.userName.slice(0, 1)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            {/* ))
  )} */}
        </DropdownMenuGroup>
    );
};

const McpServerSelector = () => {
    const [appStoreMutate, allowedMcpServers, mcpServerList] = appStore(useShallow((state) => [state.mutate, state.allowedMcpServers, state.mcpList]));

    const selectedMcpServerList = useMemo(() => {
        if (mcpServerList.length === 0)
            return [];

        return [...mcpServerList]
            .sort((a, b) => (a.status === "connected" ? -1 : 1) - (b.status === "connected" ? -1 : 1))
            .map((server) => {
                const allowedTools: string[] = allowedMcpServers?.[server.id]?.tools ?? server.toolInfo.map((tool) => tool.name);

                return {
                    checked: allowedTools.length > 0,
                    error: server.error,
                    id: server.id,
                    serverName: server.name,
                    status: server.status,
                    tools: server.toolInfo.map((tool) => {
                        return {
                            checked: allowedTools.includes(tool.name),
                            description: tool.description,
                            name: tool.name,
                        };
                    }),
                };
            });
    }, [mcpServerList, allowedMcpServers]);

    const setMcpServerTool = useCallback((serverId: string, toolNames: string[]) => {
        appStoreMutate((previous) => {
            return {
                allowedMcpServers: {
                    ...previous.allowedMcpServers,
                    [serverId]: {
                        ...previous.allowedMcpServers?.[serverId],
                        tools: toolNames,
                    },
                },
            };
        });
    }, []);

    return (
        <DropdownMenuGroup>
            {selectedMcpServerList.length === 0
                ? (
                    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center py-6 text-sm">
                        <div>No MCP servers detected.</div>
                        <Link to="/mcp">
                            <Button className="text-primary mt-2 flex items-center gap-1" variant="ghost">
                                Add a server
                                {" "}
                                <ChevronRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                )
                : selectedMcpServerList.map((server) => (
                    <DropdownMenuSub key={server.id}>
                        <DropdownMenuSubTrigger
                            className="flex cursor-pointer items-center gap-2 font-semibold"
                            icon={(
                                <div className="ml-auto flex items-center gap-2">
                                    {server.tools.some((t) => t.checked)
                                        ? (
                                            <span className="text-muted-foreground flex h-5 w-5 items-center justify-center text-[8px] font-semibold">
                                                {server.tools.filter((t) => t.checked).length}
                                            </span>
                                        )
                                        : null}

                                    <ChevronRight className="text-muted-foreground size-4" />
                                </div>
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                setMcpServerTool(server.id, server.checked ? [] : server.tools.map((t) => t.name));
                            }}
                        >
                            <div className="bg-input/40 flex items-center justify-center rounded border p-1">
                                <MCPIcon className="fill-foreground size-2.5" />
                            </div>

                            <span className={cn("truncate", !server.checked && "opacity-30")}>{server.serverName}</span>
                            {server.error ? <span className="text-destructive ml-1 rounded p-1 text-xs">error</span> : null}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="relative w-80">
                                <McpServerToolSelector
                                    checked={server.checked}
                                    onClickAllChecked={(checked) => {
                                        setMcpServerTool(server.id, checked ? server.tools.map((t) => t.name) : []);
                                    }}
                                    onToolClick={(toolName, checked) => {
                                        const currentTools = server.tools.filter((v) => v.checked).map((v) => v.name);

                                        setMcpServerTool(server.id, checked ? currentTools.concat(toolName) : currentTools.filter((v) => v !== toolName));
                                    }}
                                    tools={server.tools}
                                />
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                ))}
        </DropdownMenuGroup>
    );
};

interface McpServerToolSelectorProperties {
    checked: boolean;
    onClickAllChecked: (checked: boolean) => void;
    onToolClick: (toolName: string, checked: boolean) => void;
    tools: {
        checked: boolean;
        description: string;
        name: string;
    }[];
}

const McpServerToolSelector = ({ checked, onClickAllChecked, onToolClick, tools }: McpServerToolSelectorProperties) => {
    const { t } = useLingui();
    const [search, setSearch] = useState("");
    const filteredTools = useMemo(() => tools.filter((tool) => tool.name.toLowerCase().includes(search.toLowerCase())), [tools, search]);

    return (
        <div>
            <DropdownMenuLabel
                className="text-muted-foreground flex items-center gap-2"
                onClick={(e) => {
                    e.preventDefault();
                    onClickAllChecked(!checked);
                }}
            >
                <input
                    autoFocus
                    className="placeholder:text-muted-foreground flex w-full text-xs outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                    }}
                    placeholder={t`search`}
                    value={search}
                />
                <div className="flex-1" />
                <Switch checked={checked} />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
                {filteredTools.length === 0
                    ? (
                        <div className="text-muted-foreground flex h-full w-full items-center justify-center py-6 text-sm">{t`noResults`}</div>
                    )
                    : filteredTools.map((tool) => (
                        <DropdownMenuItem
                            className="mb-1 flex cursor-pointer items-center gap-2"
                            key={tool.name}
                            onClick={(e) => {
                                e.preventDefault();
                                onToolClick(tool.name, !tool.checked);
                            }}
                        >
                            <div className="mx-1 min-w-0 flex-1">
                                <p className="mb-1 truncate text-xs font-medium">{tool.name}</p>
                                <p className="text-muted-foreground truncate text-xs">{tool.description}</p>
                            </div>
                            <Checkbox checked={tool.checked} className="ml-auto" />
                        </DropdownMenuItem>
                    ))}
            </div>
        </div>
    );
};

const AppDefaultToolKitSelector = () => {
    const [appStoreMutate, allowedAppDefaultToolkit] = appStore(useShallow((state) => [state.mutate, state.allowedAppDefaultToolkit]));
    const { t } = useLingui();
    const toggleAppDefaultToolkit = useCallback((toolkit: AppDefaultToolkit) => {
        appStoreMutate((previous) => {
            const newAllowedAppDefaultToolkit = [...previous.allowedAppDefaultToolkit ?? []];

            if (newAllowedAppDefaultToolkit.includes(toolkit)) {
                newAllowedAppDefaultToolkit.splice(newAllowedAppDefaultToolkit.indexOf(toolkit), 1);
            } else {
                newAllowedAppDefaultToolkit.push(toolkit);
            }

            return { allowedAppDefaultToolkit: newAllowedAppDefaultToolkit };
        });
    }, []);

    const defaultToolInfo = useMemo(() => {
        const raw = t.raw("Chat.Tool.defaultToolKit");

        return Object.values(AppDefaultToolkit).map((toolkit) => {
            const label = raw[toolkit] || toolkit;
            const id = toolkit;
            let icon = Wrench;

            switch (toolkit) {
                case AppDefaultToolkit.Code: {
                    icon = CodeIcon;
                    break;
                }
                case AppDefaultToolkit.Http: {
                    icon = HardDriveUploadIcon;
                    break;
                }
                case AppDefaultToolkit.Visualization: {
                    icon = ChartColumn;
                    break;
                }
                case AppDefaultToolkit.WebSearch: {
                    icon = GlobeIcon;
                    break;
                }
            }

            return {
                icon,
                id,
                label,
            };
        });
    }, []);

    return (
        <DropdownMenuGroup>
            {defaultToolInfo.map((tool) => (
                <DropdownMenuItem
                    className={cn(
                        "text-muted-foreground cursor-pointer text-xs font-semibold",
                        allowedAppDefaultToolkit?.includes(tool.id) && "text-foreground",
                    )}
                    key={tool.id}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleAppDefaultToolkit(tool.id);
                    }}
                >
                    <tool.icon className={cn("size-3.5", allowedAppDefaultToolkit?.includes(tool.id) && "text-foreground")} />
                    {tool.label}
                    <Switch checked={allowedAppDefaultToolkit?.includes(tool.id)} className="ml-auto" />
                </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
    );
};
