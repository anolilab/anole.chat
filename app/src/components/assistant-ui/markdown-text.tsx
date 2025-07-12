"use client";

import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";

import type { CodeHeaderProps } from "@assistant-ui/react-markdown";
import { MarkdownTextPrimitive, unstable_memoizeMarkdownComponents as memoizeMarkdownComponents, useIsMarkdownCodeBlock } from "@assistant-ui/react-markdown";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import type { FC } from "react";
import { memo, useState } from "react";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { MermaidDiagram } from "@/components/assistant-ui/mermaid-diagram";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

import { SyntaxHighlighter } from "./shiki-highlighter";

// Get file extension based on language
const getFileExtension = (lang: string): string => {
    const extensionMap: Record<string, string> = {
        adoc: "adoc",
        "angular-html": "html",
        "angular-ts": "ts",
        apache: "conf",
        asciidoc: "adoc",
        astro: "astro",
        bash: "sh",
        bat: "bat",
        batch: "bat",
        // Systems Programming
        c: "c",
        "c++": "cpp",
        cairo: "cairo",
        cc: "cpp",
        clj: "clj",
        clojure: "clj",
        cmake: "cmake",
        cmd: "cmd",
        cpp: "cpp",
        crystal: "cr",

        cs: "cs",
        csharp: "cs",
        css: "css",
        csv: "csv",
        cxx: "cpp",
        cypher: "cyp",
        dart: "dart",
        diff: "diff",
        docker: "dockerfile",
        // DevOps & Infrastructure
        dockerfile: "dockerfile",
        dotenv: ".env",
        elixir: "ex",
        // Functional Languages
        elm: "elm",
        env: ".env",
        erb: "erb",
        erl: "erl",
        erlang: "erl",
        exs: "exs",
        fish: "fish",
        fs: "fs",
        fsharp: "fs",
        // Game Development
        gdscript: "gd",
        gdshader: "gdshader",
        gleam: "gleam",
        glsl: "glsl",
        gnuplot: "gp",
        go: "go",
        gql: "gql",
        graphql: "graphql",
        haml: "haml",
        // Template Languages
        handlebars: "hbs",
        haskell: "hs",
        hbs: "hbs",

        hcl: "hcl",
        hlsl: "hlsl",
        hs: "hs",
        html: "html",
        http: "http",
        ini: "ini",
        jade: "jade",
        java: "java",
        // Web Development
        javascript: "js",
        jinja: "j2",

        jinja2: "j2",
        jl: "jl",
        js: "js",
        // Data & Config
        json: "json",
        json5: "json5",
        jsonc: "jsonc",
        jsx: "jsx",
        julia: "jl",
        kotlin: "kt",
        kt: "kt",

        kts: "kts",
        latex: "tex",
        lean: "lean",
        less: "less",
        liquid: "liquid",
        lisp: "lisp",
        llvm: "ll",
        log: "log",
        lua: "lua",
        make: "makefile",
        // Others
        makefile: "makefile",
        // Documentation
        markdown: "md",

        matlab: "m",
        md: "md",
        mdx: "mdx",
        mojo: "mojo",
        move: "move",
        nginx: "conf",

        nim: "nim",
        objc: "m",
        "objective-c": "m",
        "objective-cpp": "mm",
        ocaml: "ml",
        patch: "patch",
        perl: "pl",
        php: "php",
        plsql: "sql",

        postcss: "pcss",
        powershell: "ps1",
        properties: "properties",
        proto: "proto",
        protobuf: "proto",
        ps1: "ps1",
        pug: "pug",
        purescript: "purs",

        py: "py",
        // Backend Languages
        python: "py",
        r: "r",
        racket: "rkt",
        rb: "rb",
        regex: "regex",
        regexp: "regex",

        rs: "rs",
        rst: "rst",
        ruby: "rb",
        rust: "rs",
        sas: "sas",

        sass: "sass",
        scala: "scala",
        scheme: "scm",
        scss: "scss",
        sh: "sh",
        shader: "shader",

        shaderlab: "shader",
        // Shell & Scripting
        shell: "sh",
        // Specialized
        solidity: "sol",
        sparql: "rq",
        // Database
        sql: "sql",
        "ssh-config": "config",
        stata: "do",
        stylus: "styl",
        svelte: "svelte",

        swift: "swift",
        systemd: "service",
        terraform: "tf",
        tex: "tex",
        tf: "tf",
        toml: "toml",
        ts: "ts",
        tsx: "tsx",
        twig: "twig",
        typescript: "ts",

        typst: "typ",
        // Emerging Languages
        v: "v",
        vue: "vue",
        vyper: "vy",
        wgsl: "wgsl",
        wolfram: "wl",
        xml: "xml",
        yaml: "yaml",
        yml: "yml",
        zig: "zig",
        zsh: "zsh",
    };

    return extensionMap[lang.toLowerCase()] || "txt";
};

const MarkdownTextImpl = () => (
    <MarkdownTextPrimitive
        className="aui-md"
        components={defaultComponents}
        componentsByLanguage={{
            mermaid: {
                SyntaxHighlighter: MermaidDiagram,
            },
        }}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        remarkPlugins={[remarkGfm, remarkMath, remarkDirective]}
    />
);

const CodeHeader: FC<CodeHeaderProps> = ({ code, language }) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const onCopy = () => {
        if (!code || isCopied) {
            return;
        }

        copyToClipboard(code);
    };

    const onDownload = () => {
        if (!code) {
            return;
        }

        const extension = getFileExtension(language || "");
        const filename = `code.${extension}`;

        // Create blob and download
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.append(link);
        link.click();

        link.remove();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-100 px-2 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="lowercase [&>span]:text-xs">{language}</span>
            <div className="flex items-center gap-2">
                <TooltipIconButton
                    className="size-6 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                    onClick={onDownload}
                    tooltip="Download"
                >
                    <DownloadIcon className="h-4 w-4" />
                </TooltipIconButton>
                <TooltipIconButton
                    className="size-6 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                    onClick={onCopy}
                    tooltip="Copy"
                >
                    {!isCopied && <CopyIcon className="h-4 w-4" />}
                    {isCopied && <CheckIcon className="h-4 w-4" />}
                </TooltipIconButton>
            </div>
        </div>
    );
};

const useCopyToClipboard = ({
    copiedDuration = 3000,
}: {
    copiedDuration?: number;
} = {}) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const copyToClipboard = (value: string) => {
        if (!value)
            return;

        navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, copiedDuration);
        });
    };

    return { copyToClipboard, isCopied };
};

const defaultComponents = memoizeMarkdownComponents({
    a: ({ className, ...properties }) => <a className={cn("text-primary font-medium underline underline-offset-4", className)} {...properties} />,
    blockquote: ({ className, ...properties }) => <blockquote className={cn("border-l-2 pl-6 italic", className)} {...properties} />,
    code: function Code({ className, ...properties }) {
        const isCodeBlock = useIsMarkdownCodeBlock();

        return <code className={cn(!isCodeBlock && "bg-muted rounded border font-semibold", className)} {...properties} />;
    },
    CodeHeader,
    h1: ({ className, ...properties }) => <h1 className={cn("mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0", className)} {...properties} />,
    h2: ({ className, ...properties }) => (
        <h2 className={cn("mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...properties} />
    ),
    h3: ({ className, ...properties }) => (
        <h3 className={cn("mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...properties} />
    ),
    h4: ({ className, ...properties }) => (
        <h4 className={cn("mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...properties} />
    ),
    h5: ({ className, ...properties }) => <h5 className={cn("my-4 text-lg font-semibold first:mt-0 last:mb-0", className)} {...properties} />,
    h6: ({ className, ...properties }) => <h6 className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)} {...properties} />,
    hr: ({ className, ...properties }) => <hr className={cn("my-5 border-b", className)} {...properties} />,
    ol: ({ className, ...properties }) => <ol className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)} {...properties} />,
    p: ({ className, ...properties }) => <p className={cn("mb-5 mt-5 leading-7 first:mt-0 last:mb-0", className)} {...properties} />,
    pre: ({ className, ...properties }) => (
        <pre className={cn("overflow-x-auto rounded-b-lg bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100", className)} {...properties} />
    ),
    sup: ({ className, ...properties }) => <sup className={cn("[&>a]:text-xs [&>a]:no-underline", className)} {...properties} />,
    SyntaxHighlighter,
    table: ({ className, ...properties }) => (
        <table className={cn("my-5 w-full border-separate border-spacing-0 overflow-y-auto", className)} {...properties} />
    ),
    td: ({ className, ...properties }) => (
        <td
            className={cn("border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right", className)}
            {...properties}
        />
    ),
    th: ({ className, ...properties }) => (
        <th
            className={cn(
                "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
                className,
            )}
            {...properties}
        />
    ),
    tr: ({ className, ...properties }) => (
        <tr
            className={cn("m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg", className)}
            {...properties}
        />
    ),
    ul: ({ className, ...properties }) => <ul className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)} {...properties} />,
});

export const MarkdownText = memo(MarkdownTextImpl);
