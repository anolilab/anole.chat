"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@anole/ui/components/avatar";
import { GlobalIcon } from "@anole/ui/components/global-icon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@anole/ui/components/hover-card";
import JsonView from "@anole/ui/components/json-view";
import { Separator } from "@anole/ui/components/separator";
import { TextShimmer } from "@anole/ui/components/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import cn from "@anole/ui/utils/cn";
import { useLingui } from "@lingui/react/macro";
import equal from "lib/equal";
import { notify } from "lib/notify";
import { toAny } from "lib/utils";
import { AlertTriangleIcon } from "lucide-react";
import { memo, useMemo, useState } from "react";

import type { ToolInvocationUIPart } from "@/types/chat";

import type { TavilyResponse } from "../../lib/tools/web/web-search";

interface WebSearchToolInvocationProperties {
    part: ToolInvocationUIPart["toolInvocation"];
}

const PureWebSearchToolInvocation = ({ part }: WebSearchToolInvocationProperties) => {
    const { t } = useLingui();

    const result = useMemo(() => {
        if (part.state != "result")
            return null;

        return part.result as TavilyResponse & { error?: string; isError: boolean };
    }, [part.state]);
    const [errorSource, setErrorSource] = useState<string[]>([]);

    const options = useMemo(
        () => (
            <HoverCard closeDelay={0} openDelay={200}>
                <HoverCardTrigger asChild>
                    <span className="hover:text-primary text-muted-foreground text-xs transition-colors">{t`Chat.Tool.searchOptions`}</span>
                </HoverCardTrigger>
                <HoverCardContent className="flex w-full! max-w-xs flex-col overflow-auto md:max-w-md!">
                    <p className="text-muted-foreground mb-2 px-2 text-xs">{t`Chat.Tool.searchOptionsDescription`}</p>
                    <div className="p-2">
                        <JsonView data={part.args} />
                    </div>
                </HoverCardContent>
            </HoverCard>
        ),
        [part.args],
    );

    const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.currentTarget;

        if (errorSource.includes(target.src))
            return;

        setErrorSource([...errorSource, target.src]);
    };

    const images = useMemo(() => result?.images?.filter((image) => !errorSource.includes(image.url)) ?? [], [result?.images, errorSource]);

    if (part.state != "result") {
        return (
            <div className="flex items-center gap-2 text-sm">
                <GlobalIcon className="wiggle text-muted-foreground size-5" />
                <TextShimmer>{t`Chat.Tool.webSearching`}</TextShimmer>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <GlobalIcon className="text-muted-foreground size-5" />
                <span className="text-sm font-semibold">{t`Chat.Tool.searchedTheWeb`}</span>
                {options}
            </div>
            <div className="flex gap-2">
                <div className="px-2.5">
                    <Separator className="from-border bg-gradient-to-b from-80% to-transparent" orientation="vertical" />
                </div>
                <div className="flex flex-col gap-2 pb-2">
                    {Boolean(images?.length) && (
                        <div className="grid max-w-2xl grid-cols-3 gap-3">
                            {images.map((image, index) => {
                                if (!image.url)
                                    return null;

                                return (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="ring-input block cursor-pointer overflow-hidden rounded-lg shadow ring"
                                                key={image.url}
                                                onClick={() => {
                                                    notify.component({
                                                        children: (
                                                            <div className="flex h-full flex-col gap-4">
                                                                <div className="flex min-h-0 flex-1 items-center justify-center py-6">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        alt={image.description}
                                                                        className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain"
                                                                        onError={onError}
                                                                        src={image.url}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ),
                                                        className: "max-w-[90vw]! max-h-[90vh]! p-6!",
                                                    });
                                                }}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    alt={image.description}
                                                    className="h-36 w-full object-cover transition-transform duration-300 hover:scale-120"
                                                    loading="lazy"
                                                    onError={onError}
                                                    src={image.url}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs p-4 break-words whitespace-pre-wrap">
                                            <p className="text-muted-foreground text-xs">{image.description || image.url}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {result?.isError
                            ? (
                                <p className="text-destructive flex items-center gap-1 text-xs">
                                    <AlertTriangleIcon className="size-3.5" />
                                    {result.error || "Error"}
                                </p>
                            )
                            : (result as TavilyResponse)?.results?.map((result, index) => (
                                <HoverCard closeDelay={0} key={index} openDelay={200}>
                                    <HoverCardTrigger asChild>
                                        <a
                                            className="group bg-secondary hover:bg-input flex cursor-pointer items-center gap-1 rounded-full py-1.5 pr-2 pl-1.5 text-xs transition-all hover:ring hover:ring-blue-500"
                                            href={result.url}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            <div className="bg-input ring-input rounded-full ring">
                                                <Avatar className="size-3 rounded-full">
                                                    <AvatarImage src={result.favicon} />
                                                    <AvatarFallback>{result.title?.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <span className="max-w-44 truncate">{result.url}</span>
                                        </a>
                                    </HoverCardTrigger>

                                    <HoverCardContent className="flex flex-col gap-1 p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="ring-input rounded-full ring">
                                                <Avatar className="size-6 rounded-full">
                                                    <AvatarImage src={result.favicon} />
                                                    <AvatarFallback>{result.title?.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <span className={cn("font-medium", !result.title && "truncate")}>{result.title || result.url}</span>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2">
                                            <div className="relative">
                                                <div className="to-card pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-80%" />
                                                <p className="text-muted-foreground max-h-60 overflow-y-auto text-xs">{result.content || result.raw_content}</p>
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            ))}
                    </div>
                    {result?.results?.length && (
                        <p className="text-muted-foreground ml-1 flex items-center gap-1 text-xs">
                            {/* t`Common.resultsFound`, {
                                count: result?.results?.length,
                            }) */}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

function areEqual({ part: previousPart }: WebSearchToolInvocationProperties, { part: nextPart }: WebSearchToolInvocationProperties) {
    if (previousPart.state != nextPart.state)
        return false;

    if (!equal(previousPart.args, nextPart.args))
        return false;

    if (previousPart.state == "result" && !equal(previousPart.result, toAny(nextPart).result))
        return false;

    return true;
}

export const WebSearchToolInvocation = memo(PureWebSearchToolInvocation, areEqual);
