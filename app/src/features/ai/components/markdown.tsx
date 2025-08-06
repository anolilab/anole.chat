import type { PropsWithChildren } from "react";
import { memo } from "react";
import { JsonView } from "react-json-view-lite";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import isJson from "../lib/is-json";
import { PreBlock } from "./pre-block";

const FadeIn = memo(({ children }: PropsWithChildren) => (
    <span className="fade-in animate-in duration-1000">
        {children}
        {" "}
    </span>
));

FadeIn.displayName = "FadeIn";

export const WordByWordFadeIn = memo(({ children }: PropsWithChildren) => {
    const childrens = [children].flat().flatMap((child) => (typeof child === "string" ? child.split(" ") : child));

    return childrens.map((word, index) => (typeof word === "string" ? <FadeIn key={index}>{word}</FadeIn> : word));
});

WordByWordFadeIn.displayName = "WordByWordFadeIn";
const components: Partial<Components> = {
    a: ({ children, node, ...properties }) => (
        <a className="text-blue-400 hover:underline" rel="noreferrer" target="_blank" {...properties}>
            <b>
                <WordByWordFadeIn>{children}</WordByWordFadeIn>
            </b>
        </a>
    ),
    blockquote: ({ children }) => (
        <div className="px-4">
            <blockquote className="bg-accent/30 relative my-6 overflow-hidden rounded-2xl border p-6">
                <WordByWordFadeIn>{children}</WordByWordFadeIn>
            </blockquote>
        </div>
    ),
    code: ({ children }) => <code className="bg-accent mx-0.5 rounded-md px-2 py-1 text-sm">{children}</code>,
    h1: ({ children, node, ...properties }) => (
        <h1 className="mt-6 mb-2 text-3xl font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h1>
    ),
    h2: ({ children, node, ...properties }) => (
        <h2 className="mt-6 mb-2 text-2xl font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h2>
    ),
    h3: ({ children, node, ...properties }) => (
        <h3 className="mt-6 mb-2 text-xl font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h3>
    ),
    h4: ({ children, node, ...properties }) => (
        <h4 className="mt-6 mb-2 text-lg font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h4>
    ),
    h5: ({ children, node, ...properties }) => (
        <h5 className="mt-6 mb-2 text-base font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h5>
    ),
    h6: ({ children, node, ...properties }) => (
        <h6 className="mt-6 mb-2 text-sm font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </h6>
    ),
    img: ({ children, node, ...properties }) => {
        const { alt, src, ...rest } = properties;

        return src ? <img alt={alt} className="mx-auto rounded-lg" src={src} {...rest} /> : null;
    },
    li: ({ children, node, ...properties }) => (
        <li className="py-2 break-words" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </li>
    ),
    ol: ({ children, node, ...properties }) => (
        <ol className="list-outside list-decimal px-8" {...properties}>
            {children}
        </ol>
    ),
    p: ({ children }) => (
        <p className="my-4 leading-6 break-words">
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </p>
    ),
    pre: ({ children }) => (
        <div className="px-4 py-2">
            <PreBlock>{children}</PreBlock>
        </div>
    ),
    strong: ({ children, node, ...properties }) => (
        <span className="font-semibold" {...properties}>
            <WordByWordFadeIn>{children}</WordByWordFadeIn>
        </span>
    ),
    ul: ({ children, node, ...properties }) => (
        <ul className="list-outside list-decimal px-8" {...properties}>
            {children}
        </ul>
    ),
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => (
    <article className="relative h-full w-full">
        {isJson(children)
            ? (
                <JsonView data={children} />
            )
            : (
                <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                    {children}
                </ReactMarkdown>
            )}
    </article>
);

export const Markdown = memo(NonMemoizedMarkdown, (previousProperties, nextProperties) => previousProperties.children === nextProperties.children);
