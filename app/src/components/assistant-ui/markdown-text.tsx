"use client";

import "@assistant-ui/react-markdown/styles/dot.css";
import { MermaidDiagram } from "@/components/assistant-ui/mermaid-diagram";

import {
    type CodeHeaderProps,
    MarkdownTextPrimitive,
    unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
    useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { type FC, memo, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { SyntaxHighlighter } from "./shiki-highlighter";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import rehypeRaw from "rehype-raw";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";

// Get file extension based on language
const getFileExtension = (lang: string): string => {
    const extensionMap: Record<string, string> = {
        // Web Development
        javascript: "js",
        js: "js",
        typescript: "ts",
        ts: "ts",
        jsx: "jsx",
        tsx: "tsx",
        html: "html",
        css: "css",
        scss: "scss",
        sass: "sass",
        less: "less",
        stylus: "styl",
        vue: "vue",
        svelte: "svelte",
        astro: "astro",
        "angular-ts": "ts",
        "angular-html": "html",
        mdx: "mdx",
        postcss: "pcss",

        // Backend Languages
        python: "py",
        py: "py",
        java: "java",
        csharp: "cs",
        cs: "cs",
        go: "go",
        rust: "rs",
        rs: "rs",
        php: "php",
        ruby: "rb",
        rb: "rb",
        kotlin: "kt",
        kt: "kt",
        kts: "kts",
        scala: "scala",
        swift: "swift",
        dart: "dart",
        elixir: "ex",
        exs: "exs",
        erlang: "erl",
        erl: "erl",
        haskell: "hs",
        hs: "hs",
        ocaml: "ml",
        fsharp: "fs",
        fs: "fs",
        clojure: "clj",
        clj: "clj",
        julia: "jl",
        jl: "jl",
        lua: "lua",
        perl: "pl",
        r: "r",

        // Systems Programming
        c: "c",
        cpp: "cpp",
        "c++": "cpp",
        cxx: "cpp",
        cc: "cpp",
        zig: "zig",
        "objective-c": "m",
        objc: "m",
        "objective-cpp": "mm",
        llvm: "ll",

        // Shell & Scripting
        shell: "sh",
        sh: "sh",
        bash: "sh",
        zsh: "zsh",
        fish: "fish",
        powershell: "ps1",
        ps1: "ps1",
        batch: "bat",
        bat: "bat",
        cmd: "cmd",

        // Data & Config
        json: "json",
        json5: "json5",
        jsonc: "jsonc",
        yaml: "yaml",
        yml: "yml",
        toml: "toml",
        xml: "xml",
        csv: "csv",
        ini: "ini",
        properties: "properties",
        dotenv: ".env",
        env: ".env",

        // Database
        sql: "sql",
        plsql: "sql",
        cypher: "cyp",
        sparql: "rq",
        graphql: "graphql",
        gql: "gql",

        // DevOps & Infrastructure
        dockerfile: "dockerfile",
        docker: "dockerfile",
        terraform: "tf",
        tf: "tf",
        hcl: "hcl",
        nginx: "conf",
        apache: "conf",
        systemd: "service",
        "ssh-config": "config",

        // Documentation
        markdown: "md",
        md: "md",
        latex: "tex",
        tex: "tex",
        rst: "rst",
        asciidoc: "adoc",
        adoc: "adoc",
        typst: "typ",

        // Game Development
        gdscript: "gd",
        gdshader: "gdshader",
        hlsl: "hlsl",
        glsl: "glsl",
        wgsl: "wgsl",
        shader: "shader",
        shaderlab: "shader",

        // Functional Languages
        elm: "elm",
        purescript: "purs",
        scheme: "scm",
        racket: "rkt",
        lisp: "lisp",

        // Emerging Languages
        v: "v",
        nim: "nim",
        crystal: "cr",
        gleam: "gleam",
        mojo: "mojo",
        lean: "lean",

        // Specialized
        solidity: "sol",
        vyper: "vy",
        cairo: "cairo",
        move: "move",
        matlab: "m",
        wolfram: "wl",
        stata: "do",
        sas: "sas",
        gnuplot: "gp",

        // Template Languages
        handlebars: "hbs",
        hbs: "hbs",
        jinja: "j2",
        jinja2: "j2",
        twig: "twig",
        liquid: "liquid",
        erb: "erb",
        pug: "pug",
        jade: "jade",
        haml: "haml",

        // Others
        makefile: "makefile",
        make: "makefile",
        cmake: "cmake",
        diff: "diff",
        patch: "patch",
        log: "log",
        regex: "regex",
        regexp: "regex",
        http: "http",
        protobuf: "proto",
        proto: "proto",
    };

    return extensionMap[lang.toLowerCase()] || "txt";
};

const MarkdownTextImpl = () => {
    return (
        <MarkdownTextPrimitive
            remarkPlugins={[remarkGfm, remarkMath, remarkDirective]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            className="aui-md"
            components={defaultComponents}
            componentsByLanguage={{
                mermaid: {
                    SyntaxHighlighter: MermaidDiagram,
                },
            }}
        />
    );
};

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard();

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

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-100 px-2 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="lowercase [&>span]:text-xs">{language}</span>
            <div className="flex items-center gap-2">
                <TooltipIconButton
                    tooltip="Download"
                    onClick={onDownload}
                    className="size-6 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                >
                    <DownloadIcon className="h-4 w-4" />
                </TooltipIconButton>
                <TooltipIconButton
                    tooltip="Copy"
                    onClick={onCopy}
                    className="size-6 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
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
        if (!value) return;

        navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), copiedDuration);
        });
    };

    return { isCopied, copyToClipboard };
};

const defaultComponents = memoizeMarkdownComponents({
    h1: ({ className, ...props }) => <h1 className={cn("mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0", className)} {...props} />,
    h2: ({ className, ...props }) => (
        <h2 className={cn("mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...props} />
    ),
    h3: ({ className, ...props }) => (
        <h3 className={cn("mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...props} />
    ),
    h4: ({ className, ...props }) => (
        <h4 className={cn("mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0", className)} {...props} />
    ),
    h5: ({ className, ...props }) => <h5 className={cn("my-4 text-lg font-semibold first:mt-0 last:mb-0", className)} {...props} />,
    h6: ({ className, ...props }) => <h6 className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)} {...props} />,
    p: ({ className, ...props }) => <p className={cn("mt-5 mb-5 leading-7 first:mt-0 last:mb-0", className)} {...props} />,
    a: ({ className, ...props }) => <a className={cn("text-primary font-medium underline underline-offset-4", className)} {...props} />,
    blockquote: ({ className, ...props }) => <blockquote className={cn("border-l-2 pl-6 italic", className)} {...props} />,
    ul: ({ className, ...props }) => <ul className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)} {...props} />,
    ol: ({ className, ...props }) => <ol className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />,
    hr: ({ className, ...props }) => <hr className={cn("my-5 border-b", className)} {...props} />,
    table: ({ className, ...props }) => <table className={cn("my-5 w-full border-separate border-spacing-0 overflow-y-auto", className)} {...props} />,
    th: ({ className, ...props }) => (
        <th
            className={cn(
                "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
                className,
            )}
            {...props}
        />
    ),
    td: ({ className, ...props }) => (
        <td
            className={cn("border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right", className)}
            {...props}
        />
    ),
    tr: ({ className, ...props }) => (
        <tr
            className={cn("m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg", className)}
            {...props}
        />
    ),
    sup: ({ className, ...props }) => <sup className={cn("[&>a]:text-xs [&>a]:no-underline", className)} {...props} />,
    pre: ({ className, ...props }) => (
        <pre className={cn("overflow-x-auto rounded-b-lg bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100", className)} {...props} />
    ),
    code: function Code({ className, ...props }) {
        const isCodeBlock = useIsMarkdownCodeBlock();
        return <code className={cn(!isCodeBlock && "bg-muted rounded border font-semibold", className)} {...props} />;
    },
    CodeHeader,
    SyntaxHighlighter,
});

export const MarkdownText = memo(MarkdownTextImpl);
