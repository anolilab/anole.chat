"use client";

import cn from "@anole/ui/utils/cn";
import { ChartColumnIcon, ChartPieIcon, CodeIcon, GlobeIcon, HammerIcon, HardDriveUploadIcon, TrendingUpIcon } from "lucide-react";
import { useMemo } from "react";

import { DefaultToolName } from "../../lib/tools";

export function DefaultToolIcon({ className, name }: { className?: string; name: DefaultToolName }) {
    return useMemo(() => {
        if (name === DefaultToolName.CreatePieChart) {
            return <ChartPieIcon className={cn("size-3.5 text-blue-500", className)} />;
        }

        if (name === DefaultToolName.CreateBarChart) {
            return <ChartColumnIcon className={cn("size-3.5 text-blue-500", className)} />;
        }

        if (name === DefaultToolName.CreateLineChart) {
            return <TrendingUpIcon className={cn("size-3.5 text-blue-500", className)} />;
        }

        if (name === DefaultToolName.WebSearch) {
            return <GlobeIcon className={cn("size-3.5 text-blue-400", className)} />;
        }

        if (name === DefaultToolName.WebContent) {
            return <GlobeIcon className={cn("size-3.5 text-blue-400", className)} />;
        }

        if (name === DefaultToolName.Http) {
            return <HardDriveUploadIcon className={cn("size-3.5 text-blue-300", className)} />;
        }

        if (name === DefaultToolName.JavascriptExecution) {
            return <CodeIcon className={cn("size-3.5 text-yellow-400", className)} />;
        }

        if (name === DefaultToolName.PythonExecution) {
            return <CodeIcon className={cn("size-3.5 text-blue-400", className)} />;
        }

        return <HammerIcon className={cn("size-3.5", className)} />;
    }, [name]);
}
