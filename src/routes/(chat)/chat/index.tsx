import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

// TODO: Fix the doubled notification when redirecting to /chat
const ChatPage = () => {
    const search = Route.useSearch();
    const router = useRouter();

    // Handle notifications when redirectReason is present
        if (search.redirectReason) {
            let message = "";
            let description = "";

            switch (search.redirectReason) {
                case "thread-not-found":
                    message = "Thread not found";
                    description = "The conversation you were looking for doesn't exist or has been deleted.";
                    break;
                case "validation-error":
                    message = "Unable to load conversation";
                    description = "There was an error loading the conversation. Please try again.";
                    break;
                case "no-session":
                    message = "Session expired";
                    description = "Please sign in to access your conversations.";
                    break;
                case "thread-deleted":
                    message = "Conversation deleted";
                    description = "The conversation you were viewing has been deleted.";
                    break;
                default:
                    message = "Redirected to chat";
                    description = "You've been redirected to the main chat page.";
            }

            // Show toast notification
            toast.error(message, {
                description,
                duration: 5000,
            });

            // Clean the URL by navigating to the same route without search params
            router.history.replace("/chat");
        }

    return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-semibold mb-2">Welcome to Chat</h1>
                <p className="text-muted-foreground">Start a new conversation or select an existing thread from the sidebar.</p>
            </div>
        </div>
    );
};

export const Route = createFileRoute("/(chat)/chat/")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            redirectReason: search.redirectReason as string | undefined,
        };
    },
    component: ChatPage,
});
