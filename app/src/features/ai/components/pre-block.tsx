"use client";

import { Button } from "@anole/ui/components/button";
import useCopy from "@anole/ui/hooks/use-copy-to-clipboard";
import cn from "@anole/ui/utils/cn";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { JSX } from "react";
import { Fragment, lazy, Suspense, useLayoutEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { JsonView } from "react-json-view-lite";
import type { BundledLanguage } from "shiki/bundle/web";
import { bundledLanguages, codeToHast } from "shiki/bundle/web";

const MermaidDiagram = lazy(() =>
    import("./mermaid-diagram").then((module_) => {
        return { default: module_.MermaidDiagram };
    }),
);

const PurePre = ({ children, className, code, lang }: { children: any; className?: string; code: string; lang: string }) => {
    const { copied, copy } = useCopy();

    return (
        <pre className={cn("relative", className)}>
            <div className="bg-secondary z-20 mb-4 border-b p-1.5">
                <div className="z-20 flex w-full items-center px-4 py-0.5">
                    <span className="text-muted-foreground text-sm">{lang}</span>
                    <Button
                        className="z-10 ml-auto size-2! rounded-sm p-3!"
                        onClick={() => {
                            copy(code);
                        }}
                        size="icon"
                        variant={copied ? "secondary" : "ghost"}
                    >
                        {copied ? <CheckIcon /> : <CopyIcon className="size-3!" />}
                    </Button>
                </div>
            </div>
            <div className="relative overflow-x-auto px-6 pb-6">{children}</div>
        </pre>
    );
};

export const Highlight = async (code: string, lang: BundledLanguage | (string & {}), theme: string): Promise<JSX.Element> => {
    const parsed: BundledLanguage = (bundledLanguages[lang] ? lang : "md") as BundledLanguage;

    if (lang === "json") {
        return (
            <PurePre code={code} lang={lang}>
                <JsonView data={code} initialExpandDepth={3} />
            </PurePre>
        );
    }

    if (lang === "mermaid") {
        return (
            <PurePre code={code} lang={lang}>
                <Suspense
                    fallback={(
                        <div className="bg-accent/30 relative my-4 flex flex-col overflow-hidden rounded-2xl border text-sm">
                            <div className="z-20 flex w-full items-center px-4 py-2">
                                <span className="text-muted-foreground text-sm">mermaid</span>
                            </div>
                            <div className="relative overflow-x-auto px-6 pb-6">
                                <div className="flex h-20 w-full items-center justify-center">
                                    <span className="text-muted-foreground">Loading Mermaid renderer...</span>
                                </div>
                            </div>
                        </div>
                    )}
                >
                    <MermaidDiagram chart={code} />
                </Suspense>
            </PurePre>
        );
    }

    const out = await codeToHast(code, {
        lang: parsed,
        theme,
    });

    return toJsxRuntime(out, {
        components: {
            pre: (properties) => <PurePre {...properties} code={code} lang={lang} />,
        },
        Fragment,
        jsx,
        jsxs,
    }) as JSX.Element;
};

export const PreBlock = ({ children }: { children: any }) => {
    const code = children.props.children;
    const { theme } = useTheme();
    const language = children.props.className?.split("-")?.[1] || "bash";
    const [loading, setLoading] = useState(true);
    const [component, setComponent] = useState<JSX.Element | null>(
        <PurePre className="animate-pulse" code={code} lang={language}>
            {children}
        </PurePre>,
    );

    useLayoutEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const highlighted = await Highlight(code, language, theme === "dark" ? "dark-plus" : "github-light");

                if (!cancelled)
                    setComponent(highlighted);
            } finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [theme, language, code]);

    // For other code blocks, render as before
    return (
        <div className={cn(loading && "animate-pulse", "bg-secondary/40 relative my-4 flex flex-col overflow-hidden rounded border text-sm shadow")}>
            <div className="to-secondary pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent from-90%" />
            {component}
        </div>
    );
};
