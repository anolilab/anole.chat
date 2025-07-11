"use client";

import { useMessagePart } from "@assistant-ui/react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import mermaid from "mermaid";
import type { FC } from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Props for the MermaidDiagram component
 */
export type MermaidDiagramProps = SyntaxHighlighterProps & {
    className?: string;
};

// Configure mermaid options here
mermaid.initialize({ theme: "default" });

/**
 * MermaidDiagram component for rendering Mermaid diagrams
 * Use it by passing to `componentsByLanguage` for mermaid in `markdown-text.tsx`
 * @example
 * const MarkdownTextImpl = () => {
 *   return (
 *     <MarkdownTextPrimitive
 *       remarkPlugins={[remarkGfm]}
 *       className="aui-md"
 *       components={defaultComponents}
 *       componentsByLanguage={{
 *         mermaid: {
 *           SyntaxHighlighter: MermaidDiagram
 *         },
 *       }}
 *     />
 *   );
 * };
 */
export const MermaidDiagram: FC<MermaidDiagramProps> = ({ className, code, components: _components, language: _language, node: _node }) => {
    const reference = useRef<HTMLPreElement>(null);

    // Detect when this code block is complete
    const isComplete = useMessagePart((part) => {
        if (part.type !== "text")
            return false;

        // Find the position of this code block
        const codeIndex = part.text.indexOf(code);

        if (codeIndex === -1)
            return false;

        // Check if there are closing backticks immediately after this code block
        const afterCode = part.text.slice(Math.max(0, codeIndex + code.length));

        // Look for the closing backticks - should be at the start or after a newline
        const closingBackticksMatch = afterCode.match(/^```|^\n```/);

        return closingBackticksMatch !== null;
    });

    useEffect(() => {
        if (!isComplete)
            return;

        (async () => {
            try {
                const element = document.createElement("div");

                element.textContent = code;
                element.classList.add("mermaid");
                await mermaid.run({ nodes: [element] });

                if (reference.current) {
                    reference.current.replaceChildren(element);
                }
            } catch (error) {
                console.warn("Failed to render Mermaid diagram:", error);
            }
        })();
    }, [isComplete, code]);

    return (
        <pre className={cn("bg-muted rounded-b-lg p-2 text-center [&_svg]:mx-auto", className)} ref={reference}>
            Drawing diagram...
        </pre>
    );
};

MermaidDiagram.displayName = "MermaidDiagram";
