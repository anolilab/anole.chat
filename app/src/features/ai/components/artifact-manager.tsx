import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { textArtifact } from "../artifacts/text/client";
import { codeArtifact } from "../artifacts/code/client";
import { sheetArtifact } from "../artifacts/sheet/client";
import type { ArtifactKind, Document, UIArtifact } from "../types/artifacts";

const artifactDefinitions = [textArtifact, codeArtifact, sheetArtifact];
export type { ArtifactKind };

export interface ArtifactManagerProps {
    artifact: UIArtifact;
    setArtifact: React.Dispatch<React.SetStateAction<UIArtifact>>;
    documents: Document[];
    isLoading: boolean;
    onSaveContent: (content: string, debounce: boolean) => void;
    sendMessage: (message: any) => void;
    isReadonly?: boolean;
    isAuthenticated: boolean;
}

export function ArtifactManager({
    artifact,
    setArtifact,
    documents,
    isLoading,
    onSaveContent,
    sendMessage,
    isReadonly = false,
    isAuthenticated,
}: ArtifactManagerProps) {
    const [metadata, setMetadata] = useState<any>({});
    const [mode, setMode] = useState<"edit" | "diff">("edit");
    const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
    const [document, setDocument] = useState<Document | null>(null);

    const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === artifact.kind
    );

    useEffect(() => {
        if (documents && documents.length > 0) {
            const mostRecentDocumentIndex = documents.findLastIndex(
                (doc) => doc.messageId === artifact.messageId
            );

            if (mostRecentDocumentIndex !== -1) {
                const mostRecentDocument = documents[mostRecentDocumentIndex];
                setDocument(mostRecentDocument);
                setCurrentVersionIndex(mostRecentDocumentIndex);
                setArtifact((currentArtifact) => ({
                    ...currentArtifact,
                    content: mostRecentDocument.content ?? "",
                }));
            } else {
                const doc = documents.at(-1);
                if (doc) {
                    setDocument(doc);
                    setCurrentVersionIndex(documents.length - 1);
                    setArtifact((currentArtifact) => ({
                        ...currentArtifact,
                        content: doc.content ?? "",
                    }));
                }
            }
        }
    }, [documents, setArtifact, artifact.messageId]);

    useEffect(() => {
        if (artifactDefinition?.initialize) {
            artifactDefinition.initialize({
                documentId: artifact.documentId,
                setMetadata,
                isAuthenticated,
            });
        }
    }, [artifactDefinition, artifact.documentId, isAuthenticated]);

    const handleVersionChange = useCallback(
        (type: "next" | "prev" | "toggle" | "latest") => {
            if (!documents) return;

            if (type === "latest") {
                setCurrentVersionIndex(documents.length - 1);
                setMode("edit");
            }

            if (type === "toggle") {
                setMode((mode) => (mode === "edit" ? "diff" : "edit"));
            }

            if (type === "prev") {
                if (currentVersionIndex > 0) {
                    setCurrentVersionIndex((index) => index - 1);
                }
            } else if (type === "next") {
                if (currentVersionIndex < documents.length - 1) {
                    setCurrentVersionIndex((index) => index + 1);
                }
            }
        },
        [documents, currentVersionIndex]
    );

    const getDocumentContentById = useCallback(
        (index: number) => {
            if (!documents) return "";
            if (!documents[index]) return "";
            return documents[index].content ?? "";
        },
        [documents]
    );

    if (!artifactDefinition) {
        return (
            <Card>
                <CardContent className="p-4">
                    <p className="text-muted-foreground">
                        Unknown artifact type: {artifact.kind}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const ContentComponent = artifactDefinition.content;
    const isCurrentVersion = currentVersionIndex === documents.length - 1;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{artifact.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Badge variant="outline">{artifact.kind}</Badge>
                        {artifact.status === "streaming" && (
                            <Badge variant="secondary">Streaming...</Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex">
                    <div className="flex-1">
                        <ContentComponent
                            title={artifact.title}
                            content={artifact.content}
                            mode={mode}
                            isCurrentVersion={isCurrentVersion}
                            currentVersionIndex={currentVersionIndex}
                            status={artifact.status}
                            suggestions={metadata.suggestions || []}
                            onSaveContent={onSaveContent}
                            isInline={false}
                            getDocumentContentById={getDocumentContentById}
                            isLoading={isLoading}
                            metadata={metadata}
                            setMetadata={setMetadata}
                            isReadonly={isReadonly}
                        />
                    </div>

                    {artifactDefinition.actions.length > 0 && (
                        <div className="w-64 border-l">
                            <div className="p-4">
                                <h4 className="font-semibold mb-3">Actions</h4>
                                <div className="space-y-2">
                                    {artifactDefinition.actions.map((action, index) => {
                                        const isDisabled = action.isDisabled?.({
                                            content: artifact.content,
                                            handleVersionChange,
                                            currentVersionIndex,
                                            isCurrentVersion,
                                            mode,
                                            metadata,
                                            setMetadata,
                                            isReadonly,
                                        });

                                        return (
                                            <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() =>
                                                    action.onClick({
                                                        content: artifact.content,
                                                        handleVersionChange,
                                                        currentVersionIndex,
                                                        isCurrentVersion,
                                                        mode,
                                                        metadata,
                                                        setMetadata,
                                                        isReadonly,
                                                    })
                                                }
                                                disabled={isDisabled}
                                            >
                                                {action.icon}
                                                <span className="ml-2">{action.description}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {artifactDefinition.toolbar.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="p-4">
                                        <h4 className="font-semibold mb-3">Tools</h4>
                                        <div className="space-y-2">
                                            {artifactDefinition.toolbar.map((tool, index) => (
                                                <Button
                                                    key={index}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() =>
                                                        tool.onClick({ sendMessage })
                                                    }
                                                >
                                                    {tool.icon}
                                                    <span className="ml-2">{tool.description}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}