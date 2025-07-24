import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@anole/ui/components/dropdown-menu";
import type { Edge } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";

import { useToRef } from "@/hooks/use-latest";
import type { TipTapMentionJsonContent } from "@/types/util";

import { findAvailableSchemaBySource } from "../../lib/workflow/shared.workflow";
import type { OutputSchemaSourceKey, UINode } from "../../lib/workflow/workflow.interface";
import MentionInput from "../mention-input";
import { VariableMentionItem } from "./variable-mention-item";
import { VariableSelectContent } from "./variable-select";

interface OutputSchemaMentionInputProperties {
    className?: string;
    content?: TipTapMentionJsonContent;
    currentNodeId: string;
    edges: Edge[];
    editable?: boolean;
    nodes: UINode[];
    onChange: (content: TipTapMentionJsonContent) => void;
    placeholder?: string;
}

export const OutputSchemaMentionInput = ({ className, content, currentNodeId, editable, onChange }: OutputSchemaMentionInputProperties) => {
    const { getEdges, getNodes } = useReactFlow<UINode>();
    const latestContent = useToRef<TipTapMentionJsonContent>(content!);
    const handleChange = useCallback(({ json }: { json: TipTapMentionJsonContent }) => {
        onChange(json);
    }, []);

    const onRemove = useCallback((id: string) => {
        const newContent = structuredClone(latestContent.current);

        newContent.content.some((item) => {
            if (item?.content?.length) {
                const targetIndex = item.content.findIndex((item) => item.type === "mention" && item.attrs.id === id);

                if (targetIndex !== -1) {
                    item.content.splice(targetIndex, 1);

                    return true;
                }

                return false;
            }
        });
        onChange(newContent);
    }, []);

    const MentionItem = useCallback(({ id, label }: { id: string; label: string }) => {
        const item = JSON.parse(label) as OutputSchemaSourceKey;

        const nodes = getNodes();
        const edges = getEdges();

        const labelData = findAvailableSchemaBySource({
            edges,
            nodeId: currentNodeId,
            nodes: nodes.map((node) => node.data),
            source: item,
        });

        const handleRemove = () => onRemove(id);

        return <VariableMentionItem className="max-w-60" {...labelData} onRemove={handleRemove} />;
    }, []);

    const Suggestion = useMemo(() => outputSchemaMentionInputSuggestionBuilder(currentNodeId), [currentNodeId]);

    return (
        <MentionInput
            className={className}
            content={content}
            disabled={!editable}
            MentionItem={MentionItem}
            onChange={handleChange}
            Suggestion={Suggestion}
            suggestionChar="/"
        />
    );
};

const outputSchemaMentionInputSuggestionBuilder
    = (
        nodeId: string,
    ): React.FC<{
        left: number;
        onClose: () => void;
        onSelectMention: (item: { id: string; label: string }) => void;
        top: number;
    }> =>
        ({ left, onClose, onSelectMention, top }) => {
            const mentionReference = useRef<HTMLDivElement>(null);

            return createPortal(
                <div
                    className="fixed z-50"
                    style={{
                        left,
                        top,
                    }}
                >
                    <DropdownMenu onOpenChange={onClose} open>
                        <DropdownMenuTrigger className="sr-only" />
                        <DropdownMenuContent align="start" ref={mentionReference} side="top">
                            <VariableSelectContent
                                currentNodeId={nodeId}
                                onChange={(item) => {
                                    onSelectMention({
                                        id: uuidv4(),
                                        label: JSON.stringify({
                                            nodeId: item.nodeId,
                                            path: item.path,
                                        }),
                                    });
                                }}
                                onClose={onClose}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>,
                document.body,
            );
        };
