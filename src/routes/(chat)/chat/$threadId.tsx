import { Assistant } from "@/routes/(chat)/-components/assistant";
import { redirect, createFileRoute } from "@tanstack/react-router";
import { api } from "@cvx/_generated/api";
import { getServerSession } from "@/lib/auth/client";
import { ModelProvider } from "@/routes/(chat)/-components/model-context";
import { DEFAULT_MODEL } from "@cvx/agents";

const ChatPage = () => {
    const { threadId } = Route.useParams();

    return <Assistant threadId={threadId} />;
};

export const Route = createFileRoute("/(chat)/chat/$threadId")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            initialMessage: search.initialMessage as string | undefined,
        };
    },
    beforeLoad: async ({ context, params }) => {
        const session = await getServerSession();

        if (params.threadId === "new") {
            const newThreadId = await context.convex.mutation(api.chat.createThread, {
                model: DEFAULT_MODEL,
                sessionToken: session?.session?.token as string,
            });

            throw redirect({
                to: "/chat/$threadId",
                params: { threadId: newThreadId },
                search: { initialMessage: undefined },
                replace: true,
            });
        }

        // Validate that the threadId exists in the database
        if (session?.session?.token) {
            try {
                const threadExists = await context.convex.query(api.chat.validateThreadExists, {
                    threadId: params.threadId,
                    sessionToken: session.session.token,
                });

                if (!threadExists) {
                    throw redirect({
                        to: "/chat",
                        search: { redirectReason: "thread-not-found" },
                        replace: true,
                    });
                }
            } catch (error) {
                // If validation fails (e.g., network error), redirect to /chat
                console.error("Failed to validate thread:", error);

                throw redirect({
                    to: "/chat",
                    search: { redirectReason: "validation-error" },
                    replace: true,
                });
            }
        } else {
            // If no session, redirect to /chat
            throw redirect({
                to: "/chat",
                search: { redirectReason: "no-session" },
                replace: true,
            });
        }
    },
    component: ChatPage,
});
