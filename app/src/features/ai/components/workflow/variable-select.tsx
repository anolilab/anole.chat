"use client";

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
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import { useReactFlow } from "@xyflow/react";
import type { JSONSchema7 } from "json-schema";
import { ChevronRightIcon, SearchIcon, VariableIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { findAccessibleNodeIds } from "../../lib/workflow/shared.workflow";
import type { UINode } from "../../lib/workflow/workflow.interface";

interface VariableSelectProperties {
    allowedTypes?: string[];
    children: React.ReactNode;
    currentNodeId: string;
    onChange: (item: { nodeId: string; nodeName: string; path: string[]; type: string }) => void;
}

export const VariableSelect = ({ allowedTypes, children, currentNodeId, onChange }: VariableSelectProperties) => {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu onOpenChange={setOpen} open={open}>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
                <VariableSelectContent
                    allowedTypes={allowedTypes}
                    currentNodeId={currentNodeId}
                    onChange={(item) => {
                        onChange(item);
                        setOpen(false);
                    }}
                    onClose={() => {
                        setOpen(false);
                    }}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const VariableSelectContent = ({
    allowedTypes,
    currentNodeId,
    onChange,
    onClose,
}: Omit<VariableSelectProperties, "children"> & {
    onClose?: () => void;
}) => {
    const [query, setQuery] = useState("");
    const { getEdges, getNodes } = useReactFlow<UINode>();
    const nodes = getNodes();
    const edges = getEdges();
    const { t } = useLingui();
    const firstNodeReference = useRef<HTMLDivElement>(null);

    const accessibleSchemas = useMemo(() => {
        const accessibleNodes = findAccessibleNodeIds({
            edges,
            nodeId: currentNodeId,
            nodes: nodes.map((node) => node.data),
        });

        return nodes
            .filter((node) => accessibleNodes.includes(node.id))
            .map((node) => {
                return {
                    id: node.data.id,
                    kind: node.data.kind,
                    name: node.data.name,
                    schema: node.data.outputSchema?.properties,
                };
            })
            .filter((v) => v.schema && Object.keys(v.schema).length);
    }, [nodes, currentNodeId, edges]);

    const filteredNodes = useMemo<ReactNode[]>(() => {
        const first = [firstNodeReference];

        return accessibleSchemas
            .map(({ id, name, schema }) => {
                const items = [...Object.entries(schema ?? {})]
                    .filter(([key]) => key.includes(query))
                    .map(([key, schema]) => {
                        const reference = first.shift()!;

                        return (
                            <SchemaItem
                                allowedTypes={allowedTypes}
                                key={key}
                                name={key}
                                onChange={(path) => {
                                    onChange({
                                        nodeId: id,
                                        nodeName: name,
                                        path,
                                        type: schema.type as string,
                                    });
                                }}
                                path={[]}
                                ref={reference}
                                schema={schema}
                            />
                        );
                    });

                if (items.length === 0)
                    return null;

                return (
                    <DropdownMenuGroup key={id}>
                        <DropdownMenuLabel className="text-muted-foreground flex items-center gap-1 text-xs">{name}</DropdownMenuLabel>
                        {items}
                    </DropdownMenuGroup>
                );
            })
            .filter(Boolean);
    }, [accessibleSchemas, query]);

    return (
        <div className="flex w-full flex-col">
            <div
                className="flex items-center gap-1 px-2"
                onKeyDown={(e) => {
                    e.stopPropagation();
                }}
            >
                <SearchIcon className="text-muted-foreground size-4" />
                <Input
                    autoFocus
                    className="w-full border-none bg-transparent"
                    onChange={(e) => {
                        e.stopPropagation();
                        setQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            onClose?.();
                        }

                        if (e.key === "Backspace" && query.length === 0) {
                            onClose?.();
                        }

                        if (e.key === "ArrowDown") {
                            firstNodeReference.current?.focus();
                        }
                    }}
                    placeholder={t`Search...`}
                    value={query}
                />
            </div>
            <DropdownMenuSeparator />
            <div className="flex max-h-[50vh] flex-col overflow-y-auto">
                {nodes.length === 0 || filteredNodes.length === 0
                    ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground py-4 text-xs">{t`No variables found`}</p>
                        </div>
                    )
                    : filteredNodes}
            </div>
        </div>
    );
};

const SchemaItem = ({
    allowedTypes,
    name,
    onChange,
    path,
    ref,
    schema,
}: {
    allowedTypes?: string[];
    name: string;
    onChange: (path: string[]) => void;
    path: string[];
    ref?: React.RefObject<HTMLDivElement | null>;
    schema: JSONSchema7;
}) => {
    const disabled = useMemo(() => allowedTypes?.length && !allowedTypes.includes(schema.type as string), [allowedTypes, schema.type]);

    if (schema.type === "object" && schema.properties && Object.keys(schema.properties).length > 0) {
        return (
            <DropdownMenuSub>
                <DropdownMenuSubTrigger
                    className="text-muted-foreground flex items-center gap-1 text-xs"
                    icon={(
                        <>
                            <span className="text-muted-foreground ml-auto text-xs">{schema.type}</span>
                            <ChevronRightIcon className="text-muted-foreground size-4" />
                        </>
                    )}
                    onClick={() => {
                        if (disabled)
                            return;

                        onChange([...path, name]);
                    }}
                    ref={ref}
                >
                    <VariableIcon className="size-4 text-blue-500" />
                    <span className={cn("text-foreground ml-1 truncate", disabled && "text-muted-foreground")}>{name}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="overflow-y-auto md:max-h-96">
                        {Object.entries(schema.properties ?? {}).map(([key, schema]) => (
                            <SchemaItem
                                allowedTypes={allowedTypes}
                                key={key}
                                name={key}
                                onChange={onChange}
                                path={[...path, name]}
                                schema={schema as JSONSchema7}
                            />
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
        );
    }

    return (
        <DropdownMenuItem
            disabled={!!disabled}
            onClick={() => {
                if (disabled)
                    return;

                onChange([...path, name]);
            }}
            ref={ref}
        >
            <VariableIcon className="size-4 text-blue-500" />
            <span className="truncate">{name}</span>
            <span className="text-muted-foreground ml-auto text-xs">{schema.type}</span>
            <div className="w-4" />
        </DropdownMenuItem>
    );
};
