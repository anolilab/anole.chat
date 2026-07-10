import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { UIArtifact, Document } from "../types/artifacts";

export function useArtifact() {
    const [artifact, setArtifact] = useState<UIArtifact>({
        title: "",
        documentId: "",
        kind: "text",
        content: "",
        messageId: "",
        isVisible: false,
        status: "idle",
        boundingBox: {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
        },
    });

    const [metadata, setMetadata] = useState<any>({});

    return {
        artifact,
        setArtifact,
        metadata,
        setMetadata,
    };
}

export function useDocuments(documentId: string, enabled: boolean = true) {
    const { isAuthenticated } = useConvexAuth();

    return useQuery({
        queryKey: ["documents", documentId],
        queryFn: async () => {
            if (!documentId || documentId === "init") return [];
            // TODO: Implement actual Convex query
            return [] as Document[];
        },
        enabled: enabled && isAuthenticated && !!documentId,
    });
}

export function useSaveDocument(
    documentId: string,
    messageId: string,
    options?: {
        onSettled?: () => void;
    }
) {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useConvexAuth();

    return useMutation({
        mutationFn: async ({
            id,
            title,
            content,
            kind,
        }: {
            id: string;
            title: string;
            content: string;
            kind: "text" | "code" | "sheet";
        }) => {
            if (!isAuthenticated) return;
            // TODO: Implement actual Convex mutation
            console.log("Saving document:", { id, title, content, kind, messageId });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["documents", documentId] });
            options?.onSettled?.();
        },
    });
}

export function useArtifactStream(artifact: UIArtifact) {
    useEffect(() => {
        // Handle stream parts here
        // This would be called when receiving streaming data from the AI
    }, [artifact]);
}