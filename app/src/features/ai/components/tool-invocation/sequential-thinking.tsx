"use client";

import type { ThoughtData } from "lib/ai/tools/thinking/sequential-thinking";
import { toAny } from "lib/utils";
import { CheckIcon, ChevronDownIcon, CircleIcon, Loader2Icon } from "lucide-react";
import { motion } from "motion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { TextShimmer } from "@anole/ui/components/text-shimmer";
import cn from "@anole/ui/utils/is-shortcut-event"

import type { ToolInvocationUIPart } from "@/types/chat";

import { WordByWordFadeIn } from "../markdown";

interface SequentialThinkingToolInvocationProperties {
    part: ToolInvocationUIPart["toolInvocation"];
}

const PureSequentialThinkingToolInvocation = ({ part }: SequentialThinkingToolInvocationProperties) => {
    const createdAt = useRef(Date.now());
    const initState = useRef(part.state);
    const [expanded, setExpanded] = useState(true);

    const [isDiff, setIsDiff] = useState(false);

    const thinkingData = useMemo(() => (toAny(part).result || part.args) as { steps: Partial<ThoughtData>[] } | undefined, [part.args, part.state]);

    const steps = useMemo(() => thinkingData?.steps || [], [thinkingData]);

    const second = useMemo(() => {
        if (!isDiff)
            return;

        return Math.floor((Date.now() - createdAt.current) / 1000);
    }, [part.state]);

    const header = useMemo(() => {
        const message = `Reasoned for ${second ? `${second} seconds` : "a few seconds"}`;

        if (part.state === "result")
            return message;

        return <TextShimmer>{message}</TextShimmer>;
    }, [part.state, second]);

    useEffect(() => {
        if (initState.current === "result")
            return;

        return () => {
            setIsDiff(true);
        };
    }, [part.state]);

    return (
        <div className="flex w-full px-2">
            <div className="flex flex-col">
                <div
                    className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors select-none"
                    onClick={() => setExpanded(!expanded)}
                >
                    {header}
                    <ChevronDownIcon className={cn("size-3 transition-transform", expanded && "rotate-180")} />
                </div>
                <div className={cn("flex gap-4 pl-[7px]", !expanded && "hidden")}>
                    <div className="flex flex-col px-2 py-4">
                        {steps.map((step, index) => {
                            const isLastStep = index === steps.length - 1;
                            const isRunning = isLastStep && part.state !== "result";
                            const isStepFinal = part.state === "result" && isLastStep;
                            const isOnlyOneStep = steps.length === 1 && index == 0;

                            return (
                                <div className="group/step text-muted-foreground relative flex flex-col gap-1 pb-4" key={index}>
                                    <div className={cn("flex items-center gap-2", isOnlyOneStep && "hidden")}>
                                        <div
                                            className={cn(
                                                "bg-secondary fade-in animate-in flex items-center justify-center rounded-full p-1 duration-500",
                                                isLastStep && "bg-primary text-primary-foreground",
                                            )}
                                        >
                                            {isStepFinal
                                                ? (
                                                    <CheckIcon className="size-2 stroke-4" />
                                                )
                                                : isRunning
                                                    ? (
                                                        <Loader2Icon className="size-2 animate-spin" />
                                                    )
                                                    : (
                                                        <CircleIcon className="text-foreground stroke-background fill-background size-2" />
                                                    )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-medium",
                                                (isStepFinal || isRunning) && "text-foreground font-semibold",
                                                isRunning && "animate-pulse",
                                            )}
                                        >
                                            {isStepFinal ? `Final Step` : `Step ${index + 1}`}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground group-hover/step:text-foreground ml-4.5 px-2 text-xs break-words transition-colors">
                                        <WordByWordFadeIn>{step.thought}</WordByWordFadeIn>
                                    </p>
                                    {!isLastStep && (
                                        <motion.div
                                            animate={{ scaleY: 1 }}
                                            className={cn(
                                                "bg-border absolute top-4 ml-[7px] h-full w-[2px] origin-top",
                                                index == steps.length - 2 && "from-border to-primary bg-gradient-to-b from-40%",
                                            )}
                                            initial={{ scaleY: 0 }}
                                            transition={{
                                                delay: 0.3,
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SequentialThinkingToolInvocation = memo(PureSequentialThinkingToolInvocation);
