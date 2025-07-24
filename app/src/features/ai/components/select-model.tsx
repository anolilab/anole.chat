"use client";

import { Button } from "@anole/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@anole/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@anole/ui/components/popover";
import ClaudeIcon from "@anole/ui/icons/claude";
import GeminiIcon from "@anole/ui/icons/gemini";
import GrokIcon from "@anole/ui/icons/grok";
import OpenAIIcon from "@anole/ui/icons/openai";
import { CheckIcon, ChevronDown } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Fragment, memo, useEffect, useState } from "react";

import type { ChatModel } from "@/types/chat";

import { appStore } from "../store";

interface SelectModelProperties {
    align?: "start" | "end";
    defaultModel?: ChatModel;
    onSelect: (model: ChatModel) => void;
}

export const SelectModel = (properties: PropsWithChildren<SelectModelProperties>) => {
    const [open, setOpen] = useState(false);
    const providers = [];
    const [model, setModel] = useState(properties.defaultModel);

    useEffect(() => {
        setModel(properties.defaultModel ?? appStore.getState().chatModel);
    }, [properties.defaultModel]);

    return (
        <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                {properties.children || (
                    <Button className="data-[state=open]:bg-input! hover:bg-input!" size="sm" variant="secondary">
                        <p className="mr-auto flex items-center gap-1">
                            {model?.model ? <span className="text-muted-foreground">{model.model}</span> : <span className="text-muted-foreground">model</span>}
                        </p>
                        <ChevronDown className="size-3" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent align={properties.align || "end"} className="w-[280px] p-0">
                <Command className="relative h-80 rounded-lg shadow-md" onClick={(e) => e.stopPropagation()} value={JSON.stringify(model)}>
                    <CommandInput placeholder="search model..." />
                    <CommandList className="p-2">
                        <CommandEmpty>No results found.</CommandEmpty>
                        {providers?.map((provider, index) => (
                            <Fragment key={provider.provider}>
                                <CommandGroup
                                    className="group pb-4"
                                    heading={<ProviderHeader provider={provider.provider} />}
                                    onWheel={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    {provider.models.map((item) => (
                                        <CommandItem
                                            className="cursor-pointer"
                                            key={item.name}
                                            onSelect={() => {
                                                setModel({
                                                    model: item.name,
                                                    provider: provider.provider,
                                                });
                                                properties.onSelect({
                                                    model: item.name,
                                                    provider: provider.provider,
                                                });
                                                setOpen(false);
                                            }}
                                            value={item.name}
                                        >
                                            {model?.provider === provider.provider && model?.model === item.name
                                                ? (
                                                    <CheckIcon className="size-3" />
                                                )
                                                : (
                                                    <div className="ml-3" />
                                                )}
                                            <span className="pr-2">{item.name}</span>
                                            {item.isToolCallUnsupported && (
                                                <div className="text-muted-foreground ml-auto flex items-center gap-1 text-xs">No tools</div>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {index < providers?.length - 1 && <CommandSeparator />}
                            </Fragment>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const ProviderHeader = memo(({ provider }: { provider: string }) => (
    <div className="text-muted-foreground group-hover:text-foreground flex items-center gap-1.5 text-sm transition-colors duration-300">
        {provider === "openai"
            ? (
                <OpenAIIcon className="text-foreground size-3" />
            )
            : provider === "xai"
                ? (
                    <GrokIcon className="size-3" />
                )
                : provider === "anthropic"
                    ? (
                        <ClaudeIcon className="size-3" />
                    )
                    : provider === "google"
                        ? (
                            <GeminiIcon className="size-3" />
                        )
                        : null}
        {provider}
    </div>
));
