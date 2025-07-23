"use client";

import { TextShimmer } from "@anole/ui/components/text-shimmer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@anole/ui/components/tooltip";
import { useLingui } from "@lingui/react/macro";
import { BlocksIcon, ChevronsLeftRightEllipsisIcon, Terminal } from "lucide-react";
import { useMemo } from "react";

import { NodeKind } from "../../lib/workflow/workflow.interface";
import { NodeIcon } from "./node-icon";

export const WorkflowGreeting = () => {
    const { t } = useLingui();
    const descriptions = useMemo(() => t.raw("Workflow.kindsDescription") ?? {}, [t]);

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">{t`Workflow.title`}</h2>
                <p className="text-muted-foreground">{t`Workflow.createWorkflowDescription`}</p>
            </div>

            {/* Main content - Two column layout */}
            <div className="grid items-start gap-8 md:grid-cols-2">
                {/* Left: Explanation */}
                <div className="space-y-4">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">
                            <BlocksIcon className="mr-2 inline-block size-4" />
                            {t`Workflow.greeting.buildAutomationTitle`}
                        </h3>
                        <p className="text-muted-foreground pl-6 text-sm leading-relaxed">{t`Workflow.greeting.buildAutomationDescription`}</p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">
                            <Terminal className="mr-2 inline-block size-4" />
                            {t`Workflow.greeting.chatbotToolTitle`}
                        </h3>
                        <p className="text-muted-foreground pl-6 text-sm leading-relaxed">{t`Workflow.greeting.chatbotToolDescription`}</p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">
                            <ChevronsLeftRightEllipsisIcon className="mr-2 inline-block size-4" />
                            {t`Workflow.greeting.parameterBasedTitle`}
                        </h3>
                        <p className="text-muted-foreground pl-6 text-sm leading-relaxed">{t`Workflow.greeting.parameterBasedDescription`}</p>
                    </div>

                    <div className="rounded-lg border border-blue-500 bg-blue-500/5 p-4">
                        <h4 className="mb-2 text-sm font-medium text-blue-500">{t`Workflow.greeting.exampleTitle`}</h4>
                        <p className="text-xs leading-relaxed text-blue-500/50">{t`Workflow.greeting.exampleDescription`}</p>
                    </div>
                </div>

                {/* Right: Node Grid */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t`Workflow.greeting.availableNodesTitle`}</h3>

                    <div className="grid grid-cols-3 gap-3">
                        {Object.keys(NodeKind).map((key) => (
                            <Tooltip delayDuration={200} key={key}>
                                <TooltipTrigger asChild>
                                    <div className="group hover:bg-accent flex cursor-default flex-col items-center gap-2 rounded-lg p-3 transition-colors">
                                        <NodeIcon
                                            className="ring-input/40 group-hover:ring-input ring-4 transition-all duration-300 group-hover:scale-105"
                                            type={NodeKind[key]}
                                        />
                                        <span className="block text-center text-xs font-medium group-hover:hidden">{key}</span>
                                        <TextShimmer className="hidden text-center text-xs font-medium group-hover:block">{key}</TextShimmer>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <NodeIcon type={NodeKind[key]} />
                                        <span className="text-sm font-semibold">{key}</span>
                                    </div>
                                    <div className="text-muted-foreground text-xs whitespace-pre-wrap">
                                        {descriptions[NodeKind[key]] ?? t`Workflow.greeting.soonMessage`}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="border-t pt-4 text-center">
                <p className="text-muted-foreground text-sm">{t`Workflow.greeting.ctaMessage`}</p>
            </div>
        </div>
    );
};
