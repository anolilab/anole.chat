"use client";

import { debounce } from "@tanstack/react-pacer";
import { Loader } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

let mermaidModule: typeof import("mermaid").default | null = null;

const loadMermaid = async () => {
    if (!mermaidModule) {
        mermaidModule = (await import("mermaid")).default;
    }

    return mermaidModule;
};

interface MermaidDiagramProperties {
    chart?: string;
}

export const MermaidDiagram = ({ chart }: MermaidDiagramProperties) => {
    const { theme } = useTheme();
    const [state, setState] = useState<{
        error: string | null;
        loading: boolean;
        svg: string;
    }>({
        error: null,
        loading: true,
        svg: "",
    });
    const containerReference = useRef<HTMLDivElement>(null);
    const previousChartReference = useRef<string>(chart);
    const debounceFunction = useMemo(() => (function_: () => void, delay: number) => {
        const debouncedFunction = debounce(function_, { wait: delay });

        debouncedFunction();
    }, []);

    useEffect(() => {
        // Reset states if chart has changed
        if (previousChartReference.current !== chart) {
            setState((previous) => {
                return { ...previous, error: null, loading: true };
            });
            previousChartReference.current = chart;
        }

        // Debounce rendering to avoid flickering during streaming
        debounceFunction(async () => {
            if (!chart?.trim()) {
                setState({ error: null, loading: false, svg: "" });

                return;
            }

            try {
                const mermaid = await loadMermaid();

                // Initialize mermaid with theme
                mermaid.initialize({
                    securityLevel: "loose",
                    startOnLoad: false,
                    theme: theme === "dark" ? "dark" : "default",
                });

                // // First try to parse to catch syntax errors early
                await mermaid.parse(chart);

                // Render the diagram
                const id = `mermaid-${Date.now()}`;
                const { svg } = await mermaid.render(id, chart);

                setState({ error: null, loading: false, svg });
            } catch (error) {
                console.error("Mermaid rendering error:", error);
                setState({
                    error: error instanceof Error ? error.message : "Failed to render diagram",
                    loading: false,
                    svg: "",
                });
            }
        }, 500);

        return () => {
            debounce.clear();
        };
    }, [chart, theme, debounce]);

    if (state.loading) {
        return (
            <div className="overflow-auto px-6">
                <div className="flex h-20 w-full items-center justify-center">
                    <div className="text-muted-foreground flex items-center gap-2">
                        Rendering diagram
                        {" "}
                        <Loader className="size-4 animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="overflow-auto px-6 pb-6">
                <div className="text-destructive p-4">
                    <p>Error rendering Mermaid diagram:</p>
                    <pre className="bg-destructive/10 dark:bg-destructive/20 mt-2 overflow-auto rounded p-2 text-xs">{state.error}</pre>
                    <pre className="bg-accent/10 dark:bg-accent/20 mt-2 overflow-auto rounded p-2 text-xs">{chart}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-auto px-6 pb-6">
            <div
                className="flex justify-center overflow-auto transition-opacity duration-200"
                dangerouslySetInnerHTML={{ __html: state.svg }}
                ref={containerReference}
            />
        </div>
    );
};
