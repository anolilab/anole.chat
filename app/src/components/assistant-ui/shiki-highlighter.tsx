"use client";

import cn from "@anole/ui/utils/cn";
import type { SyntaxHighlighterProps as AUIProperties } from "@assistant-ui/react-markdown";
import type { FC } from "react";
import { useEffect, useState } from "react";
import type { ShikiHighlighterProps } from "react-shiki/core";
import ShikiHighlighter, { createHighlighterCore, createOnigurumaEngine } from "react-shiki/core";
import type { HighlighterCore } from "shiki/core";

/**
 * Props for the SyntaxHighlighter component
 */
export type HighlighterProps = Omit<ShikiHighlighterProps, "children" | "theme" | "highlighter"> &
    Pick<AUIProperties, "node" | "components" | "language" | "code">;

const highlighterPromise = createHighlighterCore({
    engine: createOnigurumaEngine(import("shiki/wasm")),
    langs: [
        // Web Development
        import("@shikijs/langs/javascript"),
        import("@shikijs/langs/typescript"),
        import("@shikijs/langs/jsx"),
        import("@shikijs/langs/tsx"),
        import("@shikijs/langs/html"),
        import("@shikijs/langs/css"),
        import("@shikijs/langs/scss"),
        import("@shikijs/langs/sass"),
        import("@shikijs/langs/less"),
        import("@shikijs/langs/stylus"),
        import("@shikijs/langs/vue"),
        import("@shikijs/langs/svelte"),
        import("@shikijs/langs/astro"),
        import("@shikijs/langs/angular-ts"),
        import("@shikijs/langs/angular-html"),
        import("@shikijs/langs/mdx"),
        import("@shikijs/langs/postcss"),

        // Backend Languages
        import("@shikijs/langs/python"),
        import("@shikijs/langs/java"),
        import("@shikijs/langs/csharp"),
        import("@shikijs/langs/go"),
        import("@shikijs/langs/rust"),
        import("@shikijs/langs/php"),
        import("@shikijs/langs/ruby"),
        import("@shikijs/langs/kotlin"),
        import("@shikijs/langs/scala"),
        import("@shikijs/langs/swift"),
        import("@shikijs/langs/dart"),
        import("@shikijs/langs/elixir"),
        import("@shikijs/langs/erlang"),
        import("@shikijs/langs/haskell"),
        import("@shikijs/langs/ocaml"),
        import("@shikijs/langs/fsharp"),
        import("@shikijs/langs/clojure"),
        import("@shikijs/langs/julia"),
        import("@shikijs/langs/lua"),
        import("@shikijs/langs/perl"),
        import("@shikijs/langs/r"),

        // Systems Programming
        import("@shikijs/langs/c"),
        import("@shikijs/langs/cpp"),
        import("@shikijs/langs/zig"),
        import("@shikijs/langs/objective-c"),
        import("@shikijs/langs/objective-cpp"),
        import("@shikijs/langs/llvm"),

        // Shell & Scripting
        import("@shikijs/langs/bash"),
        import("@shikijs/langs/shell"),
        import("@shikijs/langs/zsh"),
        import("@shikijs/langs/fish"),
        import("@shikijs/langs/powershell"),
        import("@shikijs/langs/batch"),
        import("@shikijs/langs/cmd"),

        // Data & Config
        import("@shikijs/langs/json"),
        import("@shikijs/langs/json5"),
        import("@shikijs/langs/jsonc"),
        import("@shikijs/langs/yaml"),
        import("@shikijs/langs/toml"),
        import("@shikijs/langs/xml"),
        import("@shikijs/langs/csv"),
        import("@shikijs/langs/ini"),
        import("@shikijs/langs/properties"),
        import("@shikijs/langs/dotenv"),

        // Database
        import("@shikijs/langs/sql"),
        import("@shikijs/langs/plsql"),
        import("@shikijs/langs/cypher"),
        import("@shikijs/langs/sparql"),
        import("@shikijs/langs/graphql"),

        // DevOps & Infrastructure
        import("@shikijs/langs/dockerfile"),
        import("@shikijs/langs/docker"),
        import("@shikijs/langs/terraform"),
        import("@shikijs/langs/hcl"),
        import("@shikijs/langs/nginx"),
        import("@shikijs/langs/apache"),
        import("@shikijs/langs/systemd"),
        import("@shikijs/langs/ssh-config"),

        // Documentation
        import("@shikijs/langs/markdown"),
        import("@shikijs/langs/latex"),
        import("@shikijs/langs/tex"),
        import("@shikijs/langs/rst"),
        import("@shikijs/langs/asciidoc"),
        import("@shikijs/langs/typst"),

        // Game Development
        import("@shikijs/langs/gdscript"),
        import("@shikijs/langs/gdshader"),
        import("@shikijs/langs/hlsl"),
        import("@shikijs/langs/glsl"),
        import("@shikijs/langs/wgsl"),
        import("@shikijs/langs/shader"),
        import("@shikijs/langs/shaderlab"),

        // Mobile Development
        import("@shikijs/langs/swift"),
        import("@shikijs/langs/kotlin"),
        import("@shikijs/langs/dart"),

        // Functional Languages
        import("@shikijs/langs/haskell"),
        import("@shikijs/langs/elm"),
        import("@shikijs/langs/purescript"),
        import("@shikijs/langs/ocaml"),
        import("@shikijs/langs/fsharp"),
        import("@shikijs/langs/clojure"),
        import("@shikijs/langs/scheme"),
        import("@shikijs/langs/racket"),
        import("@shikijs/langs/lisp"),

        // Emerging Languages
        import("@shikijs/langs/zig"),
        import("@shikijs/langs/v"),
        import("@shikijs/langs/nim"),
        import("@shikijs/langs/crystal"),
        import("@shikijs/langs/gleam"),
        import("@shikijs/langs/mojo"),
        import("@shikijs/langs/lean"),

        // Specialized
        import("@shikijs/langs/solidity"),
        import("@shikijs/langs/vyper"),
        import("@shikijs/langs/cairo"),
        import("@shikijs/langs/move"),
        import("@shikijs/langs/matlab"),
        import("@shikijs/langs/wolfram"),
        import("@shikijs/langs/stata"),
        import("@shikijs/langs/sas"),
        import("@shikijs/langs/gnuplot"),

        // Template Languages
        import("@shikijs/langs/handlebars"),
        import("@shikijs/langs/jinja"),
        import("@shikijs/langs/twig"),
        import("@shikijs/langs/liquid"),
        import("@shikijs/langs/erb"),
        import("@shikijs/langs/pug"),
        import("@shikijs/langs/haml"),

        // Others
        import("@shikijs/langs/makefile"),
        import("@shikijs/langs/cmake"),
        import("@shikijs/langs/diff"),
        import("@shikijs/langs/log"),
        import("@shikijs/langs/regex"),
        import("@shikijs/langs/http"),
        import("@shikijs/langs/protobuf"),
    ],
    themes: [import("@shikijs/themes/min-light"), import("@shikijs/themes/poimandres")],
});

/**
 * SyntaxHighlighter component, using react-shiki with custom highlighter
 * Use it by passing to `defaultComponents` in `markdown-text.tsx`
 * @example
 * const defaultComponents = memoizeMarkdownComponents({
 *   SyntaxHighlighter,
 *   h1: //...
 *   //...other elements...
 * });
 */
export const SyntaxHighlighter: FC<HighlighterProps> = ({
    addDefaultStyles = false, // assistant-ui requires custom base styles
    className,
    code,
    components: _components,
    language,
    node: _node,
    showLanguage = false, // assistant-ui/react-markdown handles language labels
    ...properties
}) => {
    const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        highlighterPromise
            .then((hl) => {
                if (isMounted) {
                    setHighlighter(hl);
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                console.error("Failed to create highlighter:", error);

                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Use dual theme setup for light/dark mode
    const shikiTheme = {
        dark: "poimandres",
        light: "min-light",
    };

    // Dynamic base styles that adapt to theme
    const BASE_STYLES = [
        "[&_pre]:overflow-x-auto [&_pre]:rounded-b-lg [&_pre]:p-4",
        "[&_pre]:bg-background [&_pre]:text-foreground",
        "[&_pre]:border-x [&_pre]:border-b [&_pre]:border-zinc-100 dark:[&_pre]:border-zinc-800",
    ];

    // Show loading state while highlighter is being created
    if (isLoading || !highlighter) {
        return (
            <pre className={cn(BASE_STYLES, className)}>
                <code className="text-muted-foreground">{code}</code>
            </pre>
        );
    }

    return (
        <ShikiHighlighter
            {...properties}
            addDefaultStyles={addDefaultStyles}
            className={cn(BASE_STYLES, className)}
            highlighter={highlighter}
            language={language}
            showLanguage={showLanguage}
            theme={shikiTheme}
        >
            {code}
        </ShikiHighlighter>
    );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
