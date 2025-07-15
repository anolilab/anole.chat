import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@anole/convex/api";
import { Assistant } from "@/features/chat/components/assistant";

const PublicThreadPage = () => {
    const { publicToken } = Route.useParams();

    const publicThread = useQuery(api.chat.sharing.getPublicThread, {
        publicAccessToken: publicToken
    });

    if (!publicThread) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Thread Not Found</h1>
                    <p className="text-muted-foreground">
                        This thread is either private or the link is invalid.
                    </p>
                </div>
            </div>
        );
    }

    // For public threads, we need to handle authentication differently
    // This is a simplified version - in a real implementation, you might want
    // to create a special public session or handle this differently
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Public Thread Access</h1>
                <p className="text-muted-foreground mb-4">
                    Thread: {publicThread.title || "Untitled"}
                </p>
                <p className="text-sm text-muted-foreground">
                    Public thread access is available. Please sign in to view the full thread.
                </p>
            </div>
        </div>
    );
};

export const Route = createFileRoute("/(public)/thread/$publicToken")({
    component: PublicThreadPage,
});