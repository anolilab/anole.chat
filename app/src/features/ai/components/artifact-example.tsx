import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArtifactManager, useArtifact, useDocuments, useSaveDocument } from "../index";
import type { ArtifactKind, UIArtifact } from "../types/artifacts";

export function ArtifactExample() {
    const { artifact, setArtifact } = useArtifact();
    const [isAuthenticated] = useState(true); // Replace with actual auth state

    const { data: documents, isLoading } = useDocuments(artifact.documentId, true);
    const saveDocumentMutation = useSaveDocument(artifact.documentId, artifact.messageId);

    const handleSaveContent = (content: string, debounce: boolean) => {
        if (artifact.documentId && artifact.messageId) {
            saveDocumentMutation.mutate({
                id: artifact.documentId,
                title: artifact.title,
                content,
                kind: artifact.kind,
            });
        }
    };

    const handleSendMessage = (message: any) => {
        console.log("Sending message:", message);
        // TODO: Implement actual message sending
    };

    const createArtifact = (kind: ArtifactKind) => {
        const newArtifact: UIArtifact = {
            title: `New ${kind} Document`,
            documentId: `doc_${Date.now()}`,
            kind,
            content: "",
            messageId: `msg_${Date.now()}`,
            isVisible: true,
            status: "idle",
            boundingBox: {
                top: 0,
                left: 0,
                width: 800,
                height: 600,
            },
        };
        setArtifact(newArtifact);
    };

    if (!artifact.isVisible) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            onClick={() => createArtifact("text")}
                            className="h-32 flex flex-col items-center justify-center space-y-2"
                        >
                            <Badge variant="outline">Text</Badge>
                            <span className="text-sm">Create a text document</span>
                        </Button>
                        <Button
                            onClick={() => createArtifact("code")}
                            className="h-32 flex flex-col items-center justify-center space-y-2"
                        >
                            <Badge variant="outline">Code</Badge>
                            <span className="text-sm">Create a code document</span>
                        </Button>
                        <Button
                            onClick={() => createArtifact("sheet")}
                            className="h-32 flex flex-col items-center justify-center space-y-2"
                        >
                            <Badge variant="outline">Sheet</Badge>
                            <span className="text-sm">Create a spreadsheet</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            <ArtifactManager
                artifact={artifact}
                setArtifact={setArtifact}
                documents={documents || []}
                isLoading={isLoading}
                onSaveContent={handleSaveContent}
                sendMessage={handleSendMessage}
                isReadonly={false}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}